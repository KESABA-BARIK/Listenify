import os
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

QA_PROMPT = """You are the expert guest from a research podcast. The listener has paused the episode to ask you a question.

Answer conversationally but accurately — as if you're speaking, not writing an essay.
Keep your answer to 2-4 sentences unless the question genuinely requires more.
If the answer is in the transcript, cite it directly. If it's general knowledge beyond the paper, say so briefly.
Never make up facts about the paper.

Podcast transcript (for context):
{transcript}

Listener's question: {question}

Answer (conversational, 2-4 sentences):"""


def answer_question(question: str, transcript: str) -> str:
    """
    Answers a listener's question using the transcript as context.
    Returns a plain text answer.
    """
    # Trim transcript to avoid token limits
    trimmed = transcript[:5000] if len(transcript) > 5000 else transcript

    prompt = QA_PROMPT.format(
        transcript=trimmed,
        question=question.strip(),
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=300,
        temperature=0.5,
    )

    return response.choices[0].message.content.strip()