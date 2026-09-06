# Contributing to DocuMind

First of all — thank you for considering contributing! DocuMind is a community project built to give everyone private, local document intelligence. Every contribution matters.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Good First Issues](#good-first-issues)
- [How to Contribute](#how-to-contribute)
- [Adding an Extraction Template](#adding-an-extraction-template)
- [Adding OCR Language Support](#adding-ocr-language-support)
- [Development Setup](#development-setup)
- [Commit Convention](#commit-convention)
- [Reporting Bugs](#reporting-bugs)

---

## Code of Conduct

Be kind, be respectful, be constructive. That's it.

---

## Good First Issues

New to the project? These are great starting points — no deep context required:

| Task | Description | Effort |
|------|-------------|--------|
| **Add extraction template** | Add a new JSON schema (e.g., Medical Record, Bank Statement, Receipt) | ⭐ Very easy |
| **Add Tesseract language pack** | Add OCR support for a non-English language | ⭐ Very easy |
| **Improve FAQ in README** | Add an answer to a question that confused you | ⭐ Very easy |
| **Fix a typo / doc error** | Self-explanatory | ⭐ Very easy |
| **Add a file format** | Support `.epub`, `.html`, `.rtf` in the document processor | ⭐⭐ Medium |
| **Improve chunking** | Tune the semantic chunker for better heading-aware splitting | ⭐⭐ Medium |

Look for issues labeled [`good first issue`](https://github.com/Subaru-tech/documind/labels/good%20first%20issue) and [`help wanted`](https://github.com/Subaru-tech/documind/labels/help%20wanted).

---

## How to Contribute

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/documind.git
   cd documind
   ```
3. **Create a branch** (use a descriptive name):
   ```bash
   git checkout -b feat/add-receipt-template
   # or
   git checkout -b fix/ocr-german-language
   ```
4. **Make your changes** (see guides below)
5. **Test** that your change works end-to-end
6. **Commit** using the convention below
7. **Push** and open a Pull Request

---

## Adding an Extraction Template

This is the easiest contribution. Extraction templates live in `backend/app/api/extract.py` inside the `get_extraction_templates` route.

**Step 1:** Open `backend/app/api/extract.py` and find the `templates` list inside `get_extraction_templates()`.

**Step 2:** Add your template — just a name, description, instruction, and JSON schema:

```python
{
    "name": "Medical Record",
    "description": "Extract patient information, diagnosis, and prescriptions",
    "instruction": "Extract all medical information including patient details, diagnosis, medications, and follow-up instructions.",
    "schema": {
        "patient_name": "string",
        "date": "string",
        "diagnosis": ["string"],
        "medications": [{"name": "string", "dosage": "string", "frequency": "string"}],
        "follow_up": "string",
        "doctor": "string"
    }
}
```

**Step 3:** Test it in the UI: go to `/extract`, select your template, choose a relevant document, and click Extract.

**Schema tips:**
- Use `"string"` for text fields
- Use `"number"` for numeric fields
- Use `["string"]` for lists of strings
- Use `[{"key": "type"}]` for lists of objects
- Nested objects are fine: `{"name": "string", "address": "string"}`

---

## Adding OCR Language Support

By default, DocuMind uses English Tesseract (`tesseract-ocr-eng`). Adding more languages takes 2 steps:

**Step 1:** Install the language pack. Example for German:
```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr-deu

# macOS
brew install tesseract-lang
```

**Step 2:** Update `document_processor.py` to accept a language config:

```python
# In _process_pdf(), change:
text = pytesseract.image_to_string(enhanced, config='--psm 6')

# To (example for German):
text = pytesseract.image_to_string(enhanced, lang='deu', config='--psm 6')
```

**Better approach:** open an issue to add a `TESSERACT_LANG` config variable in `.env` so users can set it without code changes — that would be a great pull request!

---

## Development Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8001
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**OCR dependencies (optional):**
```bash
# Ubuntu
sudo apt-get install tesseract-ocr tesseract-ocr-eng poppler-utils

# macOS
brew install tesseract poppler
```

---

## Commit Convention

We use conventional commits:

```
feat: add medical record extraction template
fix: OCR not triggering on dense scanned PDFs
docs: update manual setup instructions
refactor: move chunking logic to dedicated utility
chore: bump chromadb to 0.5.x
```

| Prefix | When to use |
|--------|------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change, no new feature |
| `chore` | Dependency updates, build config |
| `test` | Adding or fixing tests |

---

## Reporting Bugs

Please include:

1. **What you did** — step-by-step to reproduce
2. **What you expected** — what should have happened
3. **What actually happened** — error message, screenshot, or log output
4. **Environment:**
   - OS + version
   - Python version (`python --version`)
   - Node version (`node --version`)
   - Ollama model being used
   - Whether Tesseract is installed

The more detail, the faster we can fix it.

---

## Questions?

Open a [Discussion](https://github.com/Subaru-tech/documind/discussions) — not an issue — for general questions about usage, architecture, or ideas.

---

Thank you for making DocuMind better! 🧠
