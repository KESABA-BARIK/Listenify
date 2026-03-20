import fitz

def extract_text(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text.replace('\n', ', ')

def extract_headings(pdf_path: str) -> list[str]:
    doc = fitz.open(pdf_path)
    font_sizes = []
    spans_data = []
    for page in doc:
        blocks = page.get_text("dict")["blocks"]
        for block in blocks:
            if block["type"] != 0:
                continue
            for line in block["lines"]:
                for span in line["spans"]:
                    text = span["text"].strip()
                    if not text:
                        continue
                    font_sizes.append(span["size"])
                    spans_data.append({
                        "text": text,
                        "size": span["size"],
                        "flags": span["flags"],
                    })
    if not font_sizes:
        doc.close()
        return []

    avg_size = sum(font_sizes) / len(font_sizes)
    heading_data = []
    seen = set()
    for span in spans_data:
        is_larger = span["size"] > avg_size*1.15
        is_bold = bool(span["flags"] & 16)
        text = span["text"].strip()

        if (is_larger or is_bold) and len(text) > 2 and text not in seen:
            if not text.replace(".", "").replace(" ", "").isdigit():
                heading_data.append(text)
                seen.add(text)
    doc.close()
    return heading_data



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
