import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Scenvy Global Error Boundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0D0D14',
          color: '#fff',
          fontFamily: "'Inter', sans-serif",
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✨</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Etwas ist unerwartet gelaufen</h2>
          <p style={{ color: '#94A3B8', fontSize: 14, maxWidth: 460, marginBottom: 24, lineHeight: 1.6 }}>
            Ein Anzeigefehler ist aufgetreten. Ihre Daten sind sicher. Bitte laden Sie die Ansicht neu.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #FF2D8D 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '12px 28px',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)'
            }}
          >
            🔄 Ansicht neu laden
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
