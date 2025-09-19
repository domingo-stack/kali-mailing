// app/page.tsx
'use client'

import AuthGuard from '@/components/AuthGuard'
import { useAuth } from '@/context/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AuthGuard>
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold mb-4 text-text">
          Bienvenido a Kali Mailing
        </h1>
        <p className="text-gray-600">
          Hola, {user ? user.email : 'invitado'}. ¡Estamos listos para empezar a construir!
        </p>
      </main>
    </AuthGuard>
  );
}