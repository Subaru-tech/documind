# DocuMind 🧠
### Local-First Document Intelligence | Self-Hosted AI Document Chat & OCR

> **Upload a PDF. Chat with it. Extract JSON. All on your laptop.**
> No OpenAI API key. No internet required. Your documents never leave your machine.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10+-3776ab?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)](https://react.dev)
[![Ollama](https://img.shields.io/badge/Powered%20by-Ollama-black?logo=ollama)](https://ollama.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![ChromaDB](https://img.shields.io/badge/Vector%20DB-ChromaDB-orange)](https://www.trychroma.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

<div align="center">
  <img src="docs/screenshots/hero.png" alt="DocuMind UI — Chat with Documents" width="800" />
  <p><em>Chat · Extract · OCR — all running on your machine</em></p>
</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 💬 **Chat with Documents** | Ask natural language questions, get answers with source citations |
| 🏗️ **Structured Extraction** | Extract to JSON/CSV with built-in Invoice, Resume, Contract templates |
| 👁️ **OCR for Scanned PDFs** | Auto-detects image-based pages, runs Tesseract transparently |
| 🔒 **100% Private** | Zero cloud calls — everything runs via Ollama on your hardware |
| ⚡ **Hardware Adaptive** | Works on 4GB Chromebooks up to 64GB workstations |
| 📦 **Batch Processing** | Upload and extract from multiple documents at once |
| 🔍 **Source Citations** | Every answer shows which document excerpt it came from |
| 📝 **Auto-Summary** | Generates a TL;DR for each document on upload |
| 🌙 **Dark UI** | Google Stitch-inspired dark interface, no eye strain |

---

## 🚀 Quick Start

**One command. That's it.**

```bash
git clone https://github.com/yourusername/documind.git && cd documind && docker-compose up
```

Open **http://localhost:5173** 🎉

> **Prerequisites:** [Install Ollama](https://ollama.com/download), then pull your model:
> ```bash
> ollama pull phi4-mini        # Recommended (8GB RAM)
> ollama pull nomic-embed-text # Required for embeddings
> ```

---

## 🤖 Hardware-Adaptive Model Tiers

No GPU required. Choose a model that fits your machine:

| RAM | Model | Install | Best For |
|-----|-------|---------|----------|
| **< 4 GB** | `smollm2:1.7b` | `ollama pull smollm2:1.7b` | Chromebooks, Raspberry Pi |
| **4–8 GB** | `llama3.2:3b` | `ollama pull llama3.2:3b` | Basic laptops |
| **8–12 GB** | **`phi4-mini` ⭐** | `ollama pull phi4-mini` | **Recommended default** |
| **16 GB+** | `llama3.1:8b` | `ollama pull llama3.1:8b` | Maximum quality |
| **12 GB+** | `gemma4:e4b` | `ollama pull gemma4:e4b` | Multimodal / vision docs |

**Why Phi-4 Mini?** MMLU 68.5, GSM-8K 88.6, runs at ~2.5GB RAM. Punches far above its weight class for document understanding and structured JSON extraction.

---

## 👁️ OCR Pipeline for Scanned PDFs

Most local document tools silently fail on scanned PDFs. DocuMind doesn't.

```
PDF uploaded → PyMuPDF extracts text layer
              ↓
         Text < 200 chars? (image-based PDF detected)
              ↓ yes                       ↓ no
         pdf2image converts page       Standard RAG pipeline
         PIL: grayscale → contrast → sharpen
         Tesseract OCR (--psm 6)
              ↓
         Text → same RAG pipeline → "OCR" badge shown in UI
```

**Install OCR dependencies:**

```bash
# macOS
brew install tesseract poppler

# Ubuntu / Debian
sudo apt-get install tesseract-ocr tesseract-ocr-eng poppler-utils

# Windows
# Download: https://github.com/UB-Mannheim/tesseract/wiki
# Download: http://blog.alivate.com.au/poppler-windows/
```

> OCR dependencies are **optional** — DocuMind works fine without them for normal PDFs. The OCR pipeline gracefully degrades if Tesseract is not installed.

---

## 🧩 Architecture

```
┌─────────────────────────────────────────────────────┐
│                      DocuMind                       │
│                                                     │
│  ┌──────────┐    ┌──────────────┐    ┌──────────┐  │
│  │  React   │◄──►│   FastAPI    │◄──►│ Ollama   │  │
│  │  + Vite  │    │   Backend    │    │ (Local)  │  │
│  └──────────┘    └──────┬───────┘    └──────────┘  │
│                         │                           │
│                  ┌──────▼───────┐                   │
│                  │   ChromaDB   │                   │
│                  │ (Embeddings) │                   │
│                  └──────────────┘                   │
│                                                     │
│  Document Pipeline:                                 │
│  Upload → PyMuPDF/python-docx/Tesseract → Chunks   │
│        → nomic-embed-text → ChromaDB               │
│        → Query → RAG → Ollama → Answer              │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Manual Setup

**Backend:**
```bash
# Install OCR system deps (see above)
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8001
```

**Frontend (new terminal):**
```bash
cd frontend
npm install
npm run dev
```

---

## 🗂️ Project Structure

```
documind/
├── docker-compose.yml
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── main.py                    # FastAPI entry point
│       ├── core/config.py             # Settings & model tiers
│       ├── api/
│       │   ├── documents.py           # Upload, list, delete
│       │   ├── chat.py                # Streaming RAG Q&A + sources
│       │   ├── extract.py             # JSON/CSV extraction
│       │   └── system.py              # Health & model info
│       └── services/
│           ├── rag_engine.py          # ChromaDB + Ollama RAG
│           ├── document_processor.py  # OCR + text extraction
│           └── ollama_client.py       # Local LLM client
└── frontend/
    └── src/
        ├── pages/
        │   ├── Home.jsx               # Landing
        │   ├── Documents.jsx          # Upload + search + summary
        │   ├── Chat.jsx               # Streaming chat + citations
        │   ├── Extract.jsx            # Batch JSON/CSV extraction
        │   └── Settings.jsx           # Model config
        └── services/api.js            # Backend API client
```

---

## 🔌 API Reference

```
GET  /api/system/health            → Health check
GET  /api/system/models            → Available Ollama models

POST /api/documents/upload         → Upload single document
POST /api/documents/upload-batch   → Upload multiple documents
GET  /api/documents/list           → List all documents
DELETE /api/documents/{id}         → Delete document

POST /api/chat/ask                 → Q&A with source citations
POST /api/chat/ask/stream          → Streaming Q&A

POST /api/extract/structured       → Extract JSON from document
POST /api/extract/batch            → Extract from all documents
POST /api/extract/batch-csv        → Extract all → CSV
GET  /api/extract/templates        → Built-in extraction templates
```

---

## 🏗️ Extraction Templates

Built-in schemas for common document types. Or define your own JSON schema:

```json
// Example: custom contract schema
{
  "parties": [{"name": "string", "role": "string"}],
  "effective_date": "string",
  "key_terms": ["string"],
  "total_value": "number"
}
```

DocuMind validates extraction output against your schema — missing fields are flagged in `_validation_warnings`.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.10+, FastAPI, Uvicorn |
| **AI / LLM** | Ollama (phi4-mini, llama3.x, smollm2, gemma4) |
| **Embeddings** | nomic-embed-text via Ollama |
| **Vector Store** | ChromaDB (persistent, fully local) |
| **OCR** | Tesseract + PyMuPDF + pdf2image + Pillow |
| **Document Parsing** | PyMuPDF (PDF), python-docx (DOCX) |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons |
| **Container** | Docker Compose |

---

## 🗺️ Roadmap

- [x] PDF, DOCX, TXT, MD, CSV support
- [x] RAG pipeline with semantic chunking
- [x] OCR fallback for scanned PDFs
- [x] Structured JSON/CSV extraction with schema validation
- [x] Batch document processing
- [x] Source citations in chat
- [x] Auto-summary on upload
- [x] Chat history persistence
- [x] Markdown export
- [ ] Multi-language OCR (add Tesseract language packs)
- [ ] Document collections / folders
- [ ] Regex + keyword search alongside semantic search
- [ ] API key authentication for team deployments
- [ ] Plugin system for custom extraction templates

---

## 🤝 Contributing

We'd love your help! See **[CONTRIBUTING.md](CONTRIBUTING.md)** for how to get started.

Good first issues are labeled [`good first issue`](https://github.com/yourusername/documind/labels/good%20first%20issue). Adding a new extraction template is as simple as adding a JSON schema — perfect for first-time contributors.

---

## 💬 FAQ

**Q: Do I need a GPU?**
No. All models run on CPU. A modern laptop with 8GB+ RAM is sufficient.

**Q: Can I use this for sensitive documents?**
Yes. Everything runs locally. No data ever leaves your machine.

**Q: What if Tesseract isn't installed?**
DocuMind gracefully skips OCR and processes what text it can. You'll just get less content from image-based PDFs.

**Q: Can I use a cloud model instead?**
The architecture supports any OpenAI-compatible API. Change `OLLAMA_BASE_URL` in `.env` to point to any compatible endpoint.

**Q: How is this different from PrivateGPT / Anything LLM?**
DocuMind is focused specifically on document intelligence: native OCR pipeline, structured extraction with schema validation, and batch CSV export. It's purpose-built for the "extract data from documents" workflow, not just chat.

---

## 📄 License

MIT — Free for personal and commercial use. See [LICENSE](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ — because sensitive documents shouldn't live in the cloud.</sub>
  <br/><br/>
  <strong>If you find this useful, please ⭐ the repo! It helps others discover the project.</strong>
</div>
