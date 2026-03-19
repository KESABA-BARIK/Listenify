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
        "max_tokens": 8192,
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


def generate_podcast_script(summary, length: str="full", language: str="English", difficulty: str=DIFFICULTY, debate: bool=False) :
    settings = LENGTH_SCRIPT_SETTINGS.get(length, LENGTH_SCRIPT_SETTINGS["full"])
    diff = DIFFICULTY_SETTINGS.get(difficulty, DIFFICULTY_SETTINGS["intermediate"])
    debate_bl = DEBATE_INSTRUCTION if debate else (
        "Keep the tone collaborative. "
        "The host is curious and supportive, not adversarial."
    )
    prompt = f"""
    You are generating a podcast conversation.

    Turn the following research summary into an engaging discussion
    between a Host and an Expert.
    
    Target audience: {diff["audience"]}
    
    Tone and style: {diff["style"]}
    
    {debate_bl}

    Additional rules:
    - Write the ENTIRE conversation in {language}. Every word must be in {language}.
    - Do not repeat the summary verbatim.
    - {settings["instruction"]}
 
    Format strictly like (labels Host: and Expert: must stay in English even if content is in {language}):
    
    Host: ...
    Expert: ...
    Host: ...
    Expert: ...

    Summary:
    {summary}
    """

    system_msg = (
        f"Convert summaries into a podcast conversation between Host and Expert "
        f"pitched at {diff['audience']}. "
        f"{'The host is a sharp, challenging interviewer who pushes back and probes weaknesses.' if debate else 'The host is curious and collaborative.'} "
        f"Always respond entirely in {language}."
    )

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_msg},
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.8 if debate else 0.7,
        max_completion_tokens=settings["max_tokens"],
    )

    script = response.choices[0].message.content

    print("\nprompt: ", prompt)
    print("Podcast: ", script)

    return clean_podcast_script(script)

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