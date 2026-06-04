# DocuMind Release History

---

## [v0.3.0] — Source Citations, Auto-Summary & Dark UI

### New Features
- **Source Citations in Chat** — every AI answer now shows which document pages it drew from
- **Auto-Summary on Upload** — a 2-sentence TL;DR is generated and stored for every document
- **Chat History** — conversations persisted to localStorage, survive page refreshes
- **Export Chat as Markdown** — download any conversation as a `.md` file
- **Keyword Search** — filter your document library by filename in real time
- **Schema Validation** — extraction results now flag missing fields in `_validation_warnings`
- **Dark UI** — complete Google Stitch-inspired dark redesign

### Improvements
- `OllamaClient` is now fully stateless / thread-safe (no more concurrent request corruption)
- Fixed missing `import json` in batch CSV extraction causing silent crashes
- Renamed `schema` field in `ExtractRequest` to avoid Pydantic BaseModel shadowing warning

---

## [v0.2.0] — OCR Pipeline & Batch Processing

### New Features
- **OCR for scanned PDFs** — auto-detects image-based pages (< 200 char threshold), applies Tesseract with PIL preprocessing (grayscale → contrast → sharpen)
- **Amber "OCR" badge** — UI indicator on documents that required OCR
- **Batch upload** — select multiple files or an entire folder at once
- **Batch extraction** — extract structured data from all documents in one click
- **CSV export** — batch extraction results downloadable as `.csv`
- **Upload progress bar** — real-time "Processing 3 of 7..." indicator

### Improvements
- `RAGEngine` is now a module-level singleton — eliminates duplicate ChromaDB connections
- Semantic chunking now respects paragraph and sentence boundaries
- Removed unused `axios` / `@types/*` dependencies from `package.json`

### Dependencies Added
- `pytesseract`, `pdf2image`, `Pillow` (Python)
- System: `tesseract-ocr`, `tesseract-ocr-eng`, `poppler-utils` (in Dockerfile)

---

## [v0.1.0] — Initial Release

### Features
- Upload PDF, DOCX, TXT, MD, CSV (up to 50MB)
- RAG-powered Q&A via Ollama
- Streaming chat interface
- Structured data extraction with Invoice, Resume, Contract templates
- Hardware-adaptive model tiers (4GB → 64GB)
- Docker Compose deployment
- FastAPI backend + React frontend
- ChromaDB vector store (persistent, local)
