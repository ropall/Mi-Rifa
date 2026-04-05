import React from 'react'
import { Link } from 'react-router-dom'

export default function PublicHome() {
  return (
    <div className="app-layout">
      <header className="hero" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        <div className="hero-inner">
          <div className="hero-badge">🚀 Plataforma Multi-Rifas</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)' }}>Crea y gestiona tus propias <span className="highlight">rifas millonarias</span></h1>
          <p style={{ fontSize: '1.25rem', marginTop: '20px', maxWidth: '600px', marginInline: 'auto' }}>
            La herramienta definitiva para organizar tus sorteos de forma profesional, 
            controlada y 100% responsiva para tus clientes.
          </p>
          
          <div style={{ marginTop: '48px', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '1.1rem' }}>
              🎯 Empezar Gratis
            </Link>
            <Link to="/login" className="btn btn-ghost" style={{ padding: '16px 40px', fontSize: '1.1rem' }}>
              🔑 Iniciar Sesión
            </Link>
          </div>

          <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'center', gap: '40px', opacity: 0.6, fontSize: '0.9rem', fontWeight: 700 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✅ 100% Seguro</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📱 Multi-dispositivo</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>⚡️ Tiempo Real</div>
          </div>
        </div>
      </header>
    </div>
  )
}
