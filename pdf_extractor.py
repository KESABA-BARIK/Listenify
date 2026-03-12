import fitz

def extract_text(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text.replace('\n', ', ')

def chunk_text(text, chunk_size=1500, overlap=200):

    words = text.split()

    chunks = []

    start = 0

    while start < len(words):

        end = start + chunk_size
        chunk = words[start:end]

        chunks.append(" ".join(chunk))

        start += chunk_size - overlap

    return chunks
