'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const { supabase } = useAuth();
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('¡Registro exitoso! Por favor, revisa tu email para confirmar tu cuenta.')
    }
    setLoading(false)
  }

  return (
    // 👇 CAMBIO 1: Fondo de la página
    <div 
      className="min-h-screen flex items-center justify-center" 
      style={{ backgroundColor: '#F8F8F8' }}
    >
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        {/* 👇 CAMBIO 2: Título */}
        <h2 
          className="text-2xl font-bold text-center mb-6"
          style={{ color: '#383838' }}
        >
          Crear una Cuenta
        </h2>
        
        {message ? (
          // 👇 CAMBIO 3: Mensaje de éxito (usamos el azul secundario)
          <p className="text-center" style={{ color: '#3c527a' }}>{message}</p>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              {/* 👇 CAMBIO 4: Etiquetas */}
              <label
                htmlFor="email"
                className="block text-sm font-medium"
                style={{ color: '#383838' }}
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
  
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium"
                style={{ color: '#383838' }}
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
  
            {/* 👇 CAMBIO 5: Mensaje de error (usamos el naranja primario) */}
            {error && <p className="text-sm" style={{ color: '#ff8080' }}>{error}</p>}
  
            <div>
              {/* 👇 CAMBIO 6: Botón principal */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors"
                style={{
                  backgroundColor: loading ? '#FCA5A5' : '#ff8080',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Registrando...' : 'Registrarse'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}