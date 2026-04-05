import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const ADMIN_PASSWORD = 'rifa2024admin'

// ─── Login ────────────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (pwd === ADMIN_PASSWORD) {
      onLogin()
    } else {
      setError('Contraseña incorrecta. Intenta de nuevo.')
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <div className="admin-login-icon">🔐</div>
        <h2>Panel de Administración</h2>
        <p>Ingresa la contraseña para acceder al dashboard.</p>

        {error && <div className="admin-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label" htmlFor="admin-password">
              🔑 Contraseña
            </label>
            <input
              id="admin-password"
              className="form-input"
              type="password"
              value={pwd}
              onChange={e => { setPwd(e.target.value); setError('') }}
              placeholder="Contraseña de administrador"
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
            Ingresar →
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Dashboard principal ───────────────────────────────────────────────────────
export default function AdminDashboard({ onShowToast }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'reserved' | 'paid' | 'config'
  const [actionLoading, setActionLoading] = useState(null)
  
  // Estado para configuraciones de la rifa
  const [settings, setSettings] = useState({
    description: '',
    prize: '',
    lottery: '',
    draw_date: ''
  })
  const [savingSettings, setSavingSettings] = useState(false)

  const fetchTickets = useCallback(async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .neq('status', 'available')
      .order('reserved_at', { ascending: false })
    if (!error && data) setTickets(data)
    setLoading(false)
  }, [])

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('raffle_settings')
      .select('*')
      .eq('id', 1)
      .single()
    if (!error && data) setSettings(data)
  }, [])

  useEffect(() => {
    if (!authenticated) return
    fetchTickets()
    fetchSettings()

    const channel = supabase
      .channel('admin-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, fetchTickets)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [authenticated, fetchTickets, fetchSettings])

  if (!authenticated) return <AdminLogin onLogin={() => setAuthenticated(true)} />

  // Filtros de tickets
  const filtered = tickets.filter(t => {
    if (activeTab === 'config') return false
    const matchTab =
      activeTab === 'all' ? true
      : activeTab === 'reserved' ? t.status === 'reserved'
      : t.status === 'paid'

    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      String(t.id).padStart(2, '0').includes(q) ||
      t.name?.toLowerCase().includes(q) ||
      t.phone?.includes(q) ||
      t.address?.toLowerCase().includes(q)

    return matchTab && matchSearch
  })

  const reservedCount = tickets.filter(t => t.status === 'reserved').length
  const paidCount     = tickets.filter(t => t.status === 'paid').length

  // ─── Acciones ──────────────────────────────────────────────────────────────
  const markAsPaid = async (ticket) => {
    setActionLoading(ticket.id)
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'paid' })
      .eq('id', ticket.id)
    setActionLoading(null)
    if (!error) {
      fetchTickets()
      onShowToast(`Número ${String(ticket.id).padStart(2, '0')} marcado como pagado ✅`, 'success')
    } else {
      onShowToast('Error al actualizar. Intenta de nuevo.', 'error')
    }
  }

  const releaseTicket = async (ticket) => {
    if (!window.confirm(`¿Deseas liberar el número ${String(ticket.id).padStart(2, '0')} de ${ticket.name}? Quedará disponible nuevamente.`)) return
    setActionLoading(ticket.id)
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'available', name: null, phone: null, address: null, reserved_at: null })
      .eq('id', ticket.id)
    setActionLoading(null)
    if (!error) {
      fetchTickets()
      onShowToast(`Número ${String(ticket.id).padStart(2, '0')} liberado y disponible 🔓`, 'success')
    } else {
      onShowToast('Error al liberar. Intenta de nuevo.', 'error')
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setSavingSettings(true)
    const { error } = await supabase
      .from('raffle_settings')
      .update(settings)
      .eq('id', 1)
    
    setSavingSettings(false)
    if (!error) {
      onShowToast('Configuración actualizada correctamente ✨', 'success')
    } else {
      onShowToast('Error al guardar configuración.', 'error')
    }
  }

  const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="dashboard-layout">
      {/* Encabezado */}
      <div className="dashboard-header">
        <h1>📋 Panel de Administración</h1>
        <p>Gestiona los números apartados, confirma pagos y personaliza los detalles de tu rifa.</p>
      </div>

      {/* Estadísticas (Solo si no estamos en config) */}
      {activeTab !== 'config' && (
        <div className="dashboard-stats">
          <div className="dashboard-stat total-stat">
            <div className="ds-number">{tickets.length}</div>
            <div className="ds-label">Total Registros</div>
          </div>
          <div className="dashboard-stat reserved-stat">
            <div className="ds-number">{reservedCount}</div>
            <div className="ds-label">🔴 Apartados (sin pagar)</div>
          </div>
          <div className="dashboard-stat paid-stat">
            <div className="ds-number">{paidCount}</div>
            <div className="ds-label">🟢 Confirmados (pagados)</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <span className="tab-dot tab-dot-all" /> Todos ({tickets.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'reserved' ? 'active' : ''}`}
          onClick={() => setActiveTab('reserved')}
        >
          <span className="tab-dot tab-dot-red" /> Apartados ({reservedCount})
        </button>
        <button
          className={`tab-btn ${activeTab === 'paid' ? 'active' : ''}`}
          onClick={() => setActiveTab('paid')}
        >
          <span className="tab-dot tab-dot-green" /> Pagados ({paidCount})
        </button>
        <button
          className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
          id="tab-settings"
        >
           ⚙️ Configuración
        </button>
      </div>

      {activeTab === 'config' ? (
        /* VISTA DE CONFIGURACIÓN */
        <div className="table-container" style={{ padding: '32px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>Personalizar Detalles de la Rifa</h3>
          <form onSubmit={handleSaveSettings}>
            <div className="form-group">
              <label className="form-label">🏆 Premio Mayor</label>
              <input 
                className="form-input" 
                type="text" 
                value={settings.prize}
                onChange={e => setSettings({...settings, prize: e.target.value})}
                placeholder="Ej: Carro 0km, Viaje a Cancún, etc."
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">🎰 Lotería del Sorteo</label>
                <input 
                  className="form-input" 
                  type="text" 
                  value={settings.lottery}
                  onChange={e => setSettings({...settings, lottery: e.target.value})}
                  placeholder="Ej: Lotería de Medellín"
                />
              </div>
              <div className="form-group">
                <label className="form-label">📅 Fecha del Sorteo</label>
                <input 
                  className="form-input" 
                  type="text" 
                  value={settings.draw_date}
                  onChange={e => setSettings({...settings, draw_date: e.target.value})}
                  placeholder="Ej: Sábado 27 de Abril"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">📝 Descripción / Instrucciones</label>
              <textarea 
                className="form-input" 
                rows="4"
                style={{ resize: 'vertical', minHeight: '100px' }}
                value={settings.description}
                onChange={e => setSettings({...settings, description: e.target.value})}
                placeholder="Explica a tus clientes cómo participar y pagar..."
              ></textarea>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={savingSettings}
                style={{ flex: 'none', width: '240px' }}
              >
                {savingSettings ? <><div className="spinner" /> Guardando...</> : '💾 Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* TABLA DE TICKETS */
        <div className="table-container">
          {/* Buscador */}
          <div className="table-search">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                id="dashboard-search"
                className="search-input"
                type="text"
                placeholder="Buscar por número, nombre, teléfono..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="empty-icon">⏳</div>
              <p>Cargando información...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                {search ? '🔍' : activeTab === 'paid' ? '💳' : '🎟️'}
              </div>
              <p>
                {search
                  ? 'No se encontraron resultados para tu búsqueda.'
                  : activeTab === 'paid'
                  ? 'Aún no hay números marcados como pagados.'
                  : 'No hay números apartados aún.'}
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Dirección</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ticket => {
                  const num = String(ticket.id).padStart(2, '0')
                  const isLoading = actionLoading === ticket.id
                  return (
                    <tr key={ticket.id}>
                      <td>
                        <span className={`ticket-number-badge ${ticket.status === 'paid' ? 'badge-paid' : 'badge-reserved'}`}>
                          {num}
                        </span>
                      </td>
                      <td><strong>{ticket.name}</strong></td>
                      <td>{ticket.phone}</td>
                      <td>{ticket.address}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(ticket.reserved_at)}
                      </td>
                      <td>
                        <span className={`status-pill ${ticket.status === 'paid' ? 'pill-paid' : 'pill-reserved'}`}>
                          {ticket.status === 'paid' ? '🟢 Pagado' : '🔴 Apartado'}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          {ticket.status === 'reserved' && (
                            <button
                              className="btn btn-success"
                              onClick={() => markAsPaid(ticket)}
                              disabled={isLoading}
                              id={`btn-paid-${num}`}
                              title="Marcar como pagado"
                            >
                              {isLoading ? <div className="spinner spinner-dark" /> : '✅ Pagado'}
                            </button>
                          )}
                          <button
                            className="btn btn-danger"
                            onClick={() => releaseTicket(ticket)}
                            disabled={isLoading}
                            id={`btn-release-${num}`}
                            title="Liberar número"
                          >
                            {isLoading ? <div className="spinner" style={{ borderTopColor: 'var(--color-reserved)' }} /> : '🔓 Liberar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
