// app/segments/[segmentId]/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Definimos los tipos de datos que usaremos en esta página
type SegmentData = {
  id: number;
  name: string;
  rules: {
    field: string;
    operator: string;
    value: string;
  };
};

type Contact = {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
};


export default function SegmentDetailPage() {
  const { supabase } = useAuth();
  const params = useParams();
  const segmentId = params.segmentId as string;
  const router = useRouter();

  const [segment, setSegment] = useState<SegmentData | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]); // <-- 1. AÑADIMOS ESTADO PARA LOS CONTACTOS
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<SegmentData>>({});

  const fetchData = useCallback(async () => {
    if (!supabase || !segmentId) return;
    setIsLoading(true);

    // 2. HACEMOS AMBAS LLAMADAS EN PARALELO
    const [segmentRes, contactsRes] = await Promise.all([
      supabase.from('segments').select('id, name, rules').eq('id', segmentId).single(),
      supabase.rpc('get_contacts_in_segment', { p_segment_id: segmentId })
    ]);

    // Procesamos la respuesta del segmento
    if (segmentRes.error) {
      console.error("Error fetching segment details:", segmentRes.error);
    } else {
      setSegment(segmentRes.data);
      setEditForm(segmentRes.data);
    }

    // Procesamos la respuesta de los contactos
    if (contactsRes.error) {
      console.error("Error fetching contacts for segment:", contactsRes.error);
    } else {
      setContacts(contactsRes.data || []);
    }

    setIsLoading(false);
  }, [supabase, segmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ... (Las funciones handleFormChange y handleSaveChanges no cambian)
  const handleFormChange = (field: 'name' | 'field' | 'operator' | 'value', value: string) => {
    if (field === 'name') {
      setEditForm(prev => ({ ...prev, name: value }));
    } else {
      setEditForm(prev => ({ ...prev, rules: { ...prev.rules!, [field]: value } }));
    }
  };
  const handleSaveChanges = async () => { /* ... */ };
  const handleDuplicate = () => { /* ... */ };


  if (isLoading) {
    return <p>Cargando segmento y contactos...</p>;
  }
  if (!segment) {
    return <p>Segmento no encontrado.</p>;
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <Link href="/segments" className="text-gray-500 hover:text-gray-900">
          &larr; Volver a todos los segmentos
        </Link>
        <div className="flex justify-between items-center mt-2">
          {isEditing ? (
            <input 
              type="text"
              value={editForm.name || ''}
              onChange={(e) => handleFormChange('name', e.target.value)}
              className="text-3xl font-bold text-[#383838] border-b-2 border-gray-300 focus:outline-none focus:border-[#ff8080]"
            />
          ) : (
            <h1 className="text-3xl font-bold text-[#383838]">{segment.name}</h1>
          )}
          <div className="flex space-x-4">
    <button 
      onClick={handleDuplicate} // <-- Añadiremos esta función
      className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300"
    >
      Duplicar
    </button>
    <button 
      onClick={() => isEditing ? handleSaveChanges() : setIsEditing(true)}
      className="bg-[#3c527a] text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
    >
      {isEditing ? 'Guardar Cambios' : 'Editar Segmento'}
    </button>
  </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Regla de Segmentación</h2>
        {isEditing ? (
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <select value={editForm.rules?.field} onChange={(e) => handleFormChange('field', e.target.value)} className="p-2 border rounded bg-white">
              <option value="status">Estado</option>
              <option value="country">País</option>
              {/* Añade más opciones si es necesario */}
            </select>
            <select value={editForm.rules?.operator} onChange={(e) => handleFormChange('operator', e.target.value)} className="p-2 border rounded bg-white">
                <option value="eq">es igual a</option>
                <option value="neq">no es igual a</option>
                <option value="contains">contiene</option>
            </select>
            <input type="text" value={editForm.rules?.value} onChange={(e) => handleFormChange('value', e.target.value)} className="flex-1 p-2 border rounded" />
          </div>
        ) : (
          <p className="font-mono bg-gray-100 p-2 rounded-md text-sm">
            {segment.rules.field} {segment.rules.operator} {segment.rules.value}
          </p>
        )}
      </div>
      <div>
        <h2 className="text-2xl font-bold text-[#383838] mb-4">
          Contactos en este Segmento ({contacts.length})
        </h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.first_name} {contact.last_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {contacts.length === 0 && (
            <div className="text-center p-12 text-gray-500">
              <h3 className="text-lg font-medium">Este segmento no tiene contactos</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}