import json
import os
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

QUIZ_PROMPT = """You are an expert educator creating a comprehension quiz based on a research podcast transcript.

Generate exactly 5 multiple choice questions that test genuine understanding of the content — not just recall of surface facts.

Rules:
- Questions should test different aspects: main finding, methodology, implications, limitations, key terms
- Each question must have exactly 4 options (A, B, C, D)
- Only one option is correct
- The explanation should be 1-2 sentences that cite the relevant part of the paper
- Difficulty should be {difficulty}

Return ONLY valid JSON in this exact format (no markdown, no preamble):
{{
  "questions": [
    {{
      "question": "Question text here?",
      "options": {{
        "A": "First option",
        "B": "Second option",
        "C": "Third option",
        "D": "Fourth option"
      }},
      "correct": "A",
      "explanation": "Explanation of why A is correct and the others are not."
    }}
  ]
}}

Transcript:
{transcript}
"""


def generate_quiz(transcript: str, difficulty: str = "intermediate") -> dict:
    """
    Generates 5 MCQ questions from the podcast transcript.
    Returns a dict with a 'questions' list.
    """
    # Trim transcript to avoid token limits
    trimmed = transcript[:6000] if len(transcript) > 6000 else transcript

    prompt = QUIZ_PROMPT.format(
        transcript=trimmed,
        difficulty=difficulty,
    )

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1500,
        temperature=0.4,
    )

    raw = response.choices[0].message.content.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    parsed = json.loads(raw)

    # Validate structure
    if "questions" not in parsed:
        raise ValueError("Quiz response missing 'questions' key")

    questions = parsed["questions"]
    if len(questions) < 3:
        raise ValueError(f"Too few questions generated: {len(questions)}")

    return parsed