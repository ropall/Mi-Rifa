import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../AuthContext'

export default function Dashboard({ onShowToast }) {
  const [raffles, setRaffles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newRaffle, setNewRaffle] = useState({
    name: '',
    prize: '',
    description: '',
    lottery: '',
    draw_date: '',
    ticket_count: 100
  })
  const [creating, setCreating] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const fetchRaffles = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('raffles')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
    
    if (!error && data) setRaffles(data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchRaffles()
  }, [fetchRaffles])

  const handleCreateRaffle = async (e) => {
    e.preventDefault()
    if (!newRaffle.name || !newRaffle.prize) {
      onShowToast('Nombre y Premio son obligatorios.', 'error')
      return
    }

    setCreating(true)
    const { data, error } = await supabase
      .from('raffles')
      .insert([{ ...newRaffle, creator_id: user.id }])
      .select()
      .single()

    setCreating(false)
    if (error) {
      onShowToast(error.message, 'error')
    } else {
      onShowToast('¡Rifa creada con éxito! 🎟️', 'success')
      setShowModal(false)
      fetchRaffles()
      setNewRaffle({ name: '', prize: '', description: '', lottery: '', draw_date: '', ticket_count: 100 })
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="dashboard-layout">
      {/* Header del Dashboard */}
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1>👋 ¡Hola de nuevo!</h1>
          <p>Desde aquí puedes gestionar todas tus rifas activas.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            ➕ Crear Nueva Rifa
          </button>
          <button className="btn btn-ghost" onClick={handleLogout} title="Cerrar sesión">
            🚪 Salir
          </button>
        </div>
      </div>

      {/* Estadísticas Rápidas de tu Cuenta */}
      <div className="dashboard-stats" style={{ marginBottom: '40px' }}>
        <div className="dashboard-stat total-stat">
          <div className="ds-number">{raffles.length}</div>
          <div className="ds-label">Mis Rifas</div>
        </div>
        <div className="dashboard-stat paid-stat">
          <div className="ds-number">100%</div>
          <div className="ds-label">Seguridad Supabase</div>
        </div>
        <div className="dashboard-stat reserved-stat">
          <div className="ds-number">🚀</div>
          <div className="ds-label">¡Listo para vender!</div>
        </div>
      </div>

      {/* Listado de Rifas */}
      <h2 style={{ marginBottom: '20px', fontSize: '1.4rem' }}>Tus Rifas</h2>
      
      {loading ? (
        <div className="empty-state">
          <div className="spinner spinner-dark" style={{ width: '40px', height: '40px' }} />
          <p style={{ marginTop: '20px' }}>Cargando tus rifas...</p>
        </div>
      ) : raffles.length === 0 ? (
        <div className="empty-state" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '2px dashed var(--color-border)' }}>
          <div className="empty-icon">🎟️</div>
          <h3>Aún no tienes rifas</h3>
          <p>Crea tu primera rifa para empezar a vender números.</p>
          <button className="btn btn-primary" style={{ marginTop: '20px', flex: 'none' }} onClick={() => setShowModal(true)}>
            Crear mi primera rifa
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {raffles.map(raffle => (
            <div key={raffle.id} className="stat-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden', borderLeft: 'none', borderTop: '4px solid var(--color-blue)' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{raffle.name}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                Premio: <strong>{raffle.prize}</strong>
              </p>
              
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
                   <span>📅 {raffle.draw_date || 'Sin fecha'}</span>
                </div>
                <div>🎰 {raffle.lottery || 'Por definir'}</div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Link to={`/admin/${raffle.id}`} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                   ⚙️ Gestionar
                </Link>
                <Link to={`/rifa/${raffle.id}`} target="_blank" className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
                   👁️ Ver Pública
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Nueva Rifa */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-card" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div className="modal-ticket-badge">✨ Configuración</div>
              <h2>Crear Nueva Rifa</h2>
              <p>Define los parámetros de tu sorteo.</p>
            </div>
            <form onSubmit={handleCreateRaffle} className="modal-body">
              <div className="form-group">
                <label className="form-label">🏷️ Nombre de la Rifa</label>
                <input 
                  className="form-input" required
                  value={newRaffle.name}
                  onChange={e => setNewRaffle({...newRaffle, name: e.target.value})}
                  placeholder="Ej: Rifa Pro-Fondos Viaje"
                />
              </div>
              <div className="form-group">
                <label className="form-label">🏆 Premio Mayor</label>
                <input 
                  className="form-input" required
                  value={newRaffle.prize}
                  onChange={e => setNewRaffle({...newRaffle, prize: e.target.value})}
                  placeholder="Ej: Televisor 55 o Carro"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">🎰 Lotería</label>
                  <input 
                    className="form-input"
                    value={newRaffle.lottery}
                    onChange={e => setNewRaffle({...newRaffle, lottery: e.target.value})}
                    placeholder="Ej: Medellín"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">📅 Fecha</label>
                  <input 
                    className="form-input"
                    value={newRaffle.draw_date}
                    onChange={e => setNewRaffle({...newRaffle, draw_date: e.target.value})}
                    placeholder="Ej: 20 de Junio"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">📝 Descripción corta</label>
                <textarea 
                  className="form-input" rows="3"
                  value={newRaffle.description}
                  onChange={e => setNewRaffle({...newRaffle, description: e.target.value})}
                  placeholder="Instrucciones breves..."
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <div className="spinner" /> : '🚀 Crear Rifa y Generar 100 Números'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
