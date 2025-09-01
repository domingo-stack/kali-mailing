'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (session === null) {
      router.push('/login')
    }
  }, [user, session, router])

  if (user && session) {
    return <>{children}</>
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-lg text-gray-500">Verificando sesión...</p>
    </div>
  );
}