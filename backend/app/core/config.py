"""DocuMind Configuration"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "DocuMind"
    VERSION: str = "0.1.0"
    
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    DEFAULT_MODEL: str = "llama3.2:1b"
    EMBEDDING_MODEL: str = "nomic-embed-text"
    
    MODEL_TIERS: dict = {
        "ultra_low": "smollm2:1.7b",
        "low": "llama3.2:3b",
        "medium": "phi4-mini",
        "high": "llama3.1:8b",
        "vision": "gemma4:e4b"
    }
    
    VECTOR_DB_PATH: str = "./data/chroma_db"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    
    UPLOAD_DIR: str = "./data/uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024
    SUPPORTED_EXTENSIONS: list = [".pdf", ".txt", ".md", ".docx", ".csv"]
    
    DEFAULT_TEMPERATURE: float = 0.1
    MAX_TOKENS: int = 4096
    
    class Config:
        env_file = ".env"


settings = Settings()
