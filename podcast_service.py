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


def generate_podcast_script(summary, length: str="full", language: str="English"):
    settings = LENGTH_SCRIPT_SETTINGS.get(length, LENGTH_SCRIPT_SETTINGS["full"])
    prompt = f"""
    You are generating a podcast conversation.

    Turn the following research summary into an engaging discussion
    between a Host and an Expert.

    Rules:
    - Write the ENTIRE conversation in {language}.
    - Keep it conversational
    - Explain complex ideas simply
    - Do not repeat the summary verbatim
    - {settings["instruction"]}

    Format strictly like (labels Host: and Expert: must stay in English even if content is in {language}):

    Host: ...
    Expert: ...
    Host: ...
    Expert: ...

    Summary:
    {summary}
    """

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": "Convert summaries into a podcast conversation between Host and Expert  Always respond entirely in {language_name}."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.7,
        max_completion_tokens=settings["max_tokens"],
    )

    script = response.choices[0].message.content

    print("\n\n\n\nprompt: ", prompt)
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