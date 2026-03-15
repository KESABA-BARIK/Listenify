import requests
import os
from groq import Groq

from pdf_extractor import chunk_text

API_KEY = os.getenv('GROQ_API_KEY')
client = Groq(api_key=API_KEY)

LENGTH_CHUNK_SIZE = {
    "brief":3,
    "standard":8,
    "full":None
}

def summarize_text(text, length: str = "full"):

    chunks = chunk_text(text)

    limit = LENGTH_CHUNK_SIZE.get(length)
    if limit is not None:
        chunks = chunks[:limit]

    summaries = []

    for i,chunk in enumerate(chunks):

        if not chunk.strip():
            continue

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "Summarize this text clearly in 4-8 bullet points."},
                {"role": "user", "content": chunk}
            ],
            temperature=0.2,
            max_tokens=300
        )

        summary = response.choices[0].message.content.strip()
        summaries.append(summary)

        print(f"\n--- Summary {i + 1} ---\n{summary}")

    return summaries