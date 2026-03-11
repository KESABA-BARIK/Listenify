import random

import edge_tts
import asyncio
import os
from pdf_extractor import chunk_text


MAX_RETRIES = 5
BASE_DELAY = 2

async def _synthesize_chunk(text, filename, voice, sem):
    for attempt in range(1,MAX_RETRIES+1):
        try:
            async with sem:
                communicate = edge_tts.Communicate(text=text, voice=voice)
                await communicate.save(filename)
            return
        except Exception as e:
            if attempt == MAX_RETRIES:
               raise e

            # exponential backoff + jitter
            delay = BASE_DELAY * (2 ** (attempt - 1))
            await asyncio.sleep(delay)


async def _text_to_audiobook_async(text, output_path, voice):
    sem = asyncio.Semaphore(5)  # ✅ bound to correct loop
    chunks = chunk_text(text)
    tasks = []

    for i, chunk in enumerate(chunks):
        filename = f"{output_path}_part{i}.mp3"
        tasks.append(
            _synthesize_chunk(chunk, filename, voice, sem)
        )

    results = await asyncio.gather(*tasks, return_exceptions=True)

    failed = [r for r in results if isinstance(r, Exception)]
    if failed:
        raise Exception(f"{len(failed)} audio chunks failed")

    return [f"{output_path}_part{i}.mp3" for i in range(len(chunks))]



def text_to_audiobook(text, output_path, voice="en-US-GuyNeural"):
    """
    Synchronous wrapper for edge-tts audiobook generation
    """
    loop = asyncio.new_event_loop()
    try:
        asyncio.set_event_loop(loop)
        return loop.run_until_complete(
            _text_to_audiobook_async(text, output_path, voice)
        )
    finally:
        loop.close()
