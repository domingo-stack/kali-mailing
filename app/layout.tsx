// app/layout.tsx

import './globals.css'
import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar' // <-- CAMBIAMOS NAVBAR POR SIDEBAR

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '700']
})

export const metadata: Metadata = {
  title: 'Kali Mailing',
  description: 'Herramienta interna de Email Marketing.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${nunito.className} bg-gray-100`}>
        <AuthProvider>
          <div className="flex">
            {/* La barra lateral ahora es parte de la estructura principal */}
            <Sidebar />
            {/* El contenido principal ocupa el resto del espacio y tiene su propio scroll */}
            <main className="flex-1 p-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}