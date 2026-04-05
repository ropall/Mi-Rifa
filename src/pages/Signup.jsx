import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Signup({ onShowToast }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signup(email, password)
    setLoading(false)
    if (error) {
      onShowToast(error.message, 'error')
    } else {
      onShowToast('¡Cuenta creada correctamente! ✨', 'success')
      navigate('/dashboard')
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <div className="admin-login-icon">✨</div>
        <h2>Crea tu cuenta</h2>
        <p>Empieza a crear y gestionar tus propias rifas hoy mismo.</p>

        <form onSubmit={handleSignup}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label" htmlFor="signup-email">📧 Correo electrónico</label>
            <input
              id="signup-email"
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoFocus
            />
          </div>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label" htmlFor="signup-password">🔑 Contraseña</label>
            <input
              id="signup-password"
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 caracteres"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? <div className="spinner" /> : 'Registrarse ✨'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--color-blue)', fontWeight: 700 }}>Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  )
}
