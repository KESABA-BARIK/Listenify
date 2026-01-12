import fitz
import gtts
from gtts import gTTS

pdf_file = 'sample.pdf'
doc = fitz.open(pdf_file)

text = ""
for page in doc:
    text += page.get_text()

doc.close()

text = text.replace('\n', ' ')

tts = gTTS(text=text, lang='en')
tts.save('audiobook.mp3')

print("Audiobook created successfully!")

