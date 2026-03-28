import os
from groq import Groq
import json

from summary_service import API_KEY
client = Groq(api_key=API_KEY)


def generate_show_notes(script: str, language: str = "English") -> dict:
    prompt = f"""
You are an expert podcast producer and science communicator.

Analyze this podcast transcript from a technical research paper and extract rich, useful show notes.

LANGUAGE: All content must be written entirely in {language}. Only JSON keys stay in English.

Extract the following:

1. **key_terms** (8–12 terms): The most important technical or domain-specific concepts a listener needs to understand.
   - Pick terms that are central to the paper's contribution, not generic CS terms.
   - Each definition must be one clear sentence a non-expert can understand.
   - Good: explains what the term IS and why it MATTERS in this context.
   - Bad: vague dictionary definitions.

2. **findings** (6–10 items): The most important takeaways, results, and contributions.
   - Lead with the most impactful finding first.
   - Include concrete numbers/metrics if mentioned (e.g. "1.5x faster", "7x improvement").
   - Each finding must be a complete, standalone sentence — not a fragment.
   - Focus on what makes this paper's contribution novel or significant.

3. **summary** (2–3 sentences): A plain-English overview of what this paper does and why it matters.
   Write it as if explaining to a smart friend who isn't in the field.

Return ONLY valid JSON, no markdown, no extra text:

{{
  "summary": "2-3 sentence plain-English overview in {language}.",
  "key_terms": [
    {{"term": "Term name in {language}", "definition": "One clear sentence in {language}"}},
    ...
  ],
  "findings": [
    "Most impactful finding with concrete details in {language}.",
    ...
  ]
}}

Transcript:
{script}
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a technical podcast producer. "
                    "Return only valid JSON. No markdown. No preamble. "
                    f"All text values must be in {language}. "
                    "Be specific — include numbers and concrete details where available."
                )
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_completion_tokens=1500,
    )

    raw = response.choices[0].message.content.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()

    try:
        notes = json.loads(raw)
        if "key_terms" in notes and "findings" in notes:
            print(f"[show_notes] {len(notes['key_terms'])} terms, {len(notes['findings'])} findings, summary={'yes' if notes.get('summary') else 'no'}")
            return notes
    except json.JSONDecodeError:
        pass

    print(f"[show_notes] parse failed: {raw[:200]}")
    return {"summary": "", "key_terms": [], "findings": []}

def show_notes_to_text(notes: dict) -> str:
    lines = ["", "=== SHOW NOTES ===", ""]

    if notes.get("summary"):
        lines.append("SUMMARY")
        lines.append("-" * 7)
        lines.append(notes["summary"])
        lines.append("")

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