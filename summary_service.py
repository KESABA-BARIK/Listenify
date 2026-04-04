import os
from groq import Groq

from pdf_extractor import chunk_text

API_KEY = os.getenv('GROQ_API_KEY')
client = Groq(api_key=API_KEY)


LENGTH_INSTRUCTIONS = {
    "brief": "Create a very short, high-level summary in 3-5 bullet points. Focus only on the core idea and main contribution.",
    "standard": "Create a balanced summary in 6-10 bullet points. Cover key ideas, methodology, and main findings.",
    "full": "Create a detailed, comprehensive summary in 10-15 bullet points. Include important results, methodology, limitations, and contributions."
}


def summarize_text(text: str, length: str = "full") -> list[str]:
    """
    Splits text into logical chunks and generates high-quality summaries.
    Returns a list of summary strings.
    """
    if not text or not text.strip():
        return ["No content to summarize."]

    # Get proper instruction based on length
    instruction = LENGTH_INSTRUCTIONS.get(length, LENGTH_INSTRUCTIONS["full"])

    # Chunk the text (we'll improve chunking too)
    chunks = chunk_text(text)   # assuming your existing function

    # For "brief", be more aggressive with chunk limit
    if length == "brief" and len(chunks) > 4:
        chunks = chunks[:4]

    summaries = []

    for i, chunk in enumerate(chunks):
        if not chunk.strip():
            continue

        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {
                        "role": "system",
                        "content": f"You are an expert academic summarizer. {instruction} Return only clean bullet points."
                    },
                    {
                        "role": "user",
                        "content": f"Text to summarize:\n\n{chunk}"
                    }
                ],
                temperature=0.3,
                max_tokens=400 if length == "full" else 300,
            )

            summary = response.choices[0].message.content.strip()
            summaries.append(summary)

            print(f"--- Summary {i+1}/{len(chunks)} ({length}) ---\n{summary}\n")

        except Exception as e:
            print(f"Error summarizing chunk {i+1}: {e}")
            summaries.append(f"[Summary failed for chunk {i+1}]")

    return summaries