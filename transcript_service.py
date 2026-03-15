import os

def save_transcript(script: str, job_id: str) -> str:
    """
       Saves the full podcast script as a plain text transcript.
       Returns the path to the saved file.
       """
    os.makedirs("transcripts", exist_ok=True)
    transcript_path = f"transcripts/{job_id}_transcript.txt"

    with open(transcript_path, "w", encoding="utf-8") as f:
        f.write(script)

    return transcript_path