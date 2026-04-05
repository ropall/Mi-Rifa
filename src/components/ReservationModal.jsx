import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ReservationModal({ ticket, onClose, onSuccess }) {
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

    setLoading(false)

    if (dbError) {
      setError('Ocurrió un error. Intenta de nuevo.')
    } else {
      onSuccess(`¡El número ${num} fue apartado exitosamente! 🎉`)
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">

        {/* Encabezado */}
        <div className="modal-header">
          <div className="modal-ticket-badge">
            🎟️ Número seleccionado
          </div>
          <h2 id="modal-title">Apartar el número <strong>{num}</strong></h2>
          <p>Completa tus datos para reservar este número de la rifa.</p>
        </div>

        {/* Cuerpo / Formulario */}
        <div className="modal-body">
          {error && (
            <div className="admin-error" role="alert">{error}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="modal-name">
                👤 Nombre completo
              </label>
              <input
                id="modal-name"
                className="form-input"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ej: María García"
                autoFocus
                maxLength={120}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="modal-phone">
                📱 Número de teléfono
              </label>
              <input
                id="modal-phone"
                className="form-input"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Ej: 300 123 4567"
                maxLength={20}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="modal-address">
                📍 Dirección / Ciudad
              </label>
              <input
                id="modal-address"
                className="form-input"
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Ej: Cl. 12 #34-56, Medellín"
                maxLength={200}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="modal-submit-btn"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <><div className="spinner" /> Guardando...</>
                ) : (
                  <>🎟️ Apartar número {num}</>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
