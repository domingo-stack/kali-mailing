// components/Sidebar.tsx
'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { ArrowLeftEndOnRectangleIcon, ChartBarIcon, UserGroupIcon, HomeIcon } from '@heroicons/react/24/outline'
import { BeakerIcon } from '@heroicons/react/24/outline'

export default function Sidebar() {
  const { user, supabase } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) {
    return null
  }

  return (
    // Aplicamos el azul oscuro de tu paleta directamente
    <aside className="flex flex-col w-64 h-screen px-4 py-8 bg-[#3c527a] text-white shadow-lg">
      <Link href="/" className="text-3xl font-extrabold text-[#ff8080] mb-10 flex items-center justify-center">
        K<span className="text-white">ali</span> M<span className="text-white">ailing</span>
      </Link>
      
      {/* Enlaces de Navegación */}
      <nav className="flex-grow space-y-2">
        <Link href="/" className="flex items-center px-4 py-2 mt-5 text-gray-200 hover:bg-[#ff8080] hover:text-white rounded-lg transition-colors duration-200">
          <HomeIcon className="w-6 h-6 mr-3" />
          Dashboard
        </Link>
        <Link href="/contacts" className="flex items-center px-4 py-2 text-gray-200 hover:bg-[#ff8080] hover:text-white rounded-lg transition-colors duration-200">
          <UserGroupIcon className="w-6 h-6 mr-3" />
          Contactos
        </Link>
        <Link href="/segments" className="flex items-center px-4 py-2 text-gray-200 hover:bg-[#ff8080] hover:text-white rounded-lg transition-colors duration-200">
  <BeakerIcon className="w-6 h-6 mr-3" />
  Segmentos
</Link>
        <Link href="/campaigns" className="flex items-center px-4 py-2 text-gray-200 hover:bg-[#ff8080] hover:text-white rounded-lg transition-colors duration-200">
          <ChartBarIcon className="w-6 h-6 mr-3" />
          Campañas
        </Link>
      </nav>

      {/* Sección del Usuario y Logout */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <div className="text-sm mb-4 text-gray-300">
          <p className="font-semibold truncate">{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-200 hover:bg-[#ff8080] hover:text-white rounded-lg transition-colors duration-200"
        >
          <ArrowLeftEndOnRectangleIcon className="w-6 h-6 mr-3" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}