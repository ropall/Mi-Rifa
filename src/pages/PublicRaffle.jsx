import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import RaffleGrid from '../components/RaffleGrid'
import ReservationModal from '../components/ReservationModal'

export default function PublicRaffle({ onShowToast }) {
  const { id } = useParams()
  const [raffle, setRaffle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState(null)

  const fetchRaffle = useCallback(async () => {
    const { data, error } = await supabase
      .from('raffles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (!error && data) setRaffle(data)
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchRaffle()
  }, [fetchRaffle])

  if (loading) return <div className="empty-state">⏳ Cargando rifa...</div>
  if (!raffle) return <div className="empty-state">❌ Rifa no encontrada.</div>

  return (
    <div className="app-layout">
      <header className="hero">
        <div className="hero-inner">
          <div className="hero-badge">✨ {raffle.prize}</div>
          <h1>{raffle.name}</h1>
          <p style={{ marginBottom: '16px' }}>{raffle.description}</p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '32px', fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 600, flexWrap: 'wrap' }}>
            <span>📅 Sorteo: {raffle.draw_date || 'Por definir'}</span>
            <span>🎰 Lotería: {raffle.lottery || 'Por definir'}</span>
          </div>

          <div className="legend">
            <div className="legend-item">
              <div className="legend-dot legend-dot-available" />
              <span>Disponible (Gris)</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot legend-dot-reserved" />
              <span>Apartado (Rojo)</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot legend-dot-paid" />
              <span>Pagado (Verde)</span>
            </div>
          </div>
        </div>
      </header>

      <main className="grid-section">
        <RaffleGrid 
          raffleId={id} 
          onTicketSelect={(ticket) => setSelectedTicket(ticket)} 
        />
      </main>

      {selectedTicket && (
        <ReservationModal 
          ticket={selectedTicket} 
          raffleId={id}
          onClose={() => setSelectedTicket(null)} 
          onSuccess={(msg) => onShowToast(msg, 'success')}
        />
      )}
    </div>
  )
}
