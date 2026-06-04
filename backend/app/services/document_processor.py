"""Document Processing - Extract text from various formats"""
import os
from pathlib import Path
from typing import List, Dict
import csv
import re

try:
    import fitz
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

try:
    import pytesseract
    from PIL import Image, ImageEnhance, ImageFilter
    from pdf2image import convert_from_path
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

try:
    import docx
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

from app.core.config import settings


class DocumentProcessor:
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    async def process_file(self, file_path: str) -> Dict[str, any]:
        path = Path(file_path)
        ext = path.suffix.lower()
        if ext not in settings.SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported file type: {ext}")
        
        if ext == ".pdf":
            return await self._process_pdf(path)
        elif ext in [".txt", ".md"]:
            return await self._process_text(path)
        elif ext == ".docx":
            return await self._process_docx(path)
        elif ext == ".csv":
            return await self._process_csv(path)
        return {"text": "", "metadata": {}, "chunks": []}
    
    async def _process_pdf(self, path: Path) -> Dict:
        if not PYMUPDF_AVAILABLE:
            raise ImportError("PyMuPDF not installed. Run: pip install PyMuPDF")
        doc = fitz.open(str(path))
        text_parts = []
        ocr_used = False
        metadata = {
            "page_count": len(doc),
            "title": doc.metadata.get("title", ""),
            "author": doc.metadata.get("author", ""),
            "file_type": "pdf"
        }
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text()
            
            # Fallback to OCR if text is suspiciously empty and OCR is available
            if len(text.strip()) < 200 and OCR_AVAILABLE:
                try:
                    # Convert specific page using pdf2image (1-indexed)
                    images = convert_from_path(str(path), first_page=page_num+1, last_page=page_num+1, dpi=300)
                    if images:
                        img = images[0]
                        # Image preprocessing pipeline
                        img = img.convert('L') # Grayscale
                        img = ImageEnhance.Contrast(img).enhance(2.0) # 2x contrast boost
                        img = img.filter(ImageFilter.SHARPEN) # Sharpen
                        
                        # Tesseract with specific config
                        ocr_text = pytesseract.image_to_string(img, config='--psm 6')
                        if ocr_text.strip():
                            text = ocr_text
                            ocr_used = True
                except Exception as e:
                    import logging
                    logging.error(f"OCR failed on page {page_num}: {e}")
                    
            text_parts.append(f"\n--- Page {page_num + 1} ---\n{text}")
        doc.close()
        
        metadata["ocr_used"] = ocr_used
        full_text = "\n".join(text_parts)
        return {
            "text": full_text,
            "metadata": metadata,
            "chunks": self._chunk_text(full_text)
        }
    
    async def _process_text(self, path: Path) -> Dict:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        return {
            "text": text,
            "metadata": {"file_type": path.suffix[1:], "line_count": text.count("\n")},
            "chunks": self._chunk_text(text)
        }
    
    async def _process_docx(self, path: Path) -> Dict:
        if not DOCX_AVAILABLE:
            raise ImportError("python-docx not installed. Run: pip install python-docx")
        doc = docx.Document(str(path))
        text_parts = [para.text for para in doc.paragraphs if para.text.strip()]
        full_text = "\n\n".join(text_parts)
        return {
            "text": full_text,
            "metadata": {"file_type": "docx", "paragraph_count": len(text_parts)},
            "chunks": self._chunk_text(full_text)
        }
    
    async def _process_csv(self, path: Path) -> Dict:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.reader(f)
            rows = list(reader)
        if not rows:
            return {"text": "", "metadata": {}, "chunks": []}
        lines = ["| " + " | ".join(rows[0]) + " |"]
        lines.append("| " + " | ".join(["---"] * len(rows[0])) + " |")
        for row in rows[1:]:
            lines.append("| " + " | ".join(row) + " |")
        text = "\n".join(lines)
        return {
            "text": text,
            "metadata": {"file_type": "csv", "row_count": len(rows)},
            "chunks": self._chunk_text(text)
        }
    
    def _chunk_text(self, text: str) -> List[str]:
        """Semantic chunking preserving sentence boundaries and paragraphs."""
        chunks = []
        
        # Normalize newlines
        text = text.replace('\r\n', '\n')
        
        # Split into paragraphs
        paragraphs = [p for p in re.split(r'\n{2,}', text) if p.strip()]
        
        current_chunk = ""
        
        for paragraph in paragraphs:
            # If the paragraph itself is too large, split it by sentences
            if len(paragraph) > settings.CHUNK_SIZE:
                # Split by sentence boundaries (approximate)
                sentences = [s for s in re.split(r'(?<=[.!?])\s+', paragraph) if s.strip()]
                for sentence in sentences:
                    if len(current_chunk) + len(sentence) + 1 > settings.CHUNK_SIZE and current_chunk:
                        chunks.append(current_chunk.strip())
                        
                        # Calculate overlap from current_chunk's sentences
                        overlap_text = ""
                        prev_sentences = [s for s in re.split(r'(?<=[.!?])\s+', current_chunk) if s.strip()]
                        for ps in reversed(prev_sentences):
                            if len(overlap_text) + len(ps) + 1 <= settings.CHUNK_OVERLAP:
                                overlap_text = (ps + " " + overlap_text).strip()
                            else:
                                break
                        current_chunk = overlap_text
                    
                    if current_chunk:
                        current_chunk += " " + sentence
                    else:
                        current_chunk = sentence
            else:
                separator = "\n\n" if current_chunk else ""
                if len(current_chunk) + len(paragraph) + len(separator) > settings.CHUNK_SIZE and current_chunk:
                    chunks.append(current_chunk.strip())
                    
                    # Calculate overlap
                    overlap_text = ""
                    prev_sentences = [s for s in re.split(r'(?<=[.!?])\s+', current_chunk) if s.strip()]
                    for ps in reversed(prev_sentences):
                        if len(overlap_text) + len(ps) + 1 <= settings.CHUNK_OVERLAP:
                            overlap_text = (ps + " " + overlap_text).strip()
                        else:
                            break
                    current_chunk = overlap_text
                    separator = "\n\n" if current_chunk else ""
                
                current_chunk += separator + paragraph
                
        if current_chunk:
            chunks.append(current_chunk.strip())
            
        return [c for c in chunks if c]
