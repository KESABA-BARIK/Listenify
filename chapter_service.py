import json

from groq import Groq
import os

from pdf_extractor import extract_headings
from summary_service import API_KEY
client = Groq(api_key=API_KEY)

WPM = 150

def estimate_timestamps(chapters: list[str], script: str) -> list[dict]:
    words = script.split()
    total_words = len(words)
    n = len(chapters)
    segment_size = max(1, total_words // n)

    result = []
    for i, title in enumerate(chapters):
        word_offset = i * segment_size
        total_seconds = int((word_offset / WPM) * 60)
        minutes = total_seconds // 60
        seconds = total_seconds % 60
        result.append({
            "index": i + 1,
            "title": title,
            "timestamp": f"{minutes:02d}:{seconds:02d}",
            "start_seconds": total_seconds,
        })

    return result


def _llm_detect_chapters(script: str, n_chapters: int = 5) -> list[str]:
    word_count = len(script.split())
    # aim for roughly one chapter every 200 words, between 3 and 8
    n_chapters = max(3, min(8, word_count // 200))

    prompt = f"""
    You are analyzing a podcast transcript to create chapter markers for a podcast player.

    Read the transcript below and identify exactly {n_chapters} natural topic sections.
    Each chapter title must:
    - Be 3 to 6 words
    - Describe what is actually discussed in that section
    - Sound like a real podcast chapter (e.g. "How transformers learn language", "Limitations of the approach")
    - NOT be generic (avoid "Introduction", "Part 1", "Discussion" alone)

    Return ONLY a valid JSON array of {n_chapters} chapter title strings.
    No explanation, no markdown fences, no extra text.

    Example output:
    ["Why language models need context", "The attention mechanism explained", "Training data and its problems", "Real world applications today", "What comes next in research"]
    
    Script:
    {script[:6000]}
    """

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system",
             "content": "You create podcast chapter markers. Return only valid JSON arrays of strings"},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_completion_tokens=300,
    )

    raw = response.choices[0].message.content.strip()

    # strip markdown fences if model added them
    raw = raw.replace("```json", "").replace("```", "").strip()

    try:
        chapters = json.loads(raw)
        if isinstance(chapters, list) and all(isinstance(c, str) for c in chapters):
            return chapters
    except json.JSONDecodeError:
        pass

    # hard fallback — generic chapter names
    print(f"[chapters] LLM returned unparseable output: {raw[:200]}")
    return [f"Chapter {i + 1}" for i in range(n_chapters)]

def generate_chapters(script: str) -> list[dict]:
    chapter_titles = _llm_detect_chapters(script)
    chapters = estimate_timestamps(chapter_titles, script)

    print(f"[chapters] final chapter list:")
    for ch in chapters:
        print(f"  {ch['timestamp']} — {ch['title']}")

    return chapters

def chapters_to_transcript_header(chapters: list[dict]) -> str:
    lines = ["=== CHAPTERS ==="]
    for ch in chapters:
        lines.append(f"{ch['timestamp']}  {ch['title']}")
    lines.append("=" * 16)
    lines.append("")
    return "\n".join(lines)