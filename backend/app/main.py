"""DocuMind - Local-First Document Intelligence API"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.api.documents import router as documents_router
from app.api.chat import router as chat_router
from app.api.extract import router as extract_router
from app.api.system import router as system_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.VECTOR_DB_PATH, exist_ok=True)
    print(f"🧠 DocuMind {settings.VERSION} starting...")
    print(f"📁 Upload directory: {settings.UPLOAD_DIR}")
    print(f"🗄️  Vector DB: {settings.VECTOR_DB_PATH}")
    print(f"🤖 Default model: {settings.DEFAULT_MODEL}")
    yield
    print("👋 DocuMind shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    description="Local-First Document Intelligence. No API keys. No cloud. Full privacy.",
    version=settings.VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(extract_router, prefix="/api")
app.include_router(system_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "description": "Local-first document intelligence. Upload, chat, extract — all on your machine.",
        "docs": "/docs",
        "health": "/system/health"
    }
