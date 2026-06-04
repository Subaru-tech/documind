"""System API Routes"""
from fastapi import APIRouter, HTTPException
from app.core.config import settings
from app.services.ollama_client import OllamaClient

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.VERSION}


@router.get("/models")
async def list_models():
    async with OllamaClient() as client:
        try:
            models = await client.list_models()
            return {
                "available_models": models,
                "recommended_tiers": settings.MODEL_TIERS,
                "current_default": settings.DEFAULT_MODEL,
                "embedding_model": settings.EMBEDDING_MODEL
            }
        except Exception as e:
            raise HTTPException(503, f"Ollama not reachable: {str(e)}")


@router.get("/config")
async def get_config():
    return {
        "app_name": settings.APP_NAME,
        "version": settings.VERSION,
        "default_model": settings.DEFAULT_MODEL,
        "embedding_model": settings.EMBEDDING_MODEL,
        "supported_extensions": settings.SUPPORTED_EXTENSIONS,
        "chunk_size": settings.CHUNK_SIZE,
        "max_file_size": settings.MAX_FILE_SIZE
    }
