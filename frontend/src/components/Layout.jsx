import { Link, useLocation } from 'react-router-dom'
import { Brain, FileText, MessageSquare, Database, Settings, Github } from 'lucide-react'

function Layout({ children }) {
  const location = useLocation()
  
  const navItems = [
    { path: '/', icon: Brain, label: 'Home' },
    { path: '/documents', icon: FileText, label: 'Documents' },
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/extract', icon: Database, label: 'Extract' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--surface-bg)' }}>
      {/* Sidebar */}
      <aside
        className="w-60 flex flex-col fixed h-full z-10"
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderRight: '1px solid var(--surface-border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Logo */}
        <div className="p-5 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #8ab4f8, #5195ee)' }}
            >
              <Brain className="w-5 h-5" style={{ color: '#0d1117' }} />
            </div>
            <div>
              <h1 className="font-display font-bold text-base leading-tight" style={{ color: 'var(--text-primary)' }}>
                DocuMind
              </h1>
              <p className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>Local AI</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--surface-border)', margin: '0 12px' }} />
        
        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 mt-2">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group"
                style={{
                  background: isActive ? 'rgba(138,180,248,0.12)' : 'transparent',
                  color: isActive ? 'var(--accent-DEFAULT, #8ab4f8)' : 'var(--text-secondary)',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? '#8ab4f8' : 'inherit' }} />
                <span className="text-sm font-medium">{item.label}</span>
                {isActive && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: '#8ab4f8' }}
                  />
                )}
              </Link>
            )
          })}
        </nav>
        
        {/* Footer */}
        <div className="p-4" style={{ borderTop: '1px solid var(--surface-border)' }}>
          <a 
            href="https://github.com/yourusername/documind" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Github className="w-3.5 h-3.5" />
            Open Source
          </a>
        </div>
      </aside>
      
      {/* Main */}
      <main className="flex-1 ml-60">
        {children}
      </main>
    </div>
  )
}

export default Layout
