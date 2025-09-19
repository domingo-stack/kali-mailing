// app/contacts/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ImportContactsModal from '@/components/ImportContactsModal'; // <-- 1. IMPORTAMOS EL MODAL

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
  const [isModalOpen, setIsModalOpen] = useState(false); // <-- 2. AÑADIMOS ESTADO PARA EL MODAL

  useEffect(() => {
    const fetchContacts = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('id, created_at, email, first_name, last_name, status');

      if (error) {
        console.error('Error fetching contacts:', error);
      } else if (data) {
        setContacts(data);
      }
      setIsLoading(false);
    };

    if (supabase) {
        fetchContacts();
    }
  }, [supabase]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#383838]">
          Contactos
        </h1>
        {/* 3. El botón ahora abre el modal */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#ff8080] text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
        >
          Importar Contactos (CSV)
        </button>
      </div>
      
      {isLoading ? (
        <p className="text-gray-500">Cargando contactos...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* ... (el código de la tabla se queda igual) ... */}
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Creación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.first_name} {contact.last_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(contact.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {contacts.length === 0 && (
              <div className="text-center p-12 text-gray-500">
                  <h3 className="text-lg font-medium">No se encontraron contactos</h3>
                  <p className="mt-1 text-sm">¡Empieza importando tu primer archivo CSV!</p>
              </div>
          )}
        </div>
      )}

      {/* 4. RENDERIZAMOS EL MODAL AQUÍ */}
      <ImportContactsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}