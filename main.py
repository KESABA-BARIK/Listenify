import json
import uuid
from email.policy import default

from fastapi import FastAPI, UploadFile, File, BackgroundTasks, APIRouter, Request, HTTPException, Form
from fastapi.responses import StreamingResponse
from fastapi.responses import FileResponse
import shutil
import os

from starlette.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware

from QA_service import answer_question
from chapter_service import generate_chapters, chapters_to_transcript_header
from language_config import get_language_config, DEFAULT_LANGUAGE, supported_languages
from mind_map_service import generate_mind_map
from pdf_extractor import extract_text
from podcast_service import generate_podcast_script, clean_podcast_script, DIFFICULTY
from quiz_service import generate_quiz
from show_notes_service import generate_show_notes, show_notes_to_text
from summary_service import summarize_text
from transcript_service import save_transcript
from tts_engine import text_to_audiobook, podcast_to_audio, rescale_chunks_to_audio
from audio_merger import merge_mp3_files
import redis
from storage_service import upload_audio, upload_transcript, delete_job_files
from rss_service import build_rss_feed
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from url_extractor import extract_text_from_url

REDIS_URL = os.getenv("REDIS_URL")
if REDIS_URL:
    r = redis.from_url(REDIS_URL, decode_responses=True)
else:
    r = redis.Redis(host="localhost", port=6379, decode_responses=True)

BASE_DIR = "/tmp" if os.path.exists("/tmp") and not os.name == "nt" else "."
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
AUDIOBOOKS_DIR = os.path.join(BASE_DIR, "audiobooks")
TRANSCRIPTS_DIR = os.path.join(BASE_DIR, "transcripts")

for d in (UPLOADS_DIR, AUDIOBOOKS_DIR, TRANSCRIPTS_DIR):
    os.makedirs(d, exist_ok=True)

app = FastAPI()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter()

CHUNK_SIZE = 1024 * 1024
VALID_LENGTHS = {"brief", "standard", "full"}
diff = {"beginner","intermediate","advanced"}

from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase_client import supabase

security = HTTPBearer()

app.mount("/", StaticFiles(directory="static"), name="static")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials

    user = supabase.auth.get_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    return user.user

def process_pdf(pdf_path: str,
                job_id: str,
                length:str="full",
                language:str="english",
                difficulty:str=DIFFICULTY,
                debate:bool=False,
                user_id: str = "", ):
    try:
        r.hset(f"audiobook:{job_id}", mapping={
            "status": "processing"
        })

        lang_config = get_language_config(language)

        # 1. Extract text
        text = extract_text(pdf_path)

        summary = summarize_text(text, length=length)
        all_chunks = []
        current_offset = 0

        for summary_chunk in summary:
            chunks = generate_podcast_script(
                summary_chunk,
                length=length,
                language=lang_config["llm_name"],
                difficulty=difficulty,
                debate=debate
            )
            if not chunks:
                continue
            for c in chunks:
                c["start_seconds"] = round(c["start_seconds"] + current_offset, 2)
                c["end_seconds"] = round(c["end_seconds"] + current_offset, 2)
            current_offset = chunks[-1]["end_seconds"]
            all_chunks.extend(chunks)

        # Now you have a full list of timed chunks
        full_script = "\n".join(
            f"{'Host' if c['speaker'] == 'HOST' else 'Expert'}: {c['text']}"
            for c in all_chunks
        )
        script_chunks_json = json.dumps(all_chunks, ensure_ascii=False)

        chapters = generate_chapters(full_script,language=lang_config["llm_name"])
        chaps_json = json.dumps(chapters, ensure_ascii=False)

        show_notes = generate_show_notes(full_script,language=lang_config["llm_name"])
        show_notes_json = json.dumps(show_notes, ensure_ascii=False)

        chap_header = chapters_to_transcript_header(chapters)
        show_notes_text = show_notes_to_text(show_notes)
        transcript_chaps = chap_header + full_script + show_notes_text

        transcript_path = save_transcript(transcript_chaps, job_id, TRANSCRIPTS_DIR)

        mind_map = generate_mind_map(full_script, language=lang_config["llm_name"])
        mind_map_json = json.dumps(mind_map, ensure_ascii=False)

        r.hset(f"audiobook:{job_id}", mapping={"transcript_path": transcript_path,"chapters":chaps_json,"show_notes": show_notes_json, "mind_map": mind_map_json})

        # 2. Generate audio chunks
        audio_files = podcast_to_audio(full_script, os.path.join(AUDIOBOOKS_DIR, job_id),host_voice=lang_config["host_voice"],expert_voice=lang_config["expert_voice"])

        # 3. Merge
        final_audio = os.path.join(AUDIOBOOKS_DIR, f"{job_id}_full.mp3")
        merge_mp3_files(audio_files, final_audio)

        from mutagen.mp3 import MP3
        real_duration = MP3(final_audio).info.length  # actual seconds
        all_chunks = rescale_chunks_to_audio(all_chunks, real_duration)
        script_chunks_json = json.dumps(all_chunks, ensure_ascii=False)

        audio_url = upload_audio(final_audio, user_id, job_id)
        transcript_url = upload_transcript(transcript_path, user_id, job_id)

        supabase.table("podcasts").update({
            "status": "ready",
            "audio_url": audio_url,  # now a real public URL
            "transcript_url": transcript_url,  # now a real public URL
            "chapters": json.loads(chaps_json),
            "show_notes": json.loads(show_notes_json),
            "mind_map": json.loads(mind_map_json),
        }).eq("job_id", job_id).execute()

        # 4. Mark completed
        r.hset(f"audiobook:{job_id}", mapping={
            "status": "ready",
            "final_path": final_audio,  # local path still used for streaming
            "audio_url": audio_url,
            "transcript_url": transcript_url,
            "length": length,
            "transcript_path": transcript_path,
            "chapters": chaps_json,
            "show_notes": show_notes_json,
            "language": language,
            "difficulty": difficulty,
            "debate": str(debate),
            "script_chunks": script_chunks_json,
            "mind_map": mind_map_json,
        })

    except Exception as e:

        supabase.table("podcasts").update({
            "status": "failed"
        }).eq("job_id", job_id).execute()

        r.hset(f"audiobook:{job_id}", mapping={
            "status": "failed",
            "error": str(e)
        })


def process_url(
        url: str,
        job_id: str,
        length: str = "full",
        language: str = "english",
        difficulty: str = DIFFICULTY,
        debate: bool = False,
        user_id: str = "",
):
    try:
        r.hset(f"audiobook:{job_id}", mapping={"status": "processing"})

        lang_config = get_language_config(language)

        # 1. Extract text from URL
        text = extract_text_from_url(url)

        # 2. Summarise
        summaries = summarize_text(text, length=length)

        # 3. Generate scripts
        scripts = []
        current_offset = 0

        for summary_chunk in summaries:
            chunks = generate_podcast_script(
                summary_chunk,
                length=length,
                language=lang_config["llm_name"],
                difficulty=difficulty,
                debate=debate,
            )
            if not chunks:
                continue
            for c in chunks:
                c["start_seconds"] = round(c["start_seconds"] + current_offset, 2)
                c["end_seconds"] = round(c["end_seconds"] + current_offset, 2)
            current_offset = chunks[-1]["end_seconds"]
            scripts.extend(chunks)

        full_script = "\n".join(
            f"{'Host' if c['speaker'] == 'HOST' else 'Expert'}: {c['text']}"
            for c in scripts
        )
        script_chunks_json = json.dumps(scripts, ensure_ascii=False)
        # 4. Chapters + show notes
        chapters = generate_chapters(full_script, language=lang_config["llm_name"])
        show_notes = generate_show_notes(full_script, language=lang_config["llm_name"])
        chapters_json = json.dumps(chapters, ensure_ascii=False)
        sn_json = json.dumps(show_notes, ensure_ascii=False)

        # 5. Transcript
        chapter_header = chapters_to_transcript_header(chapters)
        show_notes_text = show_notes_to_text(show_notes)
        full_transcript = chapter_header + full_script + show_notes_text
        transcript_path = save_transcript(full_transcript, job_id, TRANSCRIPTS_DIR)

        mind_map = generate_mind_map(full_script, language=lang_config["llm_name"])
        mind_map_json = json.dumps(mind_map, ensure_ascii=False)

        r.hset(f"audiobook:{job_id}", mapping={
            "transcript_path": transcript_path,
            "chapters": chapters_json,
            "show_notes": sn_json,
            "mind_map": mind_map_json,
        })

        # 6. Audio
        audio_files = podcast_to_audio(
            full_script,
            os.path.join(AUDIOBOOKS_DIR, job_id),
            host_voice=lang_config["host_voice"],
            expert_voice=lang_config["expert_voice"],
        )

        # 7. Merge
        final_audio = os.path.join(AUDIOBOOKS_DIR, f"{job_id}_full.mp3")
        merge_mp3_files(audio_files, final_audio)

        from mutagen.mp3 import MP3
        real_duration = MP3(final_audio).info.length  # actual seconds
        scripts = rescale_chunks_to_audio(scripts, real_duration)
        script_chunks_json = json.dumps(scripts, ensure_ascii=False)

        audio_url = upload_audio(final_audio, user_id, job_id)
        transcript_url = upload_transcript(transcript_path, user_id, job_id)

        supabase.table("podcasts").update({
            "status": "ready",
            "audio_url": audio_url,
            "transcript_url": transcript_url,
            "chapters": json.loads(chapters_json),
            "show_notes": json.loads(sn_json),
            "mind_map": json.loads(mind_map_json),
            "source_url": url,
        }).eq("job_id", job_id).execute()

        r.hset(f"audiobook:{job_id}", mapping={
            "status": "ready",
            "final_path": final_audio,
            "audio_url": audio_url,
            "transcript_url": transcript_url,
            "length": length,
            "language": language,
            "difficulty": difficulty,
            "debate": str(debate),
            "source_url": url,
            "script_chunks": script_chunks_json,
            "mind_map": mind_map_json,
            "transcript_path": transcript_path,
            "chapters": chapters_json,
            "show_notes": sn_json,
        })

    except Exception as e:
        r.hset(f"audiobook:{job_id}", mapping={
            "status": "failed",
            "error": str(e)
        })


@app.post("/upload")
async def upload_pdf(
        file: UploadFile = File(...),
        background_tasks: BackgroundTasks = BackgroundTasks(),
        user=Depends(get_current_user),
        length: str = Form(default="full"),
        language: str = Form(default=DEFAULT_LANGUAGE),
        difficulty: str = Form(default=DIFFICULTY),
        debate: bool = Form(default=False),
):
    if length not in VALID_LENGTHS:
        raise HTTPException(status_code=400, detail=f"Invalid length. Must be one of: {VALID_LENGTHS}")
    if difficulty not in diff:
        raise HTTPException(status_code=400, detail=f"Invalid difficulty. Must be one of: {diff}")
    try:
        get_language_config(language)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    job_id = str(uuid.uuid4())
    original_filename = file.filename or "upload.pdf"
    # Strip the job_id prefix from filename so we keep the user's original name
    pdf_path = os.path.join(UPLOADS_DIR, f"{job_id}_{original_filename}")

    with open(pdf_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Derive a human title from the filename (remove extension, replace underscores)
    title = os.path.splitext(original_filename)[0].replace("_", " ").replace("-", " ").strip()

    r.hset(f"audiobook:{job_id}", mapping={
        "status": "uploading",
        "length": length,
        "language": language,
        "difficulty": difficulty,
        "debate": str(debate),
    })

    supabase.table("podcasts").insert({
        "user_id": user.id,
        "job_id": job_id,
        "title": title,  # populated from filename
        "status": "processing",
        "length": length,
        "language": language,
        "difficulty": difficulty,
        "debate": debate,
    }).execute()

    # Pass user.id so the background task can write to Storage
    background_tasks.add_task(
        process_pdf, pdf_path, job_id, length, language, difficulty, debate, user.id
    )

    return {"job_id": job_id, "status": "started", "title": title}


@app.post("/upload-url")
async def upload_url(
        background_tasks: BackgroundTasks = BackgroundTasks(),
        user=Depends(get_current_user),
        url: str = Form(...),
        length: str = Form(default="full"),
        language: str = Form(default=DEFAULT_LANGUAGE),
        difficulty: str = Form(default=DIFFICULTY),
        debate: bool = Form(default=False),
):
    if length not in VALID_LENGTHS:
        raise HTTPException(status_code=400, detail=f"Invalid length. Must be one of: {VALID_LENGTHS}")
    if difficulty not in diff:
        raise HTTPException(status_code=400, detail=f"Invalid difficulty. Must be one of: {diff}")
    try:
        get_language_config(language)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    url = url.strip()
    if not url or "." not in url:
        raise HTTPException(status_code=400, detail="Please enter a valid URL.")

    job_id = str(uuid.uuid4())

    # Use the URL domain as a rough title until the paper title can be extracted
    from urllib.parse import urlparse
    domain = urlparse(url).netloc.replace("www.", "")
    title = f"Paper from {domain}"

    r.hset(f"audiobook:{job_id}", mapping={
        "status": "uploading",
        "length": length,
        "language": language,
        "difficulty": difficulty,
        "debate": str(debate),
        "source_url": url,
    })

    supabase.table("podcasts").insert({
        "user_id": user.id,
        "job_id": job_id,
        "title": title,
        "source_url": url,
        "status": "processing",
        "length": length,
        "language": language,
        "difficulty": difficulty,
        "debate": debate,
    }).execute()

    background_tasks.add_task(
        process_url, url, job_id, length, language, difficulty, debate, user.id
    )

    return {"job_id": job_id, "status": "started", "title": title, "source_url": url}


@app.delete("/my-podcasts/{job_id}")
def delete_podcast(job_id: str, user=Depends(get_current_user)):
    """
    Deletes a podcast from the DB and removes its files from Supabase Storage.
    RLS ensures users can only delete their own rows.
    """
    # Fetch first to confirm ownership (belt-and-suspenders on top of RLS)
    res = supabase.table("podcasts") \
        .select("user_id") \
        .eq("job_id", job_id) \
        .single() \
        .execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Podcast not found")
    if res.data["user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Not your podcast")

    # Remove from Storage
    delete_job_files(user.id, job_id)

    # Remove from DB
    supabase.table("podcasts").delete().eq("job_id", job_id).execute()

    # Clean Redis
    r.delete(f"audiobook:{job_id}")

    return {"deleted": True, "job_id": job_id}


@app.get("/languages")
def list_languages():
    """Returns all supported language names."""
    try:
        r.set("health:ping", "ok", ex=300)
    except Exception:
        pass
    return {"supported_languages": supported_languages()}
@app.get("/status/{job_id}")
def status(job_id: str, long_poll: bool = False):
    job = r.hgetall(f"audiobook:{job_id}")
    if not job:
        raise HTTPException(status_code=404, detail="Invalid job ID")

    # If still processing and long_poll is requested, wait a bit
    if long_poll and job.get("status") == "processing":
        # You can add small sleep here (max 10-15s) for true long polling
        pass

    return job

# @app.get("/stream/{job_id}/{chunk_index}")
# def stream_chunk(job_id: str, chunk_index: int):
#     chunks = JOB_CHUNKS.get(job_id)
#
#     if not chunks:
#         return {"error": "Job not ready"}
#
#     if chunk_index >= len(chunks):
#         return {"error": "Invalid chunk index"}
#
#     file_path = chunks[chunk_index]
#
#     def file_iterator():
#         with open(file_path, "rb") as f:
#             yield from f
#
#     return StreamingResponse(
#         file_iterator(),
#         media_type="audio/mpeg"
#     )

@app.get("/audiobook/{job_id}/chapters")
def chapters(job_id: str):
    """
    Returns a list of all chapters available for this job.
    :param job_id:
    :return: index title etc....
    """
    job = r.hgetall(f"audiobook:{job_id}")
    if not job:
        raise HTTPException(status_code=404, detail="Invalid job ID job not found")
    if job.get("status") != "ready":
        raise HTTPException(status_code=404, detail=f"Job status is '{job.get('status')}', not ready yet")
    chapters_raw = job.get("chapters")
    if not chapters_raw:
        raise HTTPException(status_code=404, detail="Invalid job ID job not found")
    return json.loads(chapters_raw)

@app.get("/audiobook/{job_id}/shownotes")
def get_show_notes(job_id: str):
    job = r.hgetall(f"audiobook:{job_id}")
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("status") != "ready":
        raise HTTPException(status_code=404,
                            detail=f"Job status is '{job.get('status')}', not ready yet")
    notes_raw = job.get("show_notes")
    if not notes_raw:
        raise HTTPException(status_code=404, detail="No show notes found for this job")
    return json.loads(notes_raw)

@app.get("/play/{job_id}")
def play_full(job_id: str):
    job = r.hgetall(f"audiobook:{job_id}")
    if not job or job.get("status") != "ready":
        raise HTTPException(status_code=404)

    return FileResponse(job["final_path"], media_type="audio/mpeg")



@app.get("/audiobook/{job_id}/stream")
async def stream_audiobook(job_id: str, request: Request):
    job = r.hgetall(f"audiobook:{job_id}")

    if not job or job.get("status") != "ready":
        raise HTTPException(status_code=404, detail="Audiobook not ready")

    file_path = job["final_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File missing")

    file_size = os.path.getsize(file_path)
    range_header = request.headers.get("range")

    def file_iterator(start=0, end=file_size):
        with open(file_path, "rb") as f:
            f.seek(start)
            remaining = end - start
            while remaining > 0:
                data = f.read(min(CHUNK_SIZE, remaining))
                if not data:
                    break
                remaining -= len(data)
                yield data

    if range_header:
        start = int(range_header.replace("bytes=", "").split("-")[0])
        end = file_size

        headers = {
            "Content-Range": f"bytes {start}-{end-1}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(end - start),
        }

        return StreamingResponse(
            file_iterator(start, end),
            status_code=206,
            media_type="audio/mpeg",
            headers=headers,
        )

    return StreamingResponse(
        file_iterator(),
        media_type="audio/mpeg",
        headers={"Accept-Ranges": "bytes"},
    )

@app.get("/audiobook/{job_id}/download")
def download_audiobook(job_id: str):
    job = r.hgetall(f"audiobook:{job_id}")
    if not job or job.get("status") != "ready":
        raise HTTPException(status_code=404)

    return FileResponse(
        job["final_path"],
        media_type="audio/mpeg",
        filename=f"{job_id}.mp3"
    )


@app.get("/audiobook/{job_id}/transcript")
def get_transcript(job_id: str):
    job = r.hgetall(f"audiobook:{job_id}")
    if not job or job.get("status") != "ready":
        raise HTTPException(status_code=404, detail="Audiobook not ready")
    transcript_path = job.get("transcript_path")
    if not transcript_path or not os.path.exists(transcript_path):
        raise HTTPException(status_code=404, detail="Transcript not found")
    with open(transcript_path, "r", encoding="utf-8") as f:
        content = f.read()
    return PlainTextResponse(content)


@app.get("/audiobook/{job_id}/transcript/download")
def download_transcript(job_id: str):
    job = r.hgetall(f"audiobook:{job_id}")
    if not job or job.get("status") != "ready":
        raise HTTPException(status_code=404, detail="Audiobook not ready")
    transcript_path = job.get("transcript_path")
    if not transcript_path or not os.path.exists(transcript_path):
        raise HTTPException(status_code=404, detail="Transcript not found")
    return FileResponse(transcript_path, media_type="text/plain",
                        filename=f"{job_id}_transcript.txt")

# quiz.........
@app.get("/audiobook/{job_id}/quiz")
def get_quiz(job_id: str, regenerate: bool = False):
    """
    Returns cached quiz if already generated, otherwise generates one.
    Cached in Redis so it's only generated once per job.
    """
    job = r.hgetall(f"audiobook:{job_id}")
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("status") != "ready":
        raise HTTPException(status_code=400, detail="Podcast not ready yet")

    # Return cached quiz if exists
    cached = job.get("quiz")
    if cached and not regenerate:
        import json as _json
        return _json.loads(cached)

    # Generate quiz from transcript
    transcript_path = job.get("transcript_path")
    if not transcript_path or not os.path.exists(transcript_path):
        raise HTTPException(status_code=404, detail="Transcript not found — cannot generate quiz")

    with open(transcript_path, "r", encoding="utf-8") as f:
        transcript = f.read()

    difficulty = job.get("difficulty", "intermediate")

    try:
        quiz = generate_quiz(transcript, difficulty=difficulty, regenerate=regenerate)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")

    # Cache in Redis
    import json as _json
    r.hset(f"audiobook:{job_id}", "quiz", _json.dumps(quiz, ensure_ascii=False))

    return quiz


# ── Q&A ───────────────────────────────────────────────────────

from pydantic import BaseModel

class QARequest(BaseModel):
    question: str


@app.post("/audiobook/{job_id}/ask")
def ask_question(job_id: str, body: QARequest):
    """
    Answers a listener's question using the podcast transcript as context.
    """
    job = r.hgetall(f"audiobook:{job_id}")
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("status") != "ready":
        raise HTTPException(status_code=400, detail="Podcast not ready yet")

    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    if len(question) > 500:
        raise HTTPException(status_code=400, detail="Question too long (max 500 chars)")

    transcript_path = job.get("transcript_path")
    if not transcript_path or not os.path.exists(transcript_path):
        raise HTTPException(status_code=404, detail="Transcript not found")

    with open(transcript_path, "r", encoding="utf-8") as f:
        transcript = f.read()

    try:
        answer = answer_question(question, transcript)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not answer question: {str(e)}")

    return {
        "question": question,
        "answer": answer,
    }

@app.get("/audiobook/{job_id}/mindmap")
def get_mind_map(job_id: str):
    job = r.hgetall(f"audiobook:{job_id}")
    if not job or job.get("status") != "ready":
        raise HTTPException(status_code=400, detail="Podcast not ready yet")

    mind_map_raw = job.get("mind_map")
    if not mind_map_raw:
        raise HTTPException(status_code=404, detail="Mind map not found")

    return json.loads(mind_map_raw)

@app.get("/my-podcasts")
def get_my_podcasts(user = Depends(get_current_user)):
    res = supabase.table("podcasts") \
        .select("*") \
        .eq("user_id", user.id) \
        .order("created_at", desc=True) \
        .execute()

    return res.data


@app.get("/rss/{token}")
def generate_rss_public(token: str):
    user_feed = supabase.table("user_feeds") \
        .select("*") \
        .eq("feed_token", token) \
        .single() \
        .execute()

    if not user_feed.data:
        raise HTTPException(404, "Invalid feed")

    user_id = user_feed.data["user_id"]

    podcasts = (
        supabase.table("podcasts")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "ready")
        .order("created_at", desc=True)
        .execute()
        .data
    )

    base_url = os.getenv("BACKEND_URL", "http://localhost:8000")

    xml = build_rss_feed(podcasts, user_id, base_url, token)

    return Response(content = xml, media_type="application/rss+xml; charset=utf-8")

import secrets

@app.get("/rss-token")
def get_rss_token(user=Depends(get_current_user)):
    # check if token exists
    res = (
        supabase.table("user_feeds")
        .select("feed_token")
        .eq("user_id", user.id)
        .execute()
    )

    if res.data:
        return {"token": res.data[0]["feed_token"]}

    # create new token
    token = secrets.token_urlsafe(32)

    supabase.table("user_feeds").insert({
        "user_id": user.id,
        "feed_token": token
    }).execute()

    return {"token": token}
