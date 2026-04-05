import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../AuthContext'

export default function AdminRaffle({ onShowToast }) {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [raffle, setRaffle] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'reserved' | 'paid' | 'config'
  const [actionLoading, setActionLoading] = useState(null)
  const [savingSettings, setSavingSettings] = useState(false)

  const fetchRaffle = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('raffles')
      .select('*')
      .eq('id', id)
      .eq('creator_id', user.id)
      .single()
    
    if (error || !data) {
      onShowToast('No tienes permiso para acceder o la rifa no existe.', 'error')
      navigate('/dashboard')
      return
    }
    setRaffle(data)
  }, [id, user, navigate, onShowToast])

  const fetchTickets = useCallback(async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('raffle_id', id)
      .neq('status', 'available')
      .order('reserved_at', { ascending: false })
    
    if (!error && data) setTickets(data)
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchRaffle()
    fetchTickets()

    const channel = supabase
      .channel(`admin-tickets-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `raffle_id=eq.${id}` }, fetchTickets)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchRaffle, fetchTickets, id])

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setSavingSettings(true)
    const { error } = await supabase
      .from('raffles')
      .update({
        name: raffle.name,
        prize: raffle.prize,
        description: raffle.description,
        lottery: raffle.lottery,
        draw_date: raffle.draw_date
      })
      .eq('id', id)
    
    setSavingSettings(false)
    if (!error) {
      onShowToast('Configuración actualizada correctamente ✨', 'success')
    } else {
      onShowToast(error.message, 'error')
    }
  }

  const markAsPaid = async (ticket) => {
    setActionLoading(ticket.id)
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'paid' })
      .eq('id', ticket.id)
      .eq('raffle_id', id)
    
    setActionLoading(null)
    if (!error) {
      onShowToast(`Número marcado como pagado ✅`, 'success')
      fetchTickets()
    }
  }

  const releaseTicket = async (ticket) => {
    if (!window.confirm(`¿Liberar número ${ticket.id}?`)) return
    setActionLoading(ticket.id)
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'available', name: null, phone: null, address: null, reserved_at: null })
      .eq('id', ticket.id)
      .eq('raffle_id', id)
    
    setActionLoading(null)
    if (!error) {
      onShowToast(`Número liberado 🔓`, 'success')
      fetchTickets()
    }
  }

  if (!raffle) return <div className="empty-state">⏳ Cargando...</div>

  const filtered = tickets.filter(t => {
    if (activeTab === 'config') return false
    const matchTab = activeTab === 'all' ? true : activeTab === 'reserved' ? t.status === 'reserved' : t.status === 'paid'
    const q = search.toLowerCase()
    return matchTab && (!q || String(t.id).includes(q) || t.name?.toLowerCase().includes(q))
  })

  return (
    <div className="dashboard-layout">
      {/* Header Admin de Rifa */}
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <Link to="/dashboard" style={{ fontSize: '0.9rem', color: 'var(--color-blue)', marginBottom: '8px', display: 'block' }}>← Volver a mis rifas</Link>
          <h1>⚙️ {raffle.name}</h1>
          <p>Gestiona los premios y participantes de este sorteo.</p>
        </div>
        <Link to={`/rifa/${id}`} target="_blank" className="btn btn-ghost" style={{ flex: 'none' }}>👁️ Ver Vista de Cliente</Link>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>Todo</button>
        <button className={`tab-btn ${activeTab === 'reserved' ? 'active' : ''}`} onClick={() => setActiveTab('reserved')}>🔴 Apartados</button>
        <button className={`tab-btn ${activeTab === 'paid' ? 'active' : ''}`} onClick={() => setActiveTab('paid')}>🟢 Pagados</button>
        <button className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>⚙️ Configuración</button>
      </div>

      {activeTab === 'config' ? (
        <div className="table-container" style={{ padding: '32px' }}>
          <h3>Personalizar detalles de la rifa</h3>
          <form onSubmit={handleSaveSettings}>
            <div className="form-group">
              <label className="form-label">Nombre de la Rifa</label>
              <input className="form-input" type="text" value={raffle.name} onChange={e => setRaffle({...raffle, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Premio Mayor</label>
              <input className="form-input" type="text" value={raffle.prize} onChange={e => setRaffle({...raffle, prize: e.target.value})} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Lotería</label>
                <input className="form-input" type="text" value={raffle.lottery} onChange={e => setRaffle({...raffle, lottery: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha del sorteo</label>
                <input className="form-input" type="text" value={raffle.draw_date} onChange={e => setRaffle({...raffle, draw_date: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea className="form-input" rows="3" value={raffle.description} onChange={e => setRaffle({...raffle, description: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingSettings} style={{ marginTop: '20px' }}>{savingSettings ? <div className="spinner" /> : 'Guardar Cambios'}</button>
          </form>
        </div>
      ) : (
        <div className="table-container">
           {/* Buscador */}
           <div className="table-search">
            <input className="search-input" type="text" placeholder="Buscar participante..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {/* Tabla de participantes */}
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Participante</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ticket => (
                  <tr key={ticket.id}>
                    <td><span className={`ticket-number-badge ${ticket.status === 'paid' ? 'badge-paid' : 'badge-reserved'}`}>{String(ticket.id).padStart(2, '0')}</span></td>
                    <td>{ticket.name}</td>
                    <td>{ticket.phone}</td>
                    <td><span className={`status-pill ${ticket.status === 'paid' ? 'pill-paid' : 'pill-reserved'}`}>{ticket.status === 'paid' ? '🟢 Pagado' : '🔴 Apartado'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {ticket.status === 'reserved' && (
                          <button className="btn btn-success" onClick={() => markAsPaid(ticket)} disabled={actionLoading === ticket.id}>✅</button>
                        )}
                        <button className="btn btn-danger" onClick={() => releaseTicket(ticket)} disabled={actionLoading === ticket.id}>🔓</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
