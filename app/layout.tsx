// app/layout.tsx

import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext' // <-- 1. IMPORTA EL PROVIDER
import Navbar from '@/components/Navbar' // Asumiendo que el Navbar está aquí

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gestor de Tareas',
  description: 'Una aplicación para gestionar tus proyectos y tareas.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider> {/* <-- 2. ENVUELVE TODO CON EL PROVIDER */}
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}