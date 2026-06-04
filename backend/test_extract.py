import asyncio
from app.services.rag_engine import rag_engine

async def main():
    docs = rag_engine.list_documents()
    print("Docs:", docs)
    if docs:
        doc_id = docs[0]["doc_id"]
        result = await rag_engine.extract_structured(doc_id=doc_id, instruction="Extract all names")
        print("Result:", result)

asyncio.run(main())
