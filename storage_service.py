import os
from supabase_client import get_supabase


BUCKET = "podcasts"


def _bucket_path(user_id: str, job_id: str, filename: str) -> str:
    return f"{user_id}/{job_id}/{filename}"


def upload_audio(local_path: str, user_id: str, job_id: str) -> str:
    """
    Uploads the merged MP3 to Supabase Storage.
    Returns the public URL.
    """
    supabase = get_supabase()
    bucket_path = _bucket_path(user_id, job_id, "audio.mp3")

    with open(local_path, "rb") as f:
        supabase.storage.from_(BUCKET).upload(
            path=bucket_path,
            file=f,
            file_options={"content-type": "audio/mpeg", "upsert": "true"},
        )

    return supabase.storage.from_(BUCKET).get_public_url(bucket_path)


def upload_transcript(local_path: str, user_id: str, job_id: str) -> str:
    """
    Uploads the transcript text file to Supabase Storage.
    Returns the public URL.
    """
    supabase = get_supabase()
    bucket_path = _bucket_path(user_id, job_id, "transcript.txt")

    with open(local_path, "rb") as f:
        supabase.storage.from_(BUCKET).upload(
            path=bucket_path,
            file=f,
            file_options={"content-type": "text/plain", "upsert": "true"},
        )

    return supabase.storage.from_(BUCKET).get_public_url(bucket_path)


def delete_job_files(user_id: str, job_id: str) -> None:
    """
    Removes all storage files for a job. Call this when a user deletes a podcast.
    """
    supabase = get_supabase()
    paths = [
        _bucket_path(user_id, job_id, "audio.mp3"),
        _bucket_path(user_id, job_id, "transcript.txt"),
    ]
    supabase.storage.from_(BUCKET).remove(paths)
