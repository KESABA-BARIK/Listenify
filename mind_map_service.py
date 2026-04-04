import json
import os
import time
import re
from groq import Groq

API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=API_KEY)

MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]

MODEL_CONFIGS = {
    "llama-3.3-70b-versatile": {"temp": 0.3, "max_tokens": 2000},
    "llama-3.1-8b-instant":    {"temp": 0.35, "max_tokens": 1600},
}


def _call_llm(messages, model):
    config = MODEL_CONFIGS.get(model, {})
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=config.get("temp", 0.35),
        max_completion_tokens=config.get("max_tokens", 1600),
        timeout=30,
    )
    return response.choices[0].message.content.strip()


def _call_with_fallback(messages):
    for model in MODELS:
        for attempt in range(2):
            try:
                print(f"[mind_map] model={model} attempt={attempt+1}")
                return _call_llm(messages, model)
            except Exception as e:
                err = str(e)
                if "rate_limit" in err or "429" in err:
                    wait = 6 * (attempt + 1)
                    print(f"[mind_map] rate limit — waiting {wait}s")
                    time.sleep(wait)
                else:
                    print(f"[mind_map] {model} failed: {e}")
                    break
    raise Exception("All models failed for mind map generation")


def _clean_json(raw: str) -> str:
    raw = raw.replace("```json", "").replace("```", "").strip()
    start = raw.find("{")
    end   = raw.rfind("}")
    if start != -1 and end != -1:
        raw = raw[start:end + 1]
    return raw


def _quick_fix(raw: str) -> str:
    raw = re.sub(r'([{,]\s*)(\w+):', r'\1"\2":', raw)
    raw = re.sub(r',\s*([}\]])', r'\1', raw)
    return raw


def _llm_repair(raw: str) -> str:
    prompt = f"""Fix this JSON so it is strictly valid.
Rules: all keys in double quotes, no trailing commas, no comments, no extra text.
Return ONLY the fixed JSON.

{raw}"""
    fixed = _call_with_fallback([
        {"role": "system", "content": "Return only valid JSON. No explanation."},
        {"role": "user",   "content": prompt},
    ])
    return _clean_json(fixed)


def _parse_json(raw: str) -> dict:
    """Try direct parse → quick fix → LLM repair."""
    clean = _clean_json(raw)
    for attempt, fn in enumerate([
        lambda r: r,
        _quick_fix,
        _llm_repair,
    ]):
        try:
            return json.loads(fn(clean))
        except Exception as e:
            print(f"[mind_map] parse attempt {attempt+1} failed: {e}")
    raise ValueError("Could not parse mind map JSON after 3 attempts")


def _validate(data: dict) -> bool:
    if not isinstance(data, dict):
        return False
    if "central_topic" not in data or "branches" not in data:
        return False
    if not isinstance(data["branches"], list) or len(data["branches"]) < 2:
        return False
    for b in data["branches"]:
        if "topic" not in b or "subtopics" not in b:
            return False
        if not isinstance(b["subtopics"], list) or len(b["subtopics"]) == 0:
            return False
    return True


PROMPT = """You are a research analyst creating a structured knowledge map from a podcast transcript about a research paper.

Your task: extract the key intellectual structure of the paper as a mind map.

STRICT OUTPUT FORMAT — return ONLY valid JSON, no markdown, no explanation:
{{
  "central_topic": "Short title of the paper or main idea (max 8 words)",
  "branches": [
    {{
      "topic": "Branch title (2-5 words, concrete not generic)",
      "color": "#hex",
      "subtopics": [
        "Specific insight or finding — one clear sentence",
        "Another specific insight — one clear sentence"
      ]
    }}
  ]
}}

RULES:
1. central_topic: the core claim or title of the paper, 5-8 words max
2. branches: 5-8 branches (never fewer than 4, never more than 10)
3. Each branch topic: a concrete system, method, or concept — NOT generic labels like "Introduction" or "Conclusion"
4. Each branch must have 2-4 subtopics
5. Subtopics: specific, factual, one sentence each. Format: plain sentence, no "Concept:" prefix
6. color: assign a distinct readable hex color per branch from this palette:
   #3b82f6 #10b981 #f59e0b #ef4444 #8b5cf6 #ec4899 #14b8a6 #f97316 #6366f1 #84cc16
7. No repetition across branches
8. Language: {language}

Transcript:
{transcript}"""


def generate_mind_map(script: str, language: str = "English") -> dict:
    lang = language.capitalize()

    # Trim to avoid token overflow
    trimmed = script[:7000] if len(script) > 7000 else script

    messages = [
        {
            "role": "system",
            "content": f"You extract structured knowledge maps from research content. Return only valid JSON in {lang}.",
        },
        {
            "role": "user",
            "content": PROMPT.format(transcript=trimmed, language=lang),
        },
    ]

    try:
        raw  = _call_with_fallback(messages)
        data = _parse_json(raw)

        if not _validate(data):
            raise ValueError(f"Invalid structure: {list(data.keys())}")

        print(f"[mind_map] ✓ {len(data['branches'])} branches generated")
        return data

    except Exception as e:
        print(f"[mind_map] generation failed: {e}")
        return {
            "central_topic": "Research Paper Overview",
            "branches": [
                {
                    "topic": "Generation Failed",
                    "color": "#9ca3af",
                    "subtopics": [
                        "Mind map could not be generated for this paper.",
                        "Try regenerating or check the transcript.",
                    ],
                }
            ],
        }