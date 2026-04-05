import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

function TicketCard({ ticket, onClick }) {
  const statusClass =
    ticket.status === 'available' ? 'ticket-available'
    : ticket.status === 'reserved' ? 'ticket-reserved'
    : 'ticket-paid'

  const icon =
    ticket.status === 'available' ? null
    : ticket.status === 'reserved' ? <span className="ticket-icon">🔴</span>
    : <span className="ticket-icon">🟢</span>

  const num = String(ticket.id).padStart(2, '0')

  return (
    <button
      id={`ticket-${num}`}
      className={`ticket-card ${statusClass}`}
      onClick={() => ticket.status === 'available' && onClick(ticket)}
      disabled={ticket.status !== 'available'}
      title={
        ticket.status === 'available'
          ? `Número ${num} — Disponible. ¡Haz clic para apartarlo!`
          : ticket.status === 'reserved'
          ? `Número ${num} — Apartado por ${ticket.name}`
          : `Número ${num} — Pagado por ${ticket.name}`
      }
      aria-label={`Número ${num}`}
    >
      <span className="ticket-num">{num}</span>
      {icon}
    </button>
  )
}

export default function RaffleGrid({ raffleId, onTicketSelect, refreshTrigger }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTickets = useCallback(async () => {
    if (!raffleId) return
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('raffle_id', raffleId)
      .order('id', { ascending: true })

    if (!error && data) {
      setTickets(data)
    }
    setLoading(false)
  }, [raffleId])

  useEffect(() => {
    fetchTickets()

    const channel = supabase
      .channel(`tickets-changes-${raffleId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `raffle_id=eq.${raffleId}` }, () => {
        fetchTickets()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchTickets, raffleId, refreshTrigger])

  const available = tickets.filter(t => t.status === 'available').length
  const reserved  = tickets.filter(t => t.status === 'reserved').length
  const paid      = tickets.filter(t => t.status === 'paid').length

  return (
    <div className="grid-section">
      <div className="grid-stats">
        <div className="stat-card available">
          <span className="stat-label">Disponibles</span>
          <span className="stat-value">{loading ? '–' : available}</span>
        </div>
        <div className="stat-card reserved">
          <span className="stat-label">Apartados</span>
          <span className="stat-value">{loading ? '–' : reserved}</span>
        </div>
        <div className="stat-card paid">
          <span className="stat-label">Pagados</span>
          <span className="stat-value">{loading ? '–' : paid}</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-grid">
           {Array.from({ length: 24 }).map((_, i) => <div key={i} className="skeleton" />)}
        </div>
      ) : (
        <div className="tickets-grid">
          {tickets.map(ticket => (
            <TicketCard
              key={`${ticket.id}-${raffleId}`}
              ticket={ticket}
              onClick={onTicketSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}
