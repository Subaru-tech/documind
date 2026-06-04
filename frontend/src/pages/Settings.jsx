import { useState, useEffect } from 'react'
import { Cpu, AlertCircle, CheckCircle, Server, Zap } from 'lucide-react'
import api from '../services/api'

function Settings() {
  const [systemInfo, setSystemInfo] = useState(null)
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [ollamaStatus, setOllamaStatus] = useState('checking')

  useEffect(() => {
    const load = async () => {
      try {
        const [info, modelData] = await Promise.all([api.getSystemInfo(), api.getModels()])
        setSystemInfo(info)
        setModels(modelData.available_models || [])
        setOllamaStatus('connected')
      } catch {
        setOllamaStatus('disconnected')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const tiers = [
    { name: 'Ultra Low', model: 'smollm2:1.7b', ram: '< 4 GB', desc: 'Chromebooks, Raspberry Pi', color: '#9aa0a6' },
    { name: 'Low', model: 'llama3.2:3b', ram: '4–8 GB', desc: 'Basic laptops, lightweight usage', color: '#81c995' },
    { name: 'Medium', model: 'phi4-mini', ram: '8–12 GB', desc: 'Recommended — best quality/performance', color: '#8ab4f8', recommended: true },
    { name: 'High', model: 'llama3.1:8b', ram: '16 GB+', desc: 'Maximum reasoning quality', color: '#c58af9' },
    { name: 'Vision', model: 'gemma4:e4b', ram: '12 GB+', desc: 'Scanned PDFs, image documents', color: '#fdd663' },
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Model configuration and system status</p>
      </div>

      {/* System Status */}
      <div className="card mb-4">
        <h2 className="font-display font-semibold text-sm flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
          <Server className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          System Status
        </h2>
        {loading ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Checking system...</p>
        ) : ollamaStatus === 'disconnected' ? (
          <div
            className="flex items-center gap-3 p-4 rounded-2xl"
            style={{ background: 'rgba(242,139,130,0.08)', border: '1px solid rgba(242,139,130,0.2)' }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#f28b82' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: '#f28b82' }}>Ollama not connected</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Make sure Ollama is installed and running: <code className="px-1 rounded" style={{ background: 'rgba(255,255,255,0.1)' }}>ollama serve</code>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: 'rgba(129,201,149,0.08)', border: '1px solid rgba(129,201,149,0.2)' }}
            >
              <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#81c995' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: '#81c995' }}>Ollama connected</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Local AI inference is ready</p>
              </div>
            </div>
            {systemInfo && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Default Model', value: systemInfo.default_model },
                  { label: 'Embedding Model', value: systemInfo.embedding_model },
                  { label: 'Chunk Size', value: `${systemInfo.chunk_size} chars` },
                  { label: 'Max File Size', value: `${systemInfo.max_file_size / 1024 / 1024} MB` },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl p-3"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)' }}
                  >
                    <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
                    <div className="text-sm font-medium font-mono" style={{ color: 'var(--text-primary)' }}>{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Model Tiers */}
      <div className="card mb-4">
        <h2 className="font-display font-semibold text-sm flex items-center gap-2 mb-1" style={{ color: 'var(--text-primary)' }}>
          <Cpu className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          Recommended Models by Hardware
        </h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
          DocuMind works on any hardware. All models run locally via Ollama — no API key required.
        </p>
        <div className="space-y-2">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="flex items-center gap-4 p-3 rounded-2xl transition-all duration-150"
              style={{
                background: tier.recommended ? 'rgba(138,180,248,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${tier.recommended ? 'rgba(138,180,248,0.2)' : 'var(--surface-border)'}`,
              }}
            >
              <div className="w-24 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tier.color }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{tier.name}</span>
                  {tier.recommended && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full ml-1" style={{ background: 'rgba(138,180,248,0.15)', color: '#8ab4f8', fontSize: '10px' }}>
                      Best
                    </span>
                  )}
                </div>
              </div>
              <code
                className="text-xs px-2 py-1 rounded-lg flex-shrink-0"
                style={{ background: 'rgba(0,0,0,0.3)', color: tier.color, fontFamily: 'monospace' }}
              >
                {tier.model}
              </code>
              <div className="flex-shrink-0 w-20">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{tier.ram}</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{tier.desc}</span>
              </div>
              <code
                className="text-xs px-2.5 py-1 rounded-lg flex-shrink-0 font-mono"
                style={{ background: 'rgba(0,0,0,0.4)', color: '#81c995' }}
              >
                ollama pull {tier.model}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* Installed Models */}
      <div className="card">
        <h2 className="font-display font-semibold text-sm flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
          <Zap className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          Installed Models
        </h2>
        {models.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No models installed. Use the commands above to install one.
          </p>
        ) : (
          <div className="space-y-2">
            {models.map((model, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--surface-border)' }}
              >
                <div>
                  <code className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{model.name}</code>
                  {model.details?.parameter_size && (
                    <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                      {model.details.parameter_size}
                    </span>
                  )}
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(129,201,149,0.1)', color: '#81c995', border: '1px solid rgba(129,201,149,0.2)' }}
                >
                  Available
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings
