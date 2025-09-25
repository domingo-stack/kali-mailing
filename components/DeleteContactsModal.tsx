// En: components/DeleteContactsModal.tsx
'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

type Segment = { id: number; name: string; };
type Contact = { id: number; email: string; };
type Props = { 
  isOpen: boolean; 
  onClose: () => void;
  onDeleteSuccess: () => void; // <-- Para refrescar la lista de contactos
};

export default function DeleteContactsModal({ isOpen, onClose, onDeleteSuccess }: Props) {
  const { supabase } = useAuth();
  const [deleteMode, setDeleteMode] = useState<'segment' | 'individual'>('segment');
  const [isActioning, setIsActioning] = useState(false);

  // Estados para el modo "Segmento"
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState('');

  // --- CAMBIO 1: Nuevos estados para el modo "Individual" ---
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  // Cargar los segmentos para el menú desplegable
  useEffect(() => {
    const fetchSegments = async () => {
      if (isOpen && deleteMode === 'segment') {
        const { data } = await supabase.from('segments').select('id, name');
        setSegments(data || []);
      }
    };
    fetchSegments();
  }, [isOpen, deleteMode, supabase]);

  // --- CAMBIO 2: useEffect para buscar contactos mientras el usuario escribe ---
  useEffect(() => {
    // Si no hay término de búsqueda o ya hemos seleccionado a alguien, no hacemos nada.
    if (!searchTerm || contactToDelete) {
      setSearchResults([]);
      return;
    }

    const search = setTimeout(async () => {
      const { data } = await supabase
        .from('contacts')
        .select('id, email')
        .ilike('email', `%${searchTerm}%`)
        .limit(5);
      setSearchResults(data || []);
    }, 300); // Esperamos 300ms después de que el usuario deja de teclear

    return () => clearTimeout(search); // Limpiamos el temporizador
  }, [searchTerm, contactToDelete, supabase]);

  const handleDelete = async () => {
    if (!supabase) return;
    setIsActioning(true);
    let error = null;
    let successMessage = '';

    // --- LÓGICA PARA EL BORRADO POR SEGMENTO ---
    if (deleteMode === 'segment') {
      if (!selectedSegment) {
        alert('Por favor, selecciona un segmento.');
        setIsActioning(false);
        return;
      }

      // Llamamos a nuestra función de base de datos (RPC)
      const { data, error: rpcError } = await supabase.rpc('delete_contacts_in_segment', { 
        p_segment_id: parseInt(selectedSegment) 
      });

      error = rpcError;
      successMessage = `${data || 0} contactos fueron eliminados con éxito.`;
    
    // --- LÓGICA PARA EL BORRADO INDIVIDUAL ---
    } else if (deleteMode === 'individual') {
      if (!contactToDelete) {
        alert('Por favor, busca y selecciona un contacto para eliminar.');
        setIsActioning(false);
        return;
      }

      // Hacemos un borrado simple por ID
      const { error: deleteError } = await supabase.from('contacts').delete().eq('id', contactToDelete.id);
      
      error = deleteError;
      successMessage = `Contacto ${contactToDelete.email} eliminado con éxito.`;
    }

    if (error) {
      alert(`Error al eliminar: ${error.message}`);
      console.error('Error:', error);
    } else {
      alert(successMessage);
      onDeleteSuccess(); // Refrescamos la lista de contactos en la página principal
      onClose();
      // Reseteamos estados internos del modal
      setContactToDelete(null);
      setSearchTerm('');
      setSelectedSegment('');
    }
    setIsActioning(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Eliminar Contactos</h2>
        
        <div className="flex border-b mb-4">
          <button onClick={() => setDeleteMode('segment')} className={`py-2 px-4 ${deleteMode === 'segment' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500'}`}>Por Segmento</button>
          {/* --- CAMBIO 3: Activamos la pestaña de borrado individual --- */}
          <button onClick={() => setDeleteMode('individual')} className={`py-2 px-4 ${deleteMode === 'individual' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500'}`}>Individualmente</button>
        </div>
        
        {deleteMode === 'segment' && (
          <div>
            <label htmlFor="segment-select" className="block text-sm font-medium text-gray-700">Selecciona el segmento a eliminar</label>
            <select id="segment-select" value={selectedSegment} onChange={(e) => setSelectedSegment(e.target.value)} className="mt-1 w-full p-2 border rounded-lg">
              <option value="" disabled>-- Elige un segmento --</option>
              {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-2">Advertencia: Esta acción eliminará permanentemente a TODOS los contactos que pertenezcan a este segmento.</p>
          </div>
        )}

        {/* --- CAMBIO 4: Añadimos el JSX para el borrado individual --- */}
        {deleteMode === 'individual' && (
          <div>
            <label htmlFor="contact-search" className="block text-sm font-medium text-gray-700">Busca el contacto por email</label>
            {contactToDelete ? (
              <div className="mt-1 flex items-center justify-between p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-800 font-medium">{contactToDelete.email}</span>
                <button onClick={() => { setContactToDelete(null); setSearchTerm(''); }} className="text-blue-600 hover:text-blue-800">Cambiar</button>
              </div>
            ) : (
              <div className="relative">
                <input
                  id="contact-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="empieza a escribir un email..."
                  className="mt-1 w-full p-2 border rounded-lg"
                />
                {searchResults.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border mt-1 rounded-lg shadow-lg">
                    {searchResults.map(contact => (
                      <li key={contact.id} onClick={() => { setContactToDelete(contact); setSearchResults([]); }} className="p-2 hover:bg-gray-100 cursor-pointer">
                        {contact.email}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">Advertencia: Esta acción eliminará permanentemente al contacto seleccionado.</p>
          </div>
        )}
        
        <div className="flex justify-end space-x-4 mt-8">
          <button onClick={onClose} disabled={isActioning} className="px-4 py-2 bg-gray-200 rounded-lg">Cancelar</button>
          <button onClick={handleDelete} disabled={isActioning} className="px-4 py-2 text-white bg-red-600 rounded-lg disabled:opacity-50">
            {isActioning ? 'Eliminando...' : 'Eliminar Permanentemente'}
          </button>
        </div>
      </div>
    </div>
  );
}