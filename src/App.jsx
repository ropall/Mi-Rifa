import React, { useState, useEffect } from 'react'
import RaffleGrid from './components/RaffleGrid'
import ReservationModal from './components/ReservationModal'
import AdminDashboard from './components/AdminDashboard'
import { supabase } from './lib/supabaseClient'

function App() {
  const [view, setView] = useState('public') // 'public' | 'admin'
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [toast, setToast] = useState(null)
  const [settings, setSettings] = useState({
    description: 'Cargando información de la rifa...',
    prize: 'Cargando...',
    lottery: 'Cargando...',
    draw_date: 'Cargando...'
  })

  // Función para mostrar notificaciones (toasts)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Cargar configuraciones de la rifa
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('raffle_settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (!error && data) {
        setSettings(data)
      }
    }

    fetchSettings()

    // Suscripción en tiempo real para configuraciones
    const channel = supabase
      .channel('settings-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'raffle_settings' }, (payload) => {
        setSettings(payload.new)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div className="app-layout">
      {/* Barra de navegación */}
      <nav className="navbar">
        <div className="navbar-inner">
          <a href="/" className="navbar-brand" onClick={(e) => { e.preventDefault(); setView('public'); }}>
            <div className="navbar-logo">🎟️</div>
            <span className="navbar-title">Rifa<span>Suerte</span></span>
          </a>
          
          <div className="navbar-nav">
            <button 
              className={`nav-btn ${view === 'public' ? 'nav-btn-active' : 'nav-btn-ghost'}`}
              onClick={() => setView('public')}
            >
              🏠 Inicio
            </button>
            <button 
              className={`nav-btn ${view === 'admin' ? 'nav-btn-active' : 'nav-btn-ghost'}`}
              onClick={() => setView('admin')}
            >
              ⚙️ Admin
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main style={{ flex: 1 }}>
        {view === 'public' ? (
          <>
            <header className="hero">
              <div className="hero-inner">
                <div className="hero-badge">✨ {settings.prize}</div>
                <h1>Participa y <span className="highlight">gana con nosotros!</span></h1>
                <p style={{ marginBottom: '16px' }}>
                  {settings.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '32px', fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  <span>📅 Sorteo: {settings.draw_date}</span>
                  <span>🎰 Lotería: {settings.lottery}</span>
                </div>
                
                <div className="legend">
                  <div className="legend-item">
                    <div className="legend-dot legend-dot-available"></div>
                    <span>Disponible (Gris)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot legend-dot-reserved"></div>
                    <span>Apartado (Rojo)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot legend-dot-paid"></div>
                    <span>Pagado (Verde)</span>
                  </div>
                </div>
              </div>
            </header>

            <RaffleGrid onTicketSelect={(ticket) => setSelectedTicket(ticket)} />
          </>
        ) : (
          <AdminDashboard onShowToast={showToast} />
        )}
      </main>

      {/* Footer */}
      <footer style={{ padding: '40px 24px', textAlign: 'center', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
        <p>&copy; {new Date().getFullYear()} Rifa de la Suerte. Todos los derechos reservados.</p>
      </footer>

      {/* Modal de Reserva */}
      {selectedTicket && (
        <ReservationModal 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
          onSuccess={(msg) => showToast(msg, 'success')}
        />
      )}

      {/* Notificaciones (Toast) */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </div>
  )
}

export default App
