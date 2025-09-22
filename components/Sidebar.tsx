// components/Sidebar.tsx
'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { ArrowLeftOnRectangleIcon, ChartBarIcon, UserGroupIcon, HomeIcon, BeakerIcon, Bars3Icon } from '@heroicons/react/24/outline'

type Props = {
  isOpen: boolean;
  onToggle: () => void;
};

export default function Sidebar({ isOpen, onToggle }: Props) {
  const { user, supabase } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (!user) return null

  return (
    <aside className={`flex-shrink-0 bg-[#3c527a] text-white flex flex-col h-screen transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-20'}`}>
      
      {/* --- INICIO DE LA CORRECCIÓN --- */}
      <div className="flex items-center p-4 h-16 border-b border-gray-700">
        <div className="flex-1 overflow-hidden">
            <Link href="/" className={`text-xl font-bold whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            Kali Mailing
            </Link>
        </div>
        <button onClick={onToggle} className="p-2 rounded-md hover:bg-gray-700">
          <Bars3Icon className="h-6 w-6 text-white" />
        </button>
      </div>
      {/* --- FIN DE LA CORRECCIÓN --- */}

      <nav className="flex-grow p-4 space-y-2">
        <Link href="/" title="Dashboard" className="flex items-center p-2 text-gray-300 hover:bg-[#ff8080] rounded-md">
          <HomeIcon className="h-6 w-6 flex-shrink-0" />
          <span className={`ml-4 whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>Dashboard</span>
        </Link>
        <Link href="/contacts" title="Contactos" className="flex items-center p-2 text-gray-300 hover:bg-[#ff8080] rounded-md">
          <UserGroupIcon className="h-6 w-6 flex-shrink-0" />
          <span className={`ml-4 whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>Contactos</span>
        </Link>
        <Link href="/segments" title="Segmentos" className="flex items-center p-2 text-gray-300 hover:bg-[#ff8080] rounded-md">
          <BeakerIcon className="h-6 w-6 flex-shrink-0" />
          <span className={`ml-4 whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>Segmentos</span>
        </Link>
        <Link href="/campaigns" title="Campañas" className="flex items-center p-2 text-gray-300 hover:bg-[#ff8080] rounded-md">
          <ChartBarIcon className="h-6 w-6 flex-shrink-0" />
          <span className={`ml-4 whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>Campañas</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className={`text-sm mb-2 overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0 h-0'}`}>
          <p className="font-medium truncate">{user.email}</p>
        </div>
        <button onClick={handleLogout} title="Cerrar Sesión" className="flex items-center w-full p-2 text-sm font-medium text-gray-300 hover:bg-[#ff8080] rounded-md">
          <ArrowLeftOnRectangleIcon className="h-6 w-6 flex-shrink-0" />
          <span className={`ml-4 whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}