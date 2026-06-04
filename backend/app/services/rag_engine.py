"""RAG Engine - Retrieval Augmented Generation with Local Vector Store"""
import os
import asyncio
from typing import List, Dict, Optional, Any
from pathlib import Path
import json

try:
    import chromadb
    from chromadb.config import Settings as ChromaSettings
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False

from app.core.config import settings
from app.services.ollama_client import OllamaClient


class RAGEngine:
    def __init__(self):
        self.db_path = settings.VECTOR_DB_PATH
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        if not CHROMA_AVAILABLE:
            raise ImportError("ChromaDB not installed. Run: pip install chromadb")
        self._client = None  # Lazy init
        self._ollama = None
    
    @property
    def client(self):
        if self._client is None:
            self._client = chromadb.PersistentClient(
                path=self.db_path,
                settings=ChromaSettings(anonymized_telemetry=False)
            )
        return self._client
    
    @property
    def ollama(self):
        if self._ollama is None:
            self._ollama = OllamaClient()
        return self._ollama
    
    async def add_document(self, doc_id: str, chunks: List[str], metadata: Dict) -> bool:
        collection = self.client.get_or_create_collection(name="documents")
        async with self.ollama:
            embeddings = await self.ollama.embeddings(chunks)
        chunk_ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
        chunk_metadatas = [{**metadata, "chunk_index": i, "doc_id": doc_id} for i in range(len(chunks))]
        collection.add(
            ids=chunk_ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=chunk_metadatas
        )
        return True
    
    async def query(self, question: str, doc_id: Optional[str] = None, n_results: int = 5) -> List[Dict]:
        collection = self.client.get_or_create_collection(name="documents")
        async with self.ollama:
            query_embedding = await self.ollama.embeddings([question])
        where_filter = {"doc_id": doc_id} if doc_id else None
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=n_results,
            where=where_filter
        )
        formatted = []
        if results["ids"] and results["ids"][0]:
            for i in range(len(results["ids"][0])):
                formatted.append({
                    "id": results["ids"][0][i],
                    "text": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "distance": results["distances"][0][i] if results["distances"] else 0
                })
        return formatted
    
    async def chat_with_document(
        self, 
        question: str, 
        doc_id: Optional[str] = None,
        model: Optional[str] = None,
        stream: bool = False
    ):
        contexts = await self.query(question, doc_id, n_results=5)
        if not contexts:
            system_prompt = "You are DocuMind, a helpful document assistant. The user has asked about a document, but no relevant context was found. Answer based on general knowledge or ask for clarification."
            context_text = ""
        else:
            system_prompt = """You are DocuMind, a precise document analysis assistant. 
Answer the user's question using ONLY the provided document context. 
If the answer is not in the context, say \"I don't see that information in the document.\" 
Be concise and factual."""
            context_text = "\n\n".join([f"[Excerpt {i+1}]: {c['text']}" for i, c in enumerate(contexts)])
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Document Context:\n{context_text}\n\nQuestion: {question}"}
        ]
        
        # Build source citations from context metadata
        sources = []
        for c in contexts:
            meta = c.get("metadata", {})
            src = {}
            if meta.get("filename"):
                src["filename"] = meta["filename"]
            if meta.get("page_count") and meta.get("chunk_index") is not None:
                # Estimate page number from chunk index
                src["page"] = (meta["chunk_index"] // max(1, meta.get("page_count", 1))) + 1
            if src:
                # Deduplicate by filename
                if not any(s.get("filename") == src.get("filename") for s in sources):
                    sources.append(src)
        
        response_text = ""
        async with self.ollama:
            async for token in self.ollama.chat(messages, model=model, temperature=0.3, stream=stream):
                response_text += token
                yield token
        
        # Yield sources as a special final sentinel (JSON line)
        import json as _json
        yield "\x00" + _json.dumps(sources)
    
    async def extract_structured(
        self,
        doc_id: Optional[str] = None,
        instruction: str = "",
        schema: Optional[Dict] = None,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        collection = self.client.get_or_create_collection(name="documents")
        if doc_id:
            results = collection.get(where={"doc_id": doc_id})
            context = "\n\n".join(results["documents"]) if results["documents"] else ""
        else:
            results = collection.get(limit=20)
            context = "\n\n".join(results["documents"]) if results["documents"] else ""
        
        system_prompt = """You are a precise data extraction engine. Extract information from the document according to the user's instructions.
Respond ONLY with valid JSON. No markdown, no explanations, no preamble."""
        user_prompt = f"Document Content:\n{context[:8000]}\n\nInstruction: {instruction}\n"
        if schema:
            user_prompt += f"Respond with JSON matching this schema: {json.dumps(schema)}\n"
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        async with self.ollama:
            response = ""
            async for token in self.ollama.chat(messages, model=model, temperature=0.1, stream=False):
                response += token
        
        try:
            cleaned = response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            parsed = json.loads(cleaned.strip())
            
            # Schema validation: flag missing keys
            if schema and isinstance(parsed, dict):
                warnings = []
                for key in schema:
                    if key not in parsed:
                        parsed[key] = None
                        warnings.append(f"Missing field: '{key}'")
                if warnings:
                    parsed["_validation_warnings"] = warnings
            
            return parsed
        except json.JSONDecodeError:
            return {"raw_response": response, "error": "Failed to parse JSON"}
    
    def list_documents(self) -> List[Dict]:
        collection = self.client.get_or_create_collection(name="documents")
        results = collection.get()
        docs = {}
        for meta in results["metadatas"]:
            if meta:
                doc_id = meta.get("doc_id")
                if doc_id and doc_id not in docs:
                    docs[doc_id] = {
                        "doc_id": doc_id,
                        "metadata": {k: v for k, v in meta.items() if k not in ["chunk_index", "doc_id"]},
                        "chunk_count": 0
                    }
                if doc_id:
                    docs[doc_id]["chunk_count"] += 1
        return list(docs.values())
    
    def delete_document(self, doc_id: str) -> bool:
        collection = self.client.get_or_create_collection(name="documents")
        collection.delete(where={"doc_id": doc_id})
        return True
    
    async def generate_summary(self, doc_id: str, model: Optional[str] = None) -> str:
        """Generate a 2-sentence TL;DR summary of a document and store it in metadata."""
        import logging as _log
        try:
            collection = self.client.get_or_create_collection(name="documents")
            results = collection.get(where={"doc_id": doc_id})
            if not results["documents"]:
                return ""
            context = "\n\n".join(results["documents"])[:3000]
            messages = [
                {"role": "system", "content": "You are a concise document summarizer. Respond with exactly 2 sentences summarizing the key content."},
                {"role": "user", "content": f"Summarize this document:\n{context}"}
            ]
            async with self.ollama:
                summary = ""
                async for token in self.ollama.chat(messages, model=model, temperature=0.3, stream=False):
                    summary += token
            summary = summary.strip()
            
            # Patch summary into existing chunk metadatas
            if results["ids"] and summary:
                for i, chunk_id in enumerate(results["ids"]):
                    old_meta = results["metadatas"][i] if results["metadatas"] else {}
                    new_meta = {**old_meta, "summary": summary}
                    collection.update(ids=[chunk_id], metadatas=[new_meta])
            
            return summary
        except Exception as e:
            _log.error(f"Summary generation failed for {doc_id}: {e}")
            return ""
    
    async def extract_batch(
        self,
        instruction: str = "",
        schema: Optional[Dict] = None,
        model: Optional[str] = None,
        concurrency: int = 1
    ) -> List[Dict[str, Any]]:
        """Extract structured data from ALL documents.
        
        Args:
            instruction: Extraction instruction for the LLM
            schema: Optional JSON schema to structure the output
            model: Optional model name override
            concurrency: Max concurrent LLM calls (default 1 for reliability)
        """
        docs = self.list_documents()
        
        semaphore = asyncio.Semaphore(concurrency)
        
        async def extract_one(doc_info: Dict) -> Dict:
            doc_id = doc_info["doc_id"]
            filename = doc_info.get("metadata", {}).get("filename", doc_id)
            
            # Get document content directly
            collection = self.client.get_or_create_collection(name="documents")
            doc_results = collection.get(where={"doc_id": doc_id})
            context = "\n\n".join(doc_results["documents"])[:8000] if doc_results["documents"] else ""
            
            if not context:
                return {"filename": filename, "doc_id": doc_id, "error": "No content found"}
            
            async with semaphore:
                system_prompt = """You are a precise data extraction engine. Extract information from the document according to the user's instructions.
Respond ONLY with valid JSON. No markdown, no explanations, no preamble."""
                user_prompt = f"Document ({filename}):\n{context}\n\nInstruction: {instruction}\n"
                if schema:
                    user_prompt += f"Respond with JSON matching this schema: {json.dumps(schema)}\n"
                
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
                
                try:
                    async with self.ollama:
                        response = ""
                        async for token in self.ollama.chat(messages, model=model, temperature=0.1, stream=False):
                            response += token
                    
                    cleaned = response.strip()
                    if cleaned.startswith("```json"):
                        cleaned = cleaned[7:]
                    if cleaned.startswith("```"):
                        cleaned = cleaned[3:]
                    if cleaned.endswith("```"):
                        cleaned = cleaned[:-3]
                    data = json.loads(cleaned.strip())
                    return {"filename": filename, "doc_id": doc_id, "data": data, "status": "success"}
                except Exception as e:
                    return {"filename": filename, "doc_id": doc_id, "error": str(e), "status": "error"}
        
        tasks = [extract_one(doc) for doc in docs]
        results = await asyncio.gather(*tasks)
        return results


# Shared singleton instance — imported by all API modules
rag_engine = RAGEngine()
