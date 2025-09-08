'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  // Asumimos que tu hook useAuth también provee un estado de 'isLoading'
  const { user, isLoading } = useAuth() 
  const router = useRouter()

  useEffect(() => {
    // Si la carga ha terminado y NO hay usuario, redirige al login.
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [isLoading, user, router])

  // Mientras se verifica la sesión, muestra un mensaje de carga.
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-gray-500">Verificando sesión...</p>
      </div>
    );
  }

  // Si la carga terminó y SÍ hay un usuario, muestra el contenido protegido.
  if (user) {
    return <>{children}</>
  }

  // Si no está cargando y no hay usuario, no renderiza nada mientras redirige.
  return null;
}