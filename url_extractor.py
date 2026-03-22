import re
import requests
from bs4 import BeautifulSoup
import io

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; Listenify/1.0; research podcast generator)"
}

TIMEOUT = 20


def _extract_arxiv(url: str) -> str:
    """
    arXiv special handler.
    Converts abstract URL to PDF URL, downloads PDF, extracts text via PyMuPDF.
    Handles both:
      https://arxiv.org/abs/2301.07041
      https://arxiv.org/pdf/2301.07041
    """
    import fitz  # PyMuPDF

    # Normalise to PDF url
    arxiv_id = re.search(r'arxiv\.org/(?:abs|pdf)/([^\s/?#]+)', url)
    if not arxiv_id:
        raise ValueError("Could not extract arXiv ID from URL.")

    pdf_url = f"https://arxiv.org/pdf/{arxiv_id.group(1)}"
    print(f"[url_extractor] fetching arXiv PDF: {pdf_url}")

    res = requests.get(pdf_url, headers=HEADERS, timeout=TIMEOUT)
    res.raise_for_status()

    # Open PDF from bytes
    doc = fitz.open(stream=res.content, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()

    if not text.strip():
        raise ValueError("arXiv PDF returned empty text — may be image-only.")

    return text.replace('\n', ', ')


def _extract_generic(url: str) -> str:
    """
    Generic scraper for any URL.
    Fetches HTML, strips boilerplate with BeautifulSoup,
    returns the main text content.
    """
    print(f"[url_extractor] scraping URL: {url}")

    res = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
    res.raise_for_status()

    soup = BeautifulSoup(res.text, 'html.parser')

    # Remove noise elements
    for tag in soup(['script', 'style', 'nav', 'footer', 'header',
                     'aside', 'form', 'button', 'iframe', 'noscript',
                     'figure', 'figcaption', '[class*="sidebar"]',
                     '[class*="menu"]', '[class*="ad"]']):
        tag.decompose()

    # Try to find the main content block
    main = (
        soup.find('article') or
        soup.find('main') or
        soup.find(attrs={'role': 'main'}) or
        soup.find(id=re.compile(r'content|main|article', re.I)) or
        soup.find(class_=re.compile(r'content|article|post|entry', re.I)) or
        soup.body
    )

    if not main:
        raise ValueError("Could not find readable content in this page.")

    # Extract clean text
    paragraphs = []
    for el in main.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'li']):
        text = el.get_text(separator=' ', strip=True)
        if len(text) > 40:  # skip short snippets (nav items, captions)
            paragraphs.append(text)

    text = ' '.join(paragraphs)

    if len(text) < 200:
        raise ValueError(
            "Not enough readable text found on this page. "
            "The page may require JavaScript or login to access."
        )

    return text


def extract_text_from_url(url: str) -> str:
    """
    Main entry point. Routes to arXiv handler or generic scraper.
    Returns plain text suitable for summarisation.
    """
    url = url.strip()

    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    if 'arxiv.org' in url:
        return _extract_arxiv(url)

    return _extract_generic(url)