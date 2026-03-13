<div align="center">

# 🎙️ Listenify – AI Research Paper → Podcast Generator

[![GitHub stars](https://img.shields.io/github/stars/KESABA-BARIK/Listenify?style=social)](https://github.com/KESABA-BARIK/Listenify)
[![GitHub forks](https://img.shields.io/github/forks/KESABA-BARIK/Listenify?style=social)](https://github.com/KESABA-BARIK/Listenify)
[![GitHub issues](https://img.shields.io/github/issues/KESABA-BARIK/Listenify)](https://github.com/KESABA-BARIK/Listenify/issues)
[![Python](https://img.shields.io/badge/Python-3.8%2B-blue)](https://www.python.org/)
[![License](https://img.shields.io/github/license/KESABA-BARIK/Listenify)](LICENSE)

**Convert long research papers (PDFs) into AI-generated podcast conversations with multiple speakers.**

Listenify automatically reads a research paper, summarizes it using LLMs, generates a **Host–Expert style podcast script**, and converts it into **natural-sounding speech using AI voices**.

![Demo](https://github.com/KESABA-BARIK/Listenify/raw/main/demo.gif)

</div>

## 🚀 Features

<div align="center">

| Feature | Status |
|---------|--------|
| Extract text from research paper PDFs | ✅ |
| Automatically split large documents | ✅ |
| Generate summaries using LLMs | ✅ |
| Convert summaries into podcast-style conversations | ✅ |
| Support multiple speakers (Host/Expert) | ✅ |
| Generate realistic AI voice audio | ✅ |
| Works with **Groq** and **OpenRouter** APIs | ✅ |

</div>

## 🧠 How It Works

```mermaid
graph TD
    A[PDF] --> B[Text Extraction]
    B --> C[Chunking]
    C --> D[Chunk Summaries<br/>(LLM)]
    D --> E[Podcast Script<br/>Generation]
    E --> F[Script Cleaning]
    F --> G[Speaker Voice<br/>Assignment]
    G --> H[Audio Generation<br/>(Edge-TTS)]
    H --> I[🎧 Podcast Audio]
🎧 Output
Generated podcast audio files are saved in:

text
output/audio/
├── host_1.mp3
├── expert_2.mp3
├── host_3.mp3
└── ...
Each line of the generated podcast script is converted into spoken dialogue.

🏗️ Project Structure
text
project/
│
├── main.py                 # Pipeline entry point
├── summarizer.py          # LLM summarization logic
├── podcast_generator.py   # Converts summaries into podcast script
├── tts.py                 # Text-to-speech generation
├── cleaner.py             # Cleans LLM podcast output
│
├── input/
│   └── paper.pdf
│
├── output/
│   ├── summaries.json
│   ├── podcast_script.txt
│   └── audio/
│
└── README.md
⚙️ Quick Start
1. Clone & Install
bash
git clone https://github.com/KESABA-BARIK/Listenify.git
cd Listenify
pip install -r requirements.txt
2. Setup Environment
Create .env file:

text
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
3. Run
bash
uvicorn main:app --reload
The system will automatically:

Extract text from PDF in input/

Generate summaries

Create podcast script

Convert to AI-generated speech

All outputs saved in output/

🗣️ Voices Used
Role	Voice
Host	en-US-GuyNeural
Expert	en-US-JennyNeural
📦 Requirements
text
groq
edge-tts
pypdf
python-dotenv
tqdm
fastapi
uvicorn
⚠️ Current Limitations
Podcasts generated from summaries (details may be condensed)

Audio generated line-by-line (multiple small files)

LLM outputs sometimes require script cleaning

Very large PDFs may need more aggressive chunking

🔮 Future Roadmap
Feature	Priority
Hierarchical summarization	⭐⭐⭐
Merge audio into single episode	⭐⭐⭐
More speakers	⭐⭐
Podcast title & description	⭐⭐
Automatic cover art	⭐⭐
Web interface for PDF upload	⭐⭐⭐
Background music & intro	⭐
Spotify/RSS export	⭐
📚 Example Use Cases
🔬 Research paper summarization

🎓 Learning complex topics via audio

🎙️ Creating podcast content from academic papers

📖 AI-assisted literature review

🛠️ Tech Stack
Tech Stack
Tech Stack
Tech Stack
Tech Stack

🤝 Contributing
Fork the repository

Create feature branch (git checkout -b feature/amazing-feature)

Commit changes (git commit -m 'Add amazing feature')

Push to branch (git push origin feature/amazing-feature)

Open Pull Request

For major changes, please open an issue first to discuss!

⭐ Support
If you like this project, please give it a star ⭐ – it helps others discover it!

📄 License
This project is MIT licensed.

🙏 Acknowledgments
Groq API for fast inference

OpenRouter for LLM access

Microsoft Edge TTS for voice synthesis

<div align="center">
Made with ❤️ by KESABA-BARIK

Twitter Follow

</div> ```
