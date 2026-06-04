"""Ollama Client for Local LLM Inference"""
import aiohttp
import json
from typing import AsyncGenerator, Optional, Dict, Any
from app.core.config import settings


class OllamaClient:
    def __init__(self, base_url: str = settings.OLLAMA_BASE_URL):
        self.base_url = base_url
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass
    
    async def generate(
        self, 
        prompt: str, 
        model: Optional[str] = None,
        system: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        stream: bool = False,
        format: Optional[Dict] = None
    ) -> AsyncGenerator[str, None]:
        model = model or settings.DEFAULT_MODEL
        payload = {
            "model": model,
            "prompt": prompt,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream
        }
        if system:
            payload["system"] = system
        if format:
            payload["format"] = format
            
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/api/generate",
                json=payload
            ) as response:
                if stream:
                    async for line in response.content:
                        if line:
                            data = json.loads(line)
                            if "response" in data:
                                yield data["response"]
                else:
                    data = await response.json()
                    yield data.get("response", "")
    
    async def chat(
        self,
        messages: list[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        stream: bool = False
    ) -> AsyncGenerator[str, None]:
        model = model or settings.DEFAULT_MODEL
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "stream": stream
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/api/chat",
                json=payload
            ) as response:
                if stream:
                    async for line in response.content:
                        if line:
                            data = json.loads(line)
                            if "message" in data and "content" in data["message"]:
                                yield data["message"]["content"]
                else:
                    data = await response.json()
                    yield data.get("message", {}).get("content", "")
    
    async def embeddings(self, texts: list[str], model: Optional[str] = None) -> list[list[float]]:
        model = model or settings.EMBEDDING_MODEL
        embeddings = []
        async with aiohttp.ClientSession() as session:
            for text in texts:
                async with session.post(
                    f"{self.base_url}/api/embeddings",
                    json={"model": model, "prompt": text}
                ) as response:
                    data = await response.json()
                    embeddings.append(data.get("embedding", []))
        return embeddings
    
    async def list_models(self) -> list[Dict[str, Any]]:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/api/tags") as response:
                data = await response.json()
                return data.get("models", [])
    
    async def check_model(self, model: str) -> bool:
        models = await self.list_models()
        return any(m.get("name") == model for m in models)
