const API_BASE = '/api'

class ApiService {
  async uploadFile(file) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || `Upload failed (${res.status})`)
    }
    return res.json()
  }
  
  async listDocuments() {
    const res = await fetch(`${API_BASE}/documents/list`)
    if (!res.ok) {
      throw new Error(`Failed to list documents (${res.status})`)
    }
    return res.json()
  }
  
  async uploadMultipleFiles(files) {
    const formData = new FormData()
    for (const file of files) {
      formData.append('files', file)
    }
    const res = await fetch(`${API_BASE}/documents/upload-batch`, {
      method: 'POST',
      body: formData
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || `Batch upload failed (${res.status})`)
    }
    return res.json()
  }

  async deleteDocument(docId) {
    const res = await fetch(`${API_BASE}/documents/${docId}`, { method: 'DELETE' })
    if (!res.ok) {
      throw new Error(`Failed to delete document (${res.status})`)
    }
    return res.json()
  }
  
  async askQuestion(question, docId = null, model = null) {
    const res = await fetch(`${API_BASE}/chat/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, doc_id: docId, model })
    })
    if (!res.ok) {
      throw new Error(`Chat request failed (${res.status})`)
    }
    return res.json()
  }
  
  async askQuestionStream(question, docId = null, model = null, onToken) {
    const res = await fetch(`${API_BASE}/chat/ask/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, doc_id: docId, model })
    })
    if (!res.ok) {
      throw new Error(`Stream request failed (${res.status})`)
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      onToken(decoder.decode(value))
    }
  }
  
  async extractStructured(docId, instruction, schema = null, model = null) {
    const res = await fetch(`${API_BASE}/extract/structured`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc_id: docId, instruction, extract_schema: schema, model })
    })
    if (!res.ok) {
      throw new Error(`Extraction failed (${res.status})`)
    }
    return res.json()
  }
  
  async extractBatch(instruction, schema = null, model = null) {
    const res = await fetch(`${API_BASE}/extract/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction, extract_schema: schema, model })
    })
    if (!res.ok) {
      throw new Error(`Batch extraction failed (${res.status})`)
    }
    return res.json()
  }

  async extractBatchCsv(instruction, schema = null, model = null) {
    const res = await fetch(`${API_BASE}/extract/batch-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction, extract_schema: schema, model })
    })
    if (!res.ok) {
      throw new Error(`Batch CSV extraction failed (${res.status})`)
    }
    return res.json()
  }

  async getExtractionTemplates() {
    const res = await fetch(`${API_BASE}/extract/templates`)
    return res.json()
  }
  
  async getSystemInfo() {
    const res = await fetch(`${API_BASE}/system/config`)
    return res.json()
  }
  
  async getModels() {
    const res = await fetch(`${API_BASE}/system/models`)
    return res.json()
  }
}

export default new ApiService()
