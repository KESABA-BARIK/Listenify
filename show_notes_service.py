import os
from groq import Groq
import json

from summary_service import API_KEY
client = Groq(api_key=API_KEY)


def chunk_text(text: str, max_chars: int = 4000):
    chunks = []
    start = 0
    while start < len(text):
        chunks.append(text[start:start + max_chars])
        start += max_chars
    return chunks


def merge_show_notes(notes_list):
    merged = {
        "summary": "",
        "key_terms": [],
        "findings": []
    }

    for notes in notes_list:
        merged["key_terms"].extend(notes.get("key_terms", []))
        merged["findings"].extend(notes.get("findings", []))

    # Deduplicate key terms
    seen = set()
    unique_terms = []
    for item in merged["key_terms"]:
        if item["term"] not in seen:
            seen.add(item["term"])
            unique_terms.append(item)

    merged["key_terms"] = unique_terms[:15]
    merged["findings"] = merged["findings"][:15]

    return merged


def _generate_show_notes_chunk(script: str, language: str = "English") -> dict:
    prompt = f"""
Extract structured show notes from this transcript.

LANGUAGE: {language}

Return JSON:
{{
  "summary": "2-3 sentences",
  "key_terms": [{{"term": "...", "definition": "..."}}],
  "findings": ["..."]
}}

Transcript:
{script}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "Return only valid JSON. No markdown. "
                    f"All text must be in {language}."
                )
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_completion_tokens=800,
    )

    raw = response.choices[0].message.content.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        print(f"[show_notes] chunk parse failed: {raw[:200]}")
        return {"summary": "", "key_terms": [], "findings": []}


# ✅ MAIN FUNCTION (SAFE)
def generate_show_notes(script: str, language: str = "English") -> dict:
    try:
        # 🔥 STEP 1: chunk input
        chunks = chunk_text(script, 4000)

        partial_notes = []

        # 🔥 STEP 2: process each chunk safely
        for chunk in chunks:
            notes = _generate_show_notes_chunk(chunk, language)
            if notes:
                partial_notes.append(notes)

        if not partial_notes:
            return {"summary": "", "key_terms": [], "findings": []}

        # 🔥 STEP 3: merge results
        merged = merge_show_notes(partial_notes)

        # 🔥 STEP 4: generate better summary from SMALL input
        summary_source = " ".join(chunks[:2])  # only first chunks
        summary_notes = _generate_show_notes_chunk(summary_source, language)
        merged["summary"] = summary_notes.get("summary", "")

        print(f"[show_notes] chunks={len(chunks)}, terms={len(merged['key_terms'])}, findings={len(merged['findings'])}")

        return merged

    except Exception as e:
        print(f"[show_notes] failed: {str(e)}")
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