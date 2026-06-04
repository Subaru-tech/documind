import { useState, useEffect } from 'react'
import { Database, Loader2, Copy, CheckCircle, Download, FileSpreadsheet, Sparkles } from 'lucide-react'
import api from '../services/api'

function Extract() {
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [documents, setDocuments] = useState([])
  const [selectedDoc, setSelectedDoc] = useState('')
  const [customInstruction, setCustomInstruction] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [batchMode, setBatchMode] = useState(false)
  const [csvDownloaded, setCsvDownloaded] = useState(false)

  useEffect(() => {
    api.getExtractionTemplates().then(data => setTemplates(data.templates || []))
    api.listDocuments().then(data => setDocuments(data.documents || []))
  }, [])

  const handleExtract = async () => {
    if (!batchMode && !selectedDoc) { alert('Select a document first'); return }
    if (batchMode && documents.length === 0) { alert('No documents to extract from'); return }
    setLoading(true); setResult(null)
    try {
      const instruction = selectedTemplate ? selectedTemplate.instruction : customInstruction
      const schema = selectedTemplate?.schema
      if (batchMode) {
        const data = await api.extractBatch(instruction, schema)
        setResult(data)
      } else {
        const data = await api.extractStructured(selectedDoc, instruction, schema)
        setResult(data)
      }
    } catch (err) {
      alert('Extraction failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExtractCsv = async () => {
    if (documents.length === 0) { alert('No documents to extract from'); return }
    setLoading(true); setResult(null)
    try {
      const instruction = selectedTemplate ? selectedTemplate.instruction : customInstruction
      const data = await api.extractBatchCsv(instruction, selectedTemplate?.schema)
      setResult(data); setCsvDownloaded(false)
    } catch (err) {
      alert('CSV extraction failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadCsv = () => {
    if (!result?.csv) return
    const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `documind_extract_${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
    setCsvDownloaded(true)
    setTimeout(() => setCsvDownloaded(false), 3000)
  }

  const copyToClipboard = () => {
    const text = result?.csv || JSON.stringify(result, null, 2)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const instruction = selectedTemplate ? selectedTemplate.instruction : customInstruction

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
          Structured Extraction
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Extract specific data from documents into JSON or CSV
        </p>
      </div>

      {/* Mode Toggle */}
      <div
        className="inline-flex p-1 rounded-xl mb-6"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--surface-border)' }}
      >
        {['Single Document', 'Batch All Documents'].map((label, i) => (
          <button
            key={label}
            onClick={() => setBatchMode(i === 1)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
            style={
              (i === 1) === batchMode
                ? { background: '#8ab4f8', color: '#0d1117' }
                : { background: 'transparent', color: 'var(--text-secondary)' }
            }
          >
            {i === 1 && <FileSpreadsheet className="w-3.5 h-3.5" />}
            {label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Document selector */}
          {!batchMode && (
            <div className="card">
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Select Document
              </label>
              <select
                className="input"
                value={selectedDoc}
                onChange={(e) => setSelectedDoc(e.target.value)}
              >
                <option value="">Choose a document...</option>
                {documents.map(doc => (
                  <option key={doc.doc_id} value={doc.doc_id}>
                    {doc.metadata?.filename || doc.doc_id}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Batch info */}
          {batchMode && (
            <div
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: 'rgba(138,180,248,0.06)', border: '1px solid rgba(138,180,248,0.15)' }}
            >
              <Database className="w-5 h-5 flex-shrink-0" style={{ color: '#8ab4f8' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: '#8ab4f8' }}>Batch Mode</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Will extract from all <strong>{documents.length}</strong> document(s)
                </p>
              </div>
            </div>
          )}

          {/* Templates */}
          <div className="card">
            <label className="block text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
              Extraction Template
            </label>
            <div className="space-y-2">
              {templates.map(tmpl => (
                <button
                  key={tmpl.name}
                  onClick={() => setSelectedTemplate(selectedTemplate?.name === tmpl.name ? null : tmpl)}
                  className="w-full text-left p-3 rounded-xl transition-all duration-150"
                  style={{
                    background: selectedTemplate?.name === tmpl.name
                      ? 'rgba(138,180,248,0.1)'
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedTemplate?.name === tmpl.name ? 'rgba(138,180,248,0.3)' : 'var(--surface-border)'}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    {selectedTemplate?.name === tmpl.name && (
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8ab4f8' }} />
                    )}
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{tmpl.name}</div>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{tmpl.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom instruction */}
          <div className="card">
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Or write a custom instruction
            </label>
            <textarea
              className="input resize-none text-sm"
              style={{ height: '80px' }}
              placeholder="e.g., Extract all dates and dollar amounts from this contract..."
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              disabled={selectedTemplate !== null}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleExtract}
              disabled={loading || (!batchMode && !selectedDoc) || (batchMode && documents.length === 0) || !instruction}
              className="btn-primary flex-1 py-2.5"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Extracting...</>
                : <><Database className="w-4 h-4" /> {batchMode ? 'Extract All' : 'Extract Data'}</>
              }
            </button>
            {batchMode && (
              <button
                onClick={handleExtractCsv}
                disabled={loading || documents.length === 0 || !instruction}
                className="btn-secondary px-4 py-2.5"
                title="Export as CSV"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>

          {loading && batchMode && (
            <div
              className="rounded-xl p-3 flex items-center gap-2 text-sm"
              style={{ background: 'rgba(138,180,248,0.06)', border: '1px solid rgba(138,180,248,0.15)', color: 'var(--text-secondary)' }}
            >
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#8ab4f8' }} />
              Processing {documents.length} document(s)...
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>(may take a while)</span>
            </div>
          )}
        </div>

        {/* Results panel */}
        <div>
          <div className="card flex flex-col" style={{ minHeight: '400px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {batchMode ? 'Batch Results' : 'Result'}
                {result?.total !== undefined && (
                  <span className="text-xs font-normal ml-2" style={{ color: 'var(--text-muted)' }}>
                    ({result.success} ok · {result.failed} errors)
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {result?.csv && (
                  <button
                    onClick={downloadCsv}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-all"
                    style={{ color: '#8ab4f8', background: 'rgba(138,180,248,0.08)' }}
                  >
                    {csvDownloaded ? <CheckCircle className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                    {csvDownloaded ? 'Downloaded!' : 'Download CSV'}
                  </button>
                )}
                {result && (
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-all"
                    style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)' }}
                  >
                    {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
            </div>

            {loading && !batchMode ? (
              <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                  <p className="text-sm">Running extraction...</p>
                </div>
              </div>
            ) : result ? (
              <div className="flex-1 overflow-hidden">
                {batchMode && result.results ? (
                  <div className="h-full flex flex-col">
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { label: 'Succeeded', val: result.success || 0, color: '#81c995' },
                        { label: 'Failed', val: result.failed || 0, color: '#f28b82' },
                        { label: 'Total', val: result.total || 0, color: '#8ab4f8' },
                      ].map(s => (
                        <div key={s.label} className="rounded-xl p-3 text-center"
                          style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}>
                          <div className="text-2xl font-bold" style={{ color: s.color }}>{s.val}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2">
                      {result.results?.map((r, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl text-sm"
                          style={{
                            background: r.status === 'success' ? 'rgba(129,201,149,0.06)' : 'rgba(242,139,130,0.06)',
                            border: `1px solid ${r.status === 'success' ? 'rgba(129,201,149,0.2)' : 'rgba(242,139,130,0.2)'}`,
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-xs" style={{ color: 'var(--text-primary)' }}>{r.filename}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: r.status === 'success' ? 'rgba(129,201,149,0.15)' : 'rgba(242,139,130,0.15)',
                                color: r.status === 'success' ? '#81c995' : '#f28b82',
                              }}>
                              {r.status}
                            </span>
                          </div>
                          {r.data && (
                            <pre className="text-xs overflow-x-auto max-h-20 mt-1" style={{ color: 'var(--text-secondary)' }}>
                              {JSON.stringify(r.data, null, 1)}
                            </pre>
                          )}
                          {r.error && <p className="text-xs mt-1" style={{ color: '#f28b82' }}>{r.error}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : result.csv ? (
                  <pre
                    className="flex-1 p-4 rounded-xl text-xs overflow-auto leading-relaxed"
                    style={{ background: '#0d1117', color: '#81c995', fontFamily: 'monospace' }}
                  >
                    {result.csv}
                  </pre>
                ) : (
                  <pre
                    className="flex-1 p-4 rounded-xl text-xs overflow-auto leading-relaxed"
                    style={{ background: '#0d1117', color: '#81c995', fontFamily: 'monospace' }}
                  >
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                <div className="text-center">
                  <Database className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Extraction results will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Extract
