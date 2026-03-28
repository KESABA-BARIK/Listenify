import edge_tts
import asyncio
import os
from pdf_extractor import chunk_text

MAX_RETRIES = 5
BASE_DELAY = 2


async def _synthesize_chunk(text, filename, voice, sem):
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with sem:
                communicate = edge_tts.Communicate(text=text, voice=voice)
                await communicate.save(filename)

            if not os.path.exists(filename) or os.path.getsize(filename) == 0:
                raise Exception(f"Empty output file")

            return

        except Exception as e:
            print(f"[tts] attempt {attempt}/{MAX_RETRIES} FAILED")
            print(f"      voice  : {voice}")
            print(f"      text   : {repr(text[:120])}")
            print(f"      error  : {e}")
            if attempt == MAX_RETRIES:
                raise Exception(
                    f"All {MAX_RETRIES} retries failed. "
                    f"voice='{voice}' | error={e} | text={repr(text[:80])}"
                )
            delay = BASE_DELAY * (2 ** (attempt - 1))
            await asyncio.sleep(delay)


async def _text_to_audiobook_async(text, output_path, voice):
    sem = asyncio.Semaphore(5)
    chunks = chunk_text(text)
    tasks = [
        _synthesize_chunk(chunk, f"{output_path}_part{i}.mp3", voice, sem)
        for i, chunk in enumerate(chunks)
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    failed = [r for r in results if isinstance(r, Exception)]
    if failed:
        raise Exception(f"{len(failed)} audio chunks failed:\n" +
                        "\n".join(f"  {e}" for e in failed))

    return [f"{output_path}_part{i}.mp3" for i in range(len(chunks))]


def text_to_audiobook(text, output_path, voice="en-US-GuyNeural"):
    loop = asyncio.new_event_loop()
    try:
        asyncio.set_event_loop(loop)
        return loop.run_until_complete(
            _text_to_audiobook_async(text, output_path, voice)
        )
    finally:
        loop.close()


def _clean_text_for_tts(text: str) -> str:
    """
    Strip characters that cause edge-tts to reject a line.
    - removes markdown bold/italic asterisks
    - removes brackets used for stage directions e.g. [pause]
    - collapses multiple spaces/newlines
    - strips leading/trailing whitespace
    """
    import re
    text = text.replace("*", "")
    text = re.sub(r"\[.*?\]", "", text)   # remove [stage directions]
    text = re.sub(r"\s+", " ", text)
    return text.strip()


async def _podcast_to_audio_async(script, output_path, host_voice, expert_voice):
    sem = asyncio.Semaphore(3)
    lines = script.split("\n")
    tasks = []
    filenames = []

    print(f"\n[tts] === script breakdown ===")
    for i, line in enumerate(lines):
        print(f"  raw line {i:03d}: {repr(line)}")
    print(f"[tts] === end script ===\n")

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        lower = stripped.lower()
        if lower.startswith("host:"):
            voice = host_voice
            text = stripped[stripped.index(":") + 1:].strip()
        elif lower.startswith("expert:"):
            voice = expert_voice
            text = stripped[stripped.index(":") + 1:].strip()
        else:
            print(f"[tts] skipping untagged line: {repr(stripped[:80])}")
            continue

        text = _clean_text_for_tts(text)

        if not text:
            print(f"[tts] skipping empty text after cleaning (voice={voice})")
            continue

        print(f"[tts] queuing | voice={voice} | text={repr(text[:80])}")

        filename = f"{output_path}_part{len(filenames)}.mp3"
        filenames.append(filename)
        tasks.append(_synthesize_chunk(text, filename, voice, sem))

    print(f"\n[tts] synthesising {len(tasks)} lines | host={host_voice} | expert={expert_voice}\n")

    results = await asyncio.gather(*tasks, return_exceptions=True)

    failed = [(i, r) for i, r in enumerate(results) if isinstance(r, Exception)]
    if failed:
        details = "\n".join(f"  line {i}: {e}" for i, e in failed)
        raise Exception(f"{len(failed)} TTS lines failed:\n{details}")

    return filenames


def podcast_to_audio(
    script,
    output_path,
    host_voice="en-US-GuyNeural",
    expert_voice="en-US-JennyNeural"
):
    loop = asyncio.new_event_loop()
    try:
        asyncio.set_event_loop(loop)
        return loop.run_until_complete(
            _podcast_to_audio_async(script, output_path, host_voice, expert_voice)
        )
    finally:
        loop.close()


def rescale_chunks_to_audio(chunks: list[dict], actual_duration: float) -> list[dict]:
    """
    Linearly rescale LLM-estimated timestamps to match real audio duration.
    """
    if not chunks:
        return chunks

    llm_total = chunks[-1]["end_seconds"]
    if llm_total <= 0:
        return chunks

    scale = actual_duration / llm_total

    rescaled = []
    for c in chunks:
        rescaled.append({
            **c,
            "start_seconds": round(c["start_seconds"] * scale, 2),
            "end_seconds": round(c["end_seconds"] * scale, 2),
        })
    return rescaled