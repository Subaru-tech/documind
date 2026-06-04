"""Document API Routes"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import shutil
import uuid
import asyncio
from typing import List

from app.core.config import settings
from app.services.document_processor import DocumentProcessor
from app.services.rag_engine import rag_engine
import logging

logger = logging.getLogger("documind.api.documents")

router = APIRouter(prefix="/documents", tags=["documents"])
processor = DocumentProcessor()
rag = rag_engine


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...)
):
    ext = Path(file.filename).suffix.lower()
    if ext not in settings.SUPPORTED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported type: {ext}")
    
    doc_id = str(uuid.uuid4())
    file_path = Path(settings.UPLOAD_DIR) / f"{doc_id}{ext}"
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    try:
        result = await processor.process_file(str(file_path))
        # Run embedding in background to avoid blocking the response
        metadata = {**result["metadata"], "filename": file.filename, "original_path": str(file_path)}
        chunks = result["chunks"]
        
        async def _embed_and_store():
            """Background task: embed chunks, store in vector DB, then generate summary."""
            try:
                await rag.add_document(doc_id, chunks, metadata)
                logger.info(f"✅ Document {doc_id} ({file.filename}) indexed with {len(chunks)} chunks")
                # Auto-generate TL;DR summary
                summary = await rag.generate_summary(doc_id)
                if summary:
                    logger.info(f"📝 Summary generated for {doc_id}")
            except Exception as e:
                logger.error(f"❌ Failed to index document {doc_id} ({file.filename}): {e}")
        
        asyncio.create_task(_embed_and_store())
        return {
            "doc_id": doc_id,
            "filename": file.filename,
            "status": "processing",
            "metadata": result["metadata"],
            "chunk_count": len(result["chunks"])
        }
    except Exception as e:
        raise HTTPException(500, f"Processing failed: {str(e)}")


@router.get("/list")
async def list_documents():
    return {"documents": rag.list_documents()}


@router.get("/{doc_id}")
async def get_document(doc_id: str):
    docs = rag.list_documents()
    doc = next((d for d in docs if d["doc_id"] == doc_id), None)
    if not doc:
        raise HTTPException(404, "Document not found")
    return doc


@router.post("/upload-batch")
async def upload_documents_batch(
    files: List[UploadFile] = File(...)
):
    """Upload multiple documents at once. Processes each file and returns aggregated results."""
    if len(files) > 50:
        raise HTTPException(400, "Maximum 50 files per batch")
    
    results = []
    errors = []
    
    async def process_single(file: UploadFile) -> dict:
        """Process a single file: save, extract, and queue for embedding."""
        ext = Path(file.filename).suffix.lower()
        if ext not in settings.SUPPORTED_EXTENSIONS:
            return {"filename": file.filename, "status": "error", "error": f"Unsupported type: {ext}"}
        
        doc_id = str(uuid.uuid4())
        file_path = Path(settings.UPLOAD_DIR) / f"{doc_id}{ext}"
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        try:
            result = await processor.process_file(str(file_path))
            metadata = {**result["metadata"], "filename": file.filename, "original_path": str(file_path)}
            chunks = result["chunks"]
            
            async def _embed_and_store():
                try:
                    await rag.add_document(doc_id, chunks, metadata)
                    logger.info(f"✅ Batch doc {doc_id} ({file.filename}) indexed with {len(chunks)} chunks")
                    summary = await rag.generate_summary(doc_id)
                    if summary:
                        logger.info(f"📝 Summary generated for batch doc {doc_id}")
                except Exception as e:
                    logger.error(f"❌ Failed to index batch doc {doc_id} ({file.filename}): {e}")
            
            asyncio.create_task(_embed_and_store())
            
            return {
                "doc_id": doc_id,
                "filename": file.filename,
                "status": "processing",
                "chunk_count": len(result["chunks"]),
                "metadata": result["metadata"]
            }
        except Exception as e:
            return {"filename": file.filename, "status": "error", "error": str(e)}
    
    # Process all files concurrently
    tasks = [process_single(file) for file in files]
    batch_results = await asyncio.gather(*tasks)
    
    # Separate successes and errors
    for r in batch_results:
        if r["status"] == "error":
            errors.append(r)
        else:
            results.append(r)
    
    return {
        "total": len(files),
        "success": len(results),
        "failed": len(errors),
        "documents": results,
        "errors": errors
    }


@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    rag.delete_document(doc_id)
    return {"status": "deleted", "doc_id": doc_id}
