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

from chapter_service import generate_chapters, chapters_to_transcript_header
from language_config import get_language_config, DEFAULT_LANGUAGE, supported_languages
from pdf_extractor import extract_text
from podcast_service import generate_podcast_script, clean_podcast_script, DIFFICULTY
from show_notes_service import generate_show_notes, show_notes_to_text
from summary_service import summarize_text
from transcript_service import save_transcript
from tts_engine import text_to_audiobook, podcast_to_audio
from audio_merger import merge_mp3_files
import redis

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

def process_pdf(pdf_path: str,
                job_id: str,
                length:str="full",
                language:str="english",
                difficulty:str=DIFFICULTY,
                debate:bool=False):
    try:
        r.hset(f"audiobook:{job_id}", mapping={
            "status": "processing"
        })

        lang_config = get_language_config(language)

        # 1. Extract text
        text = extract_text(pdf_path)

        summary = summarize_text(text, length=length)
        scripts = []
        for sum in summary:
            script = generate_podcast_script(sum,length=length,language=lang_config["llm_name"],difficulty=difficulty,debate=debate)
            script = clean_podcast_script(script)
            scripts.append(script)

        full_script = "\n".join(scripts)

        chapters = generate_chapters(full_script,language=lang_config["llm_name"])
        chaps_json = json.dumps(chapters, ensure_ascii=False)

        show_notes = generate_show_notes(full_script,language=lang_config["llm_name"])
        show_notes_json = json.dumps(show_notes, ensure_ascii=False)

        chap_header = chapters_to_transcript_header(chapters)
        show_notes_text = show_notes_to_text(show_notes)
        transcript_chaps = chap_header + full_script + show_notes_text

        transcript_path = save_transcript(transcript_chaps, job_id, TRANSCRIPTS_DIR)
        r.hset(f"audiobook:{job_id}", mapping={"transcript_path": transcript_path,"chapters":chaps_json,"show_notes": show_notes_json,})

        # 2. Generate audio chunks
        audio_files = podcast_to_audio(full_script, os.path.join(AUDIOBOOKS_DIR, job_id),host_voice=lang_config["host_voice"],expert_voice=lang_config["expert_voice"])

        # 3. Merge
        final_audio = os.path.join(AUDIOBOOKS_DIR, f"{job_id}_full.mp3")
        merge_mp3_files(audio_files, final_audio)

        # 4. Mark completed
        r.hset(f"audiobook:{job_id}", mapping={
            "status": "ready",
            "final_path": final_audio,
            "length": length,
            "transcript_path": transcript_path,
            "chapters": chaps_json,
            "show_notes": show_notes_json,
            "language": language,
            "difficulty": difficulty,
            "debate": str(debate),
        })

    except Exception as e:
        r.hset(f"audiobook:{job_id}", mapping={
            "status": "failed",
            "error": str(e)
        })

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...),background_tasks: BackgroundTasks = BackgroundTasks(), length: str=Form(default="full"),
                     language: str = Form(default=DEFAULT_LANGUAGE),
                     difficulty: str = Form(default=DIFFICULTY),
                     debate: bool = Form(default=False)):
    if length not in VALID_LENGTHS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid length '{length}'. Must be one of: brief, standard, full"
        )
    if difficulty not in diff:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid difficulty '{difficulty}'. Must be one of {diff}"
        )
    try:
        get_language_config(language)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    job_id = str(uuid.uuid4())
    pdf_path = os.path.join(UPLOADS_DIR, f"{job_id}_{file.filename}")

    with open(pdf_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    r.hset(f"audiobook:{job_id}", mapping=
    {"status": "uploading",
     "length":length,
     "language":language,
     "difficulty":difficulty,
     "debate":str(debate),})
    background_tasks.add_task(process_pdf, pdf_path, job_id, length,language, difficulty, debate)

    return {
        "job_id": job_id,
        "status": "started",
        "length": length,
        "language": language,
        "difficulty": difficulty,
        "debate": str(debate),
    }
@app.get("/languages")
def list_languages():
    """Returns all supported language names."""
    return {"supported_languages": supported_languages()}
@app.get("/status/{job_id}")
def status(job_id: str):
    job = r.hgetall(f"audiobook:{job_id}")
    if not job:
        raise HTTPException(status_code=404, detail="Invalid job ID")

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