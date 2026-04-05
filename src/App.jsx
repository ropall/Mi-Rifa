import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'

// Páginas
import PublicHome from './pages/PublicHome'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import PublicRaffle from './pages/PublicRaffle'
import AdminRaffle from './pages/AdminRaffle'

// Componente para proteger rutas privadas
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="empty-state">⏳ Cargando sesión...</div>
  return user ? children : <Navigate to="/login" />
}

function AppContent() {
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  return (
    <>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<PublicHome />} />
        <Route path="/login" element={<Login onShowToast={showToast} />} />
        <Route path="/signup" element={<Signup onShowToast={showToast} />} />
        <Route path="/rifa/:id" element={<PublicRaffle onShowToast={showToast} />} />

        {/* Rutas Privadas (Dashboard y Admin) */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard onShowToast={showToast} />
          </PrivateRoute>
        } />
        <Route path="/admin/:id" element={
          <PrivateRoute>
            <AdminRaffle onShowToast={showToast} />
          </PrivateRoute>
        } />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Notificaciones (Toast) global */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
