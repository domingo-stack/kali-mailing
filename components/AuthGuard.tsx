'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Cuando el AuthProvider termina de cargar, 'session' será 'null' (si no hay sesión) o un objeto de sesión.
    // Si es 'null', significa que no hay usuario, por lo que redirigimos.
    if (session === null) {
      router.push('/login')
    }
  }, [user, session, router])

  // Solo si hay un usuario y una sesión, mostramos el contenido.
  if (user && session) {
    return <>{children}</>
  }

  // Mientras tanto, mostramos un mensaje de carga para evitar parpadeos.
  return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-lg text-gray-500">Verificando sesión...</p>
    </div>
  );
}