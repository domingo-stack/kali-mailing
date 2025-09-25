// En: app/contacts/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'; // <-- Añadimos useRef
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ImportContactsModal from '@/components/ImportContactsModal';
import AddContactModal from '@/components/AddContactModal';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DeleteContactsModal from '@/components/DeleteContactsModal';

type Contact = {
  id: number;
  created_at: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
};

export default function ContactsPage() {
  const { supabase, profile } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // --- LÓGICA DE PAGINACIÓN DINÁMICA ---
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  // 1. El PAGE_SIZE ahora es un estado que puede cambiar.
  const [pageSize, setPageSize] = useState(10); // Un valor inicial por defecto

  // 2. Usamos 'refs' para apuntar a nuestros elementos del DOM
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLTableRowElement>(null);
  // --- FIN DE LÓGICA DE PAGINACIÓN DINÁMICA ---

  const fetchContacts = useCallback(async () => {
    if (!supabase || pageSize === 0) return; // No buscar si el tamaño es 0
    setIsLoading(true);

    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('contacts')
      .select('id, created_at, email, first_name, last_name, status')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching contacts:', error);
      setContacts([]);
    } else if (data) {
      setContacts(data);
      setHasMore(data.length === pageSize);
    }
    setIsLoading(false);
  }, [supabase, page, pageSize]); // <-- 3. Añadimos 'pageSize' a las dependencias

  // --- 4. El useEffect que calcula el tamaño de página ---
  useEffect(() => {
    const calculatePageSize = () => {
      if (containerRef.current && rowRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const rowHeight = rowRef.current.clientHeight;
        if (rowHeight > 0) {
          const newSize = Math.floor(containerHeight / rowHeight);
          setPageSize(newSize);
        }
      }
    };

    // Hacemos un cálculo inicial después de que la primera fila se haya renderizado
    // Usamos un pequeño timeout para darle tiempo al DOM a estabilizarse
    const timer = setTimeout(() => {
      calculatePageSize();
    }, 100);

    // Añadimos un listener para recalcular si la ventana cambia de tamaño
    window.addEventListener('resize', calculatePageSize);

    // Limpiamos todo al desmontar el componente para evitar fugas de memoria
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculatePageSize);
    };
  }, [contacts]); // Se re-ejecuta si los contactos cambian (para medir la primera fila)

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleRowClick = (contactId: number) => router.push(`/contacts/${contactId}`);
  const refreshContacts = () => setPage(0);

  return (
    <div className="w-full flex flex-col h-full bg-gray-50 p-4 sm:p-6 lg:p-8">
      <header className="flex-shrink-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Contactos</h1>
          <div className="flex space-x-4">
          {profile?.role === 'admin' && (
              <button onClick={() => setIsDeleteModalOpen(true)} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700">
                Eliminar Contactos
              </button>
            )}
            <button onClick={() => setIsAddModalOpen(true)} className="bg-[#3c527a] text-white font-bold py-2 px-4 rounded-lg hover:opacity-90">Añadir Contacto</button>
            <button onClick={() => setIsImportModalOpen(true)} className="bg-[#ff8080] text-white font-bold py-2 px-4 rounded-lg hover:opacity-90">Importar (CSV)</button>
          </div>
        </div>
      </header>

      {/* --- 5. Conectamos el 'ref' al contenedor --- */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        {isLoading && contacts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Cargando contactos...</div>
        ) : contacts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
            <h3 className="text-lg font-medium">No tienes contactos</h3>
            <p className="mt-1 text-sm">¡Añade tu primer contacto o importa una lista para empezar!</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha de Creación</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.map((contact, index) => (
                    // --- 6. Conectamos el 'ref' a la primera fila para medirla ---
                    <tr ref={index === 0 ? rowRef : null} key={contact.id} className="hover:bg-gray-100 cursor-pointer" onClick={() => handleRowClick(contact.id)}>
                      <td className="px-6 py-4">{contact.email}</td>
                      <td className="px-6 py-4">{contact.first_name} {contact.last_name}</td>
                      <td className="px-6 py-4 capitalize">{contact.status}</td>
                      <td className="px-6 py-4">{format(new Date(contact.created_at), "d MMM, yyyy", { locale: es })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 0 || isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md disabled:opacity-50">Anterior</button>
              <span className="text-sm text-gray-700">Página {page + 1}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={!hasMore || isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md disabled:opacity-50">Siguiente</button>
            </div>
          </>
        )}
      </div>
      <ImportContactsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={refreshContacts}
      />
      <AddContactModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onContactAdded={refreshContacts}
      />
      <DeleteContactsModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleteSuccess={refreshContacts}
      />
    </div>
  );
}