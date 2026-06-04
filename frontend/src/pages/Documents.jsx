import { useState, useEffect, useCallback, useRef } from 'react'
import { Upload, FileText, Trash2, Loader2, CheckCircle, ScanLine, Search, ChevronDown, ChevronUp, FolderOpen } from 'lucide-react'
import api from '../services/api'

function Documents() {
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, status: '' })
  const [loading, setLoading] = useState(true)
  const [dragActive, setDragActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSummary, setExpandedSummary] = useState(null)
  const fileInputRef = useRef(null)
  const folderInputRef = useRef(null)

  const loadDocs = useCallback(async () => {
    try {
      const data = await api.listDocuments()
      setDocuments(data.documents || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocs()
    const interval = setInterval(loadDocs, 5000)
    return () => clearInterval(interval)
  }, [loadDocs])

  const filteredDocuments = documents.filter(doc =>
    (doc.metadata?.filename || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleUpload = async (file) => {
    if (!file) return
    setUploading(true)
    setUploadProgress({ current: 1, total: 1, status: 'Processing...' })
    try {
      await api.uploadFile(file)
      await loadDocs()
    } catch (err) {
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
      setUploadProgress({ current: 0, total: 0, status: '' })
    }
  }

  const handleBatchUpload = async (files) => {
    if (!files || files.length === 0) return
    const validFiles = Array.from(files).filter(f => {
      const ext = '.' + f.name.split('.').pop().toLowerCase()
      return ['.pdf', '.txt', '.md', '.docx', '.csv'].includes(ext)
    })
    if (validFiles.length === 0) {
      alert('No supported files found. Supported: PDF, TXT, MD, DOCX, CSV')
      return
    }
    setUploading(true)
    setUploadProgress({ current: 0, total: validFiles.length, status: `Uploading ${validFiles.length} files...` })
    try {
      const result = await api.uploadMultipleFiles(validFiles)
      setUploadProgress({
        current: result.success + result.failed,
        total: validFiles.length,
        status: `Done — ${result.success} succeeded, ${result.failed} failed`,
      })
      await new Promise(r => setTimeout(r, 1500))
      await loadDocs()
    } catch (err) {
      alert('Batch upload failed: ' + err.message)
    } finally {
      setUploading(false)
      setUploadProgress({ current: 0, total: 0, status: '' })
    }
  }

  const handleDelete = async (docId) => {
    if (!confirm('Delete this document?')) return
    await api.deleteDocument(docId)
    await loadDocs()
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = e.dataTransfer.files
    if (files?.length > 0) files.length === 1 ? handleUpload(files[0]) : handleBatchUpload(files)
  }

  const fileTypeIcon = (ft) => {
    const colors = { pdf: '#f28b82', docx: '#8ab4f8', txt: '#81c995', md: '#c58af9', csv: '#fdd663' }
    return colors[ft] || '#9aa0a6'
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>Documents</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Upload and manage your document library</p>
        </div>
      </div>
      
      {/* Upload Zone */}
      <div
        className="rounded-2xl p-10 text-center mb-6 transition-all duration-200 cursor-pointer"
        style={{
          background: dragActive ? 'rgba(138,180,248,0.06)' : 'rgba(255,255,255,0.02)',
          border: `2px dashed ${dragActive ? '#8ab4f8' : 'rgba(255,255,255,0.1)'}`,
          boxShadow: dragActive ? '0 0 32px rgba(138,180,248,0.1)' : 'none',
          transform: dragActive ? 'scale(1.005)' : 'scale(1)',
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: 'rgba(138,180,248,0.1)',
            border: '1px solid rgba(138,180,248,0.2)',
          }}
        >
          <Upload className="w-7 h-7" style={{ color: '#8ab4f8' }} />
        </div>
        <p className="text-base font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          Drag & drop files here
        </p>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          or click to browse — PDF, TXT, MD, DOCX, CSV up to 50MB
        </p>
        <div className="flex gap-3 justify-center flex-wrap" onClick={e => e.stopPropagation()}>
          <label className="btn-secondary text-xs px-4 py-2 cursor-pointer">
            <FileText className="w-3.5 h-3.5" />
            Browse Files
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.txt,.md,.docx,.csv"
              onChange={(e) => {
                if (e.target.files?.length > 1) handleBatchUpload(e.target.files)
                else if (e.target.files?.[0]) handleUpload(e.target.files[0])
                e.target.value = ''
              }}
            />
          </label>
          <label className="btn-secondary text-xs px-4 py-2 cursor-pointer">
            <FolderOpen className="w-3.5 h-3.5" />
            Choose Folder
            <input
              ref={folderInputRef}
              type="file"
              className="hidden"
              webkitdirectory=""
              directory=""
              multiple
              onChange={(e) => {
                if (e.target.files?.length) handleBatchUpload(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
        </div>

        {/* Progress */}
        {uploading && uploadProgress.total > 0 && (
          <div className="mt-6 max-w-sm mx-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#8ab4f8' }} />
                {uploadProgress.status}
              </span>
              <span>{uploadProgress.current}/{uploadProgress.total}</span>
            </div>
            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                  background: 'linear-gradient(90deg, #8ab4f8, #5195ee)',
                }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Document List */}
      {loading ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No documents yet. Upload one to get started.</p>
        </div>
      ) : (
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {filteredDocuments.length}{filteredDocuments.length !== documents.length ? ` of ${documents.length}` : ''} document{documents.length !== 1 ? 's' : ''}
            </p>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Filter..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input pl-8 py-1.5 text-xs w-48"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredDocuments.map(doc => {
              const ft = doc.metadata?.file_type || 'txt'
              const color = fileTypeIcon(ft)
              return (
                <div
                  key={doc.doc_id}
                  className="rounded-2xl p-4 transition-all duration-150"
                  style={{
                    background: 'var(--surface-card)',
                    border: '1px solid var(--surface-border)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--surface-border)'}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={{ background: `${color}18`, color }}
                      >
                        {ft.toUpperCase().slice(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                            {doc.metadata?.filename || 'Untitled'}
                          </h3>
                          {doc.metadata?.ocr_used && (
                            <span className="chip-amber text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                              style={{ background: 'rgba(253,214,99,0.1)', color: '#fdd663', border: '1px solid rgba(253,214,99,0.2)', fontSize: '10px' }}>
                              <ScanLine className="w-2.5 h-2.5" />
                              OCR
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {ft.toUpperCase()} · {doc.chunk_count} chunks
                          {doc.metadata?.page_count ? ` · ${doc.metadata.page_count}p` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="flex items-center gap-1 text-xs" style={{ color: '#81c995' }}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Ready
                      </span>
                      {doc.metadata?.summary && (
                        <button
                          onClick={() => setExpandedSummary(expandedSummary === doc.doc_id ? null : doc.doc_id)}
                          className="p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1"
                          style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#8ab4f8'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                          {expandedSummary === doc.doc_id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(doc.doc_id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f28b82'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {expandedSummary === doc.doc_id && doc.metadata?.summary && (
                    <div
                      className="mt-3 pt-3 text-sm leading-relaxed animate-fade-in"
                      style={{
                        borderTop: '1px solid var(--surface-border)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {doc.metadata.summary}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Documents
