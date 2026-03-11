from pydub import AudioSegment
import os

def merge_mp3_files(audio_files, output_file, delete_chunks=True):
    combined = AudioSegment.empty()

    for file in audio_files:
        audio = AudioSegment.from_mp3(file)
        combined += audio

    combined.export(output_file, format="mp3")

    if delete_chunks:
        for file in audio_files:
            os.remove(file)
    return output_file
