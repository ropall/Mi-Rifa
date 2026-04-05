import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ReservationModal({ ticket, raffleId, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const num = String(ticket.id).padStart(2, '0')

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError('Por favor completa todos los campos.')
      return
    }

    setLoading(true)
    const { error: dbError } = await supabase
      .from('tickets')
      .update({
        status: 'reserved',
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        reserved_at: new Date().toISOString(),
      })
      .eq('id', ticket.id)
      .eq('raffle_id', raffleId)

    setLoading(false)

    if (dbError) {
      setError(dbError.message)
    } else {
      onSuccess(`¡El número ${num} fue apartado exitosamente! 🎉`)
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-ticket-badge">🎟️ Número seleccionado</div>
          <h2>Apartar el número <strong>{num}</strong></h2>
          <p>Completa tus datos para reservar este número.</p>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="admin-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">👤 Nombre completo</label>
            <input className="form-input" type="text" name="name" value={form.name} onChange={handleChange} placeholder="Ej: María García" autoFocus />
          </div>

          <div className="form-group">
            <label className="form-label">📱 Teléfono</label>
            <input className="form-input" type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="Ej: 300 123 4567" />
          </div>

          <div className="form-group">
            <label className="form-label">📍 Dirección</label>
            <input className="form-input" type="text" name="address" value={form.address} onChange={handleChange} placeholder="Ej: Cl. 12 #34-56" />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
               {loading ? <div className="spinner" /> : `Apartar número ${num}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
