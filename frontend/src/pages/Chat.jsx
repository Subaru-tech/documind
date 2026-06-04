import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Download, Trash2, BookOpen, ChevronDown } from 'lucide-react'
import api from '../services/api'

const HISTORY_KEY = (docId) => `documind_chat_${docId || 'all'}`

const INITIAL_MSG = {
  role: 'assistant',
  content: 'Hello! I can answer questions about your uploaded documents. Upload a document first, then ask me anything about it.',
  sources: []
}

function SourcePill({ source }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
      style={{
        background: 'rgba(138,180,248,0.1)',
        color: '#8ab4f8',
        border: '1px solid rgba(138,180,248,0.2)',
      }}
    >
      <BookOpen className="w-3 h-3" />
      {source.filename && <span className="font-medium max-w-[120px] truncate">{source.filename}</span>}
      {source.page && <span style={{ color: 'rgba(138,180,248,0.7)' }}>p.{source.page}</span>}
    </span>
  )
}

function Chat() {
  const [documents, setDocuments] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [messages, setMessages] = useState([INITIAL_MSG])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [docOpen, setDocOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    api.listDocuments().then(data => setDocuments(data.documents || []))
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(HISTORY_KEY(selectedDoc))
    if (stored) {
      try { setMessages(JSON.parse(stored)) } catch { setMessages([INITIAL_MSG]) }
    } else {
      setMessages([INITIAL_MSG])
    }
  }, [selectedDoc])

  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem(HISTORY_KEY(selectedDoc), JSON.stringify(messages))
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selectedDoc])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg, sources: [] }])
    setLoading(true)
    try {
      const data = await api.askQuestion(userMsg, selectedDoc)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources || []
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Make sure Ollama is running.',
        sources: []
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY(selectedDoc))
    setMessages([INITIAL_MSG])
  }

  const exportMarkdown = () => {
    const docName = selectedDoc
      ? documents.find(d => d.doc_id === selectedDoc)?.metadata?.filename || selectedDoc
      : 'All Documents'
    const lines = [`# DocuMind Chat — ${docName}`, `_${new Date().toLocaleString()}_`, '']
    messages.forEach(m => {
      if (m.role === 'user') lines.push(`**You:** ${m.content}`, '')
      else {
        lines.push(`**DocuMind:** ${m.content}`, '')
        if (m.sources?.length) lines.push(`_Sources: ${m.sources.map(s => s.filename || '').join(', ')}_`, '')
      }
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `chat_${Date.now()}.md`; a.click()
    URL.revokeObjectURL(url)
  }

  const selectedDocName = selectedDoc
    ? documents.find(d => d.doc_id === selectedDoc)?.metadata?.filename || 'Document'
    : 'All Documents'

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--surface-bg)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid var(--surface-border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div>
          <h1 className="text-base font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
            Chat with Documents
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ask questions about your uploaded files</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportMarkdown} className="p-2 rounded-xl transition-all" style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
            title="Export as Markdown">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={clearHistory} className="p-2 rounded-xl transition-all" style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f28b82'; e.currentTarget.style.background = 'rgba(242,139,130,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
            title="Clear history">
            <Trash2 className="w-4 h-4" />
          </button>
          {/* Document selector */}
          <div className="relative">
            <button
              onClick={() => setDocOpen(!docOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--surface-border)',
                color: 'var(--text-primary)',
                maxWidth: '200px',
              }}
            >
              <span className="truncate text-xs">{selectedDocName}</span>
              <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            </button>
            {docOpen && (
              <div
                className="absolute right-0 top-full mt-1 rounded-2xl overflow-hidden z-50 min-w-[200px]"
                style={{
                  background: '#1e2028',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
              >
                {[{ doc_id: null, metadata: { filename: 'All Documents' } }, ...documents].map(doc => (
                  <button
                    key={doc.doc_id || 'all'}
                    onClick={() => { setSelectedDoc(doc.doc_id); setDocOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-xs transition-colors"
                    style={{
                      color: selectedDoc === doc.doc_id ? '#8ab4f8' : 'var(--text-secondary)',
                      background: selectedDoc === doc.doc_id ? 'rgba(138,180,248,0.08)' : 'transparent',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = selectedDoc === doc.doc_id ? 'rgba(138,180,248,0.08)' : 'transparent'}
                  >
                    {doc.metadata?.filename || 'All Documents'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close doc dropdown */}
      {docOpen && <div className="fixed inset-0 z-40" onClick={() => setDocOpen(false)} />}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(138,180,248,0.12)', border: '1px solid rgba(138,180,248,0.2)' }}>
                <Bot className="w-4 h-4" style={{ color: '#8ab4f8' }} />
              </div>
            )}
            <div className="max-w-2xl space-y-2">
              <div
                className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                style={msg.role === 'user'
                  ? { background: '#8ab4f8', color: '#0d1117', fontWeight: 500 }
                  : { background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--surface-border)' }
                }
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.sources?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-1">
                  {msg.sources.map((src, j) => <SourcePill key={j} source={src} />)}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <User className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(138,180,248,0.12)', border: '1px solid rgba(138,180,248,0.2)' }}>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#8ab4f8' }} />
            </div>
            <div className="px-4 py-3 rounded-2xl text-sm flex items-center gap-2"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}>
              <span className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full animate-pulse-slow inline-block"
                    style={{ background: '#8ab4f8', animationDelay: `${i * 200}ms` }} />
                ))}
              </span>
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-6 pb-6">
        <div
          className="flex items-end gap-3 p-2 rounded-2xl transition-all"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--surface-border)',
          }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
            }}
            placeholder="Ask about your documents... (Shift+Enter for new line)"
            className="flex-1 bg-transparent outline-none resize-none text-sm py-2 px-2"
            style={{
              color: 'var(--text-primary)',
              minHeight: '36px',
              maxHeight: '120px',
              scrollbarWidth: 'none',
            }}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{
              background: input.trim() && !loading ? '#8ab4f8' : 'rgba(255,255,255,0.06)',
              color: input.trim() && !loading ? '#0d1117' : 'var(--text-muted)',
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
          Powered by Ollama · Runs 100% locally
        </p>
      </div>
    </div>
  )
}

export default Chat
