"""Extraction API Routes - Structured Data"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from app.services.rag_engine import rag_engine
import csv
import io
import json

router = APIRouter(prefix="/extract", tags=["extraction"])
rag = rag_engine


class ExtractRequest(BaseModel):
    doc_id: Optional[str] = None
    instruction: str
    extract_schema: Optional[Dict[str, Any]] = None
    model: Optional[str] = None


@router.post("/structured")
async def extract_structured(request: ExtractRequest):
    try:
        result = await rag.extract_structured(
            doc_id=request.doc_id,
            instruction=request.instruction,
            schema=request.extract_schema,
            model=request.model
        )
        return result
    except Exception as e:
        raise HTTPException(500, f"Extraction failed: {str(e)}")


@router.post("/batch")
async def extract_batch(request: ExtractRequest):
    """Extract structured data from ALL documents at once."""
    try:
        result = await rag.extract_batch(
            instruction=request.instruction,
            schema=request.extract_schema,
            model=request.model
        )
        
        successes = [r for r in result if r.get("status") == "success"]
        errors = [r for r in result if r.get("status") == "error"]
        
        return {
            "total": len(result),
            "success": len(successes),
            "failed": len(errors),
            "results": result
        }
    except Exception as e:
        raise HTTPException(500, f"Batch extraction failed: {str(e)}")


@router.post("/batch-csv")
async def extract_batch_csv(request: ExtractRequest):
    """Extract from ALL documents and return as CSV string."""
    try:
        result = await rag.extract_batch(
            instruction=request.instruction,
            schema=request.extract_schema,
            model=request.model
        )
        
        # Build CSV from results
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Collect all unique keys across all results
        all_keys = ["filename", "doc_id", "status"]
        for r in result:
            if r.get("data") and isinstance(r["data"], dict):
                for key in r["data"].keys():
                    key_str = str(key)
                    if key_str not in all_keys:
                        all_keys.append(key_str)
        
        writer.writerow(all_keys)
        
        for r in result:
            row = []
            for key in all_keys:
                if key == "filename":
                    row.append(r.get("filename", ""))
                elif key == "doc_id":
                    row.append(r.get("doc_id", ""))
                elif key == "status":
                    row.append(r.get("status", ""))
                else:
                    val = r.get("data", {}).get(key, "") if isinstance(r.get("data"), dict) else ""
                    # Convert nested dicts/lists to string
                    if isinstance(val, (dict, list)):
                        val = json.dumps(val)
                    row.append(str(val))
            writer.writerow(row)
        
        csv_content = output.getvalue()
        
        return {
            "total": len(result),
            "success": len([r for r in result if r.get("status") == "success"]),
            "failed": len([r for r in result if r.get("status") == "error"]),
            "csv": csv_content,
            "results": result
        }
    except Exception as e:
        raise HTTPException(500, f"Batch CSV extraction failed: {str(e)}")


@router.get("/templates")
async def get_extraction_templates():
    return {
        "templates": [
            {
                "name": "Invoice",
                "description": "Extract invoice details",
                "instruction": "Extract all invoice information including vendor, items, amounts, tax, and total.",
                "schema": {
                    "invoice_number": "string",
                    "date": "string",
                    "vendor": {"name": "string", "address": "string"},
                    "items": [{"description": "string", "quantity": "number", "price": "number"}],
                    "subtotal": "number",
                    "tax": "number",
                    "total": "number"
                }
            },
            {
                "name": "Resume",
                "description": "Extract resume information",
                "instruction": "Extract all relevant resume information.",
                "schema": {
                    "name": "string",
                    "email": "string",
                    "phone": "string",
                    "skills": ["string"],
                    "experience": [{"company": "string", "role": "string", "duration": "string"}],
                    "education": [{"institution": "string", "degree": "string", "year": "string"}]
                }
            },
            {
                "name": "Contract",
                "description": "Extract key contract terms",
                "instruction": "Extract key terms, dates, parties, and obligations from this contract.",
                "schema": {
                    "parties": [{"name": "string", "role": "string"}],
                    "effective_date": "string",
                    "termination_date": "string",
                    "key_terms": ["string"],
                    "payment_terms": "string",
                    "governing_law": "string"
                }
            }
        ]
    }
