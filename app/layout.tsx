// app/layout.tsx
'use client'

import './globals.css'
import { Nunito } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '700']
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.includes('/campaigns/editor')) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [pathname]);

  const showSidebar = pathname !== '/login' && pathname !== '/register';

  if (!showSidebar) {
    return (
      <html lang="es">
        <body className={`${nunito.className} bg-gray-100`}>
          <AuthProvider>{children}</AuthProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="es">
      <body className={`${nunito.className} bg-gray-100`}>
        <AuthProvider>
        <div className="flex h-screen overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} onToggle={() => setSidebarOpen(!isSidebarOpen)} />
            {/* El div 'wrapper' es el que se mueve */}
            <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
              <main className="flex-1 p-8 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}