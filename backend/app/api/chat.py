"""Chat API Routes - RAG Q&A"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import json

from app.services.rag_engine import rag_engine

router = APIRouter(prefix="/chat", tags=["chat"])
rag = rag_engine


class ChatRequest(BaseModel):
    question: str
    doc_id: Optional[str] = None
    model: Optional[str] = None


@router.post("/ask")
async def ask_question(request: ChatRequest):
    try:
        response = ""
        sources = []
        async for token in rag.chat_with_document(
            request.question, 
            request.doc_id, 
            request.model,
            stream=False
        ):
            if token.startswith("\x00"):
                try:
                    sources = json.loads(token[1:])
                except Exception:
                    pass
            else:
                response += token
        return {"answer": response, "sources": sources}
    except Exception as e:
        raise HTTPException(500, f"Chat failed: {str(e)}")


@router.post("/ask/stream")
async def ask_question_stream(request: ChatRequest):
    """Stream tokens, stripping the sources sentinel from the stream."""
    async def generate():
        async for token in rag.chat_with_document(
            request.question,
            request.doc_id,
            request.model,
            stream=True
        ):
            # Don't stream the sources sentinel to the client
            if not token.startswith("\x00"):
                yield token
    return StreamingResponse(generate(), media_type="text/plain")
