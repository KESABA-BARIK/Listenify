import uuid

from fastapi import FastAPI, UploadFile, File, BackgroundTasks, APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.responses import FileResponse
import shutil
import os
from pdf_extractor import extract_text
from tts_engine import text_to_audiobook
from audio_merger import merge_mp3_files
import redis

r = redis.Redis(host="localhost", port=6379, decode_responses=True)

app = FastAPI()

router = APIRouter()

CHUNK_SIZE = 1024 * 1024

def process_pdf(pdf_path: str, job_id: str):
    try:
        r.hset(f"audiobook:{job_id}", mapping={
            "status": "processing"
        })

        # 1. Extract text
        text = extract_text(pdf_path)

        # 2. Generate audio chunks
        audio_files = text_to_audiobook(text, f"audiobooks/{job_id}")

        # 3. Merge
        final_audio = f"audiobooks/{job_id}_full.mp3"
        merge_mp3_files(audio_files, final_audio)

        # 4. Mark completed
        r.hset(f"audiobook:{job_id}", mapping={
            "status": "ready",
            "final_path": final_audio
        })

    except Exception as e:
        r.hset(f"audiobook:{job_id}", mapping={
            "status": "failed",
            "error": str(e)
        })

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...),background_tasks: BackgroundTasks = BackgroundTasks()):
    job_id = str(uuid.uuid4())
    pdf_path = f"uploads/{job_id}_{file.filename}"

    with open(pdf_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    r.hset(f"audiobook:{job_id}", mapping={"status": "uploading"})
    background_tasks.add_task(process_pdf, pdf_path, job_id)

    return {
        "job_id": job_id,
        "status": "started",
    }

@app.post("/status/{job_id}")
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
    job = r.hgetall(f"audiobook:{job_id}_full")
    if not job or job.get("status") != "ready":
        raise HTTPException(status_code=404)

    return FileResponse(
        job["final_path"],
        media_type="audio/mpeg",
        filename=f"{job_id}.mp3"
    )