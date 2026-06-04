import { Link } from 'react-router-dom'
import { Upload, MessageSquare, Database, Shield, Cpu, FileText, ScanLine, Sparkles } from 'lucide-react'

function Home() {
  return (
    <div className="p-10 max-w-5xl mx-auto animate-fade-in">
      {/* Hero */}
      <div className="text-center py-16">
        {/* Glow orb */}
        <div className="relative inline-flex mb-8">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(138,180,248,0.2), rgba(138,180,248,0.05))',
              border: '1px solid rgba(138,180,248,0.3)',
              boxShadow: '0 0 48px rgba(138,180,248,0.15)',
            }}
          >
            <Shield className="w-10 h-10" style={{ color: '#8ab4f8' }} />
          </div>
          <div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: '#8ab4f8' }}
          >
            <Sparkles className="w-3 h-3" style={{ color: '#0d1117' }} />
          </div>
        </div>

        <h1
          className="text-5xl font-display font-bold mb-5 leading-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Document Intelligence,<br />
          <span style={{ color: '#8ab4f8' }}>Completely Local</span>
        </h1>
        <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          Upload documents, chat with them, and extract structured data — all running on your machine.
          No API keys. No cloud. No data leaves your device.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/documents" className="btn-primary text-sm px-6 py-3">
            <Upload className="w-4 h-4" />
            Upload Document
          </Link>
          <Link to="/chat" className="btn-secondary text-sm px-6 py-3">
            <MessageSquare className="w-4 h-4" />
            Start Chatting
          </Link>
        </div>
      </div>
      
      {/* Feature cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-16">
        {[
          {
            icon: MessageSquare,
            color: '#8ab4f8',
            bg: 'rgba(138,180,248,0.1)',
            title: 'Chat with Documents',
            desc: 'Ask natural language questions about your PDFs, contracts, and reports. Get precise answers with source citations.',
          },
          {
            icon: Database,
            color: '#81c995',
            bg: 'rgba(129,201,149,0.1)',
            title: 'Structured Extraction',
            desc: 'Extract invoices, resumes, and contracts into JSON or CSV automatically. Use built-in templates or define your own.',
          },
          {
            icon: ScanLine,
            color: '#fdd663',
            bg: 'rgba(253,214,99,0.1)',
            title: 'OCR + Any Document',
            desc: 'Scanned PDFs? No problem. Automatic OCR detects image-based pages and extracts text using Tesseract.',
          },
        ].map((f, i) => (
          <div
            key={i}
            className="card group cursor-default transition-all duration-200"
            style={{ border: '1px solid var(--surface-border)' }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--surface-border)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: f.bg }}>
              <f.icon className="w-5 h-5" style={{ color: f.color }} />
            </div>
            <h3 className="text-base font-display font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {f.title}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="card" style={{ background: 'rgba(0,0,0,0.15)' }}>
        <h2 className="text-lg font-display font-semibold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
          How It Works
        </h2>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {[
            { icon: FileText, label: 'Upload', desc: 'PDF, DOCX, TXT, CSV', color: '#8ab4f8' },
            { icon: Cpu, label: 'Process', desc: 'Local AI embeds & indexes', color: '#81c995' },
            { icon: MessageSquare, label: 'Query', desc: 'Chat or extract data', color: '#fdd663' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-center w-36 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--surface-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ background: `${step.color}18` }}>
                  <step.icon className="w-4 h-4" style={{ color: step.color }} />
                </div>
                <div className="font-medium text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>{step.label}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{step.desc}</div>
              </div>
              {i < 2 && (
                <div className="text-xl" style={{ color: 'var(--surface-border)' }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
