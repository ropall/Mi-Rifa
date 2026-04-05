import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Login({ onShowToast }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await login(email, password)
    setLoading(false)
    if (error) {
      onShowToast(error.message, 'error')
    } else {
      onShowToast('¡Bienvenido de nuevo! 👋', 'success')
      navigate('/dashboard')
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <div className="admin-login-icon">🔐</div>
        <h2>Iniciar Sesión</h2>
        <p>Accede a tu panel para gestionar tus rifas.</p>

        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label" htmlFor="login-email">📧 Correo electrónico</label>
            <input
              id="login-email"
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
            <label className="form-label" htmlFor="login-password">🔑 Contraseña</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? <div className="spinner" /> : 'Ingresar →'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          ¿No tienes cuenta? <Link to="/signup" style={{ color: 'var(--color-blue)', fontWeight: 700 }}>Regístrate aquí</Link>
        </p>
      </div>
    </div>
  )
}
