LANGUAGE_CONFIG = {
"english": {
        "code": "en",
        "llm_name": "English",
        "host_voice": "en-US-GuyNeural",
        "expert_voice": "en-US-JennyNeural",
    },
    "tamil": {
        "code": "ta",
        "llm_name": "Tamil",
        "host_voice": "ta-IN-ValluvarNeural",
        "expert_voice": "ta-IN-PallaviNeural",
    },
    "hindi": {
        "code": "hi",
        "llm_name": "Hindi",
        "host_voice": "hi-IN-MadhurNeural",
        "expert_voice": "hi-IN-SwaraNeural",
    },
    "spanish": {
        "code": "es",
        "llm_name": "Spanish",
        "host_voice": "es-ES-AlvaroNeural",
        "expert_voice": "es-ES-ElviraNeural",
    },
    "french": {
        "code": "fr",
        "llm_name": "French",
        "host_voice": "fr-FR-HenriNeural",
        "expert_voice": "fr-FR-DeniseNeural",
    },
    "german": {
        "code": "de",
        "llm_name": "German",
        "host_voice": "de-DE-ConradNeural",
        "expert_voice": "de-DE-KatjaNeural",
    },
    "arabic": {
        "code": "ar",
        "llm_name": "Arabic",
        "host_voice": "ar-SA-HamedNeural",
        "expert_voice": "ar-SA-ZariyahNeural",
    },
    "telugu": {
        "code": "te",
        "llm_name": "Telugu",
        "host_voice": "te-IN-MohanNeural",
        "expert_voice": "te-IN-ShrutiNeural",
    },
}

DEFAULT_LANGUAGE = "english"

def get_language_config(language:str) -> dict:
    key = language.lower().strip()
    config = LANGUAGE_CONFIG[key]
    if not config:
        raise Exception(f"Language {language} is not supported")
    return config

def supported_languages() -> list[str]:
    return list(LANGUAGE_CONFIG.keys())