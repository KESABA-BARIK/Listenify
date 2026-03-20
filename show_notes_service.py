import os
from groq import Groq
import json

from summary_service import API_KEY
client = Groq(api_key=API_KEY)


def generate_show_notes(script: str, language: str = "English") -> dict:

    prompt = f"""
You are creating show notes for a podcast episode.

Read the following podcast transcript and extract:

1. KEY TERMS: The 5 to 8 most important technical or domain-specific terms mentioned.
   For each term give a plain, one-sentence definition that a listener can understand.

2. MAIN FINDINGS: The 4 to 6 most important takeaways or conclusions from the episode.
   Each finding should be one clear sentence.

Return ONLY a valid JSON object in exactly this format, no markdown, no extra text:
{{
  "key_terms": [
    {{"term": "term name", "definition": "plain one-sentence definition"}},
    ...
  ],
  "findings": [
    "First main finding as a complete sentence.",
    ...
  ]
}}

Write all content in {language}.

Transcript:
{script[:6000]}
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": "You create structured podcast show notes. Return only valid JSON."
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_completion_tokens=800,
    )

    raw = response.choices[0].message.content.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()

    try:
        notes = json.loads(raw)
        if "key_terms" in notes and "findings" in notes:
            print(f"[show_notes] generated {len(notes['key_terms'])} terms, {len(notes['findings'])} findings")
            return notes
    except json.JSONDecodeError:
        pass

    # fallback — return empty structure rather than crashing the job
    print(f"[show_notes] LLM returned unparseable output: {raw[:200]}")
    return {"key_terms": [], "findings": []}


def show_notes_to_text(notes: dict) -> str:
    lines = ["", "=== SHOW NOTES ===", ""]

    if notes.get("findings"):
        lines.append("MAIN FINDINGS")
        lines.append("-" * 13)
        for i, finding in enumerate(notes["findings"], 1):
            lines.append(f"{i}. {finding}")
        lines.append("")

    if notes.get("key_terms"):
        lines.append("KEY TERMS")
        lines.append("-" * 9)
        for item in notes["key_terms"]:
            lines.append(f"• {item['term']}: {item['definition']}")
        lines.append("")

    lines.append("=" * 16)
    return "\n".join(lines)
