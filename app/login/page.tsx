'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const { supabase } = useAuth();
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      // Si el login es exitoso, redirigimos a la página principal
      router.push('/')
    }
    setLoading(false)
  }

  return (
    // 👇 CAMBIO 1: Fondo de la página usa el color de la marca
    <div 
      className="min-h-screen flex items-center justify-center" 
      style={{ backgroundColor: '#F8F8F8' }}
    >
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        {/* 👇 CAMBIO 2: Título usa el color de texto de la marca */}
        <h2 
          className="text-2xl font-bold text-center mb-6"
          style={{ color: '#383838' }}
        >
          Iniciar Sesión
        </h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            {/* 👇 CAMBIO 3: Etiquetas usan el color de texto de la marca */}
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
  
          {/* 👇 CAMBIO 4: Mensaje de error usa el color primario */}
          {error && <p className="text-sm" style={{ color: '#ff8080' }}>{error}</p>}
  
          <div>
            {/* 👇 CAMBIO 5: Botón principal usa el color primario */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors"
              style={{
                backgroundColor: loading ? '#FCA5A5' : '#ff8080',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}