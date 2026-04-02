import json
import uuid

import requests
import os
from groq import Groq
import re

API_KEY = os.getenv('GROQ_API_KEY')
client = Groq(api_key=API_KEY)

LENGTH_SCRIPT_SETTINGS = {
    "brief": {
        "max_tokens": 400,
        "instruction": "Keep it very short — 3 to 4 exchanges only. Hit only the single most important point."
    },
    "standard": {
        "max_tokens": 1200,
        "instruction": "Keep it moderate — 6 to 8 exchanges. Cover the key ideas without going into full detail."
    },
    "full": {
        "max_tokens": 4000,
        "instruction": "Be thorough — cover all major points with depth. Allow natural elaboration and follow-up questions."
    }
}

DIFFICULTY_SETTINGS = {
    "beginner": {
        "audience": "a complete beginner with no background knowledge",
        "style": (
            "Use simple everyday words only. Avoid all jargon — if a technical term must appear, "
            "immediately explain it using a real-world analogy. The host should ask naive, curious "
            "questions like a child would. Short sentences. Lots of analogies and examples."
        )
    },
    "intermediate": {
        "audience": "someone with a general science or engineering undergraduate background",
        "style": (
            "Use standard terminology but briefly explain niche or domain-specific concepts. "
            "The host can ask informed follow-up questions. Balance depth with accessibility. "
            "Analogies are welcome but not required for every concept."
        )
    },
    "advanced": {
        "audience": "a domain expert or researcher who is already familiar with the field",
        "style": (
            "Use precise technical language freely. No need to explain standard terminology. "
            "The host should ask sharp, critical questions — challenging assumptions, asking about "
            "limitations, edge cases, and how this compares to prior work. Go deep."
        )
    }
}

DIFFICULTY = "intermediate"

DEBATE_INSTRUCTION = """
Debate mode is ON. The conversation must feel like a genuine intellectual challenge, not a friendly Q&A.

The Host must:
- Push back on at least one claim the Expert makes ("But couldn't someone argue that...?")
- Play devil's advocate at least once ("Some critics would say this approach has a flaw — what's your response?")
- Ask directly about limitations or weaknesses ("What does this NOT solve? Where does it break down?")
- Not accept the first answer — follow up with "But why?" or "That still doesn't explain..."

The Expert must:
- Defend their position with evidence or reasoning, not just reassertion
- Acknowledge genuine weaknesses honestly rather than deflecting
- Push back on the Host's challenges when they are wrong

The conversation should feel like a BBC Hardtalk interview, not a TED talk Q&A.
Tension is good. Disagreement is good. Resolution at the end is optional.
"""

def clean_podcast_script(script):

    lines = script.split("\n")
    cleaned = []

    for line in lines:

        line = line.strip()

        if not line:
            continue

        # remove markdown headings
        if line.startswith("#"):
            continue

        # normalize HOST EXPERT
        line = re.sub(r"^\*\*?Host.*?:\*\*?", "Host:", line)
        line = re.sub(r"^\*\*?Expert.*?:\*\*?", "Expert:", line)

        line = line.replace("Host -", "Host:")
        line = line.replace("Expert -", "Expert:")
        line = line.replace("**", "")

        # remove stray markdown
        line = line.replace("**", "")

        cleaned.append(line)

    return "\n".join(cleaned)

def _extract_and_clean_json(raw: str) -> list[dict]:
    """
    Robustly extract a JSON array from LLM output that may have
    unescaped quotes, apostrophes, or other bad characters inside strings.
    """
    # Strip markdown fences
    raw = raw.replace("```json", "").replace("```", "").strip()

    # Find the outermost [ ... ] array
    start = raw.find("[")
    end = raw.rfind("]")
    if start == -1 or end == -1:
        raise ValueError("No JSON array found in response")
    raw = raw[start:end+1]

    # First attempt: direct parse
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Second attempt: fix unescaped single quotes inside strings
    # e.g. "text": "it's fine" -> "text": "it\'s fine"
    fixed = re.sub(r"(?<=: \")(.+?)(?=\",|\"\s*})",
                   lambda m: m.group(0).replace("'", "\\'"), raw)
    try:
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass

    # Third attempt: extract individual objects with regex
    # Pull each { ... } block and parse them one by one
    chunks = []
    for match in re.finditer(r'\{[^{}]+\}', raw, re.DOTALL):
        obj_str = match.group(0)
        try:
            obj = json.loads(obj_str)
            chunks.append(obj)
        except json.JSONDecodeError:
            # Try to salvage speaker and text at minimum
            speaker_m = re.search(r'"speaker"\s*:\s*"(HOST|EXPERT)"', obj_str)
            text_m    = re.search(r'"text"\s*:\s*"(.+?)"(?:\s*,|\s*})', obj_str, re.DOTALL)
            start_m   = re.search(r'"start_seconds"\s*:\s*(\d+(?:\.\d+)?)', obj_str)
            end_m     = re.search(r'"end_seconds"\s*:\s*(\d+(?:\.\d+)?)', obj_str)
            if speaker_m and text_m:
                chunks.append({
                    "speaker": speaker_m.group(1),
                    "text": text_m.group(1).replace('\\"', '"'),
                    "start_seconds": float(start_m.group(1)) if start_m else 0,
                    "end_seconds":   float(end_m.group(1))   if end_m   else 0,
                })
    if chunks:
        return chunks

    raise ValueError("Could not parse any chunks from LLM output")


def generate_podcast_script(
        summary: str,
        length: str = "full",
        language: str = "English",
        difficulty: str = "intermediate",
        debate: bool = False
) -> list[dict]:
    settings = LENGTH_SCRIPT_SETTINGS.get(length, LENGTH_SCRIPT_SETTINGS["full"])
    diff = DIFFICULTY_SETTINGS.get(difficulty, DIFFICULTY_SETTINGS["intermediate"])
    debate_instruction = DEBATE_INSTRUCTION if debate else "Keep the tone friendly, curious and collaborative."

    prompt = f"""
You are creating a natural podcast conversation.

Target audience: {diff["audience"]}
Style: {diff["style"]}

{debate_instruction}

CRITICAL JSON RULES:
- Return ONLY a valid JSON array. No markdown, no explanation, no text outside the array.
- Every string value must use double quotes.
- Do NOT use apostrophes or single quotes inside text values. 
  Write "it is" instead of "it's", "do not" instead of "don't", etc.
- Do NOT use double quotes inside text values.
- Timestamps must be realistic: ~3-4 seconds per word spoken aloud.
- Timestamps must be continuous (each start = previous end).

Format:
[
  {{"speaker": "HOST", "text": "Hello everyone", "start_seconds": 0, "end_seconds": 8}},
  {{"speaker": "EXPERT", "text": "Today we discuss", "start_seconds": 8, "end_seconds": 25}}
]

Summary:
{summary}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"Return only a valid JSON array. No markdown. No preamble. "
                        f"Spoken text must be in {language}. "
                        f"Never use apostrophes or quotes inside string values — "
                        f"use formal contractions instead (do not, it is, we are)."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,  # lower = more JSON-compliant output
            max_completion_tokens=settings["max_tokens"] + 400,
        )

        raw = response.choices[0].message.content.strip()
        chunks = _extract_and_clean_json(raw)

        if not isinstance(chunks, list):
            raise ValueError("Not a list")

        cleaned = []
        current_time = 0

        for c in chunks:
            if isinstance(c, dict) and c.get("speaker") in ["HOST", "EXPERT"]:
                text = str(c.get("text", "")).strip()
                if not text:
                    continue
                start = float(c.get("start_seconds", current_time))
                end   = float(c.get("end_seconds", current_time + max(8, len(text.split()) // 3)))

                cleaned.append({
                    "id":            str(uuid.uuid4())[:8],
                    "speaker":       c["speaker"],
                    "text":          text,
                    "start_seconds": start,
                    "end_seconds":   end,
                })
                current_time = end

        if cleaned:
            print(f"[podcast_script] Success: {len(cleaned)} timed chunks")
            return cleaned

        raise ValueError("No valid chunks after cleaning")

    except Exception as e:
        print(f"[podcast_script] Timed generation failed: {e}")
        return []

def generate_podcast_script_fallback(summary: str, language: str, debate: bool) -> list[dict]:
    """Simple fallback when timed generation fails"""
    # You can keep your old generate_podcast_script logic here and then split it
    script = "Host: Welcome to the show.\nExpert: Today we are discussing the paper."  # placeholder
    # ... split logic
    return []
    # TEMP MOCK (for development)
    # return """
    # Host: Welcome! Today we’re discussing the document.
    #
    # Expert: The document explains key concepts in machine learning.
    #
    # Host: Interesting! Can you give an example?
    #
    # Expert: Sure. It discusses supervised learning and how models learn from labeled data.
    #
    # Host: That’s helpful for beginners.
    # """