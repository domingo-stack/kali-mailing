// app/contacts/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import ImportContactsModal from '@/components/ImportContactsModal';
import AddContactModal from '@/components/AddContactModal';
import { useRouter } from 'next/navigation'; // <-- 1. IMPORTAMOS useRouter

type Contact = {
  id: number;
  created_at: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
};

export default function ContactsPage() {
  const { supabase } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const router = useRouter(); // <-- 2. INICIALIZAMOS EL ROUTER

  const fetchContacts = useCallback(async () => {
    // ... (el código de fetchContacts se queda igual)
    if (!supabase) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select('id, created_at, email, first_name, last_name, status')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
    } else if (data) {
      setContacts(data);
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);
  
  // 3. FUNCIÓN PARA NAVEGAR AL DETALLE DEL CONTACTO
  const handleRowClick = (contactId: number) => {
    router.push(`/contacts/${contactId}`);
  };

  return (
    <div className="w-full flex flex-col h-full bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* --- Cabecera Fija --- */}
      <header className="flex-shrink-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Contactos</h1>
          <div className="flex space-x-4">
            <button onClick={() => setIsAddModalOpen(true)} className="bg-[#3c527a] text-white font-bold py-2 px-4 rounded-lg hover:opacity-90">
              Añadir Contacto
            </button>
            <button onClick={() => setIsImportModalOpen(true)} className="bg-[#ff8080] text-white font-bold py-2 px-4 rounded-lg hover:opacity-90">
              Importar (CSV)
            </button>
          </div>
        </div>
      </header>

      {/* --- Contenido con Scroll --- */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Cargando contactos...</div>
        ) : contacts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
             <h3 className="text-lg font-medium">No tienes contactos</h3>
             <p className="mt-1 text-sm">¡Añade tu primer contacto o importa una lista para empezar!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Creación</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.map((contact) => (
                  <tr 
                    key={contact.id} 
                    className="hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleRowClick(contact.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.first_name} {contact.last_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{contact.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(contact.created_at).toLocaleDateString('es-ES')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Los modales se quedan fuera de la zona de scroll */}
      <ImportContactsModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImportSuccess={fetchContacts} // <-- Pasamos la función para refrescar la lista
      />
      <AddContactModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onContactAdded={fetchContacts} 
      />
    </div>
  );}