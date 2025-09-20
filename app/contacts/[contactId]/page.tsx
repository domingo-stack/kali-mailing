// app/contacts/[contactId]/page.tsx
'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';

type Contact = {
  id: number;
  created_at: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
  city: string | null;
  country: string | null;
  attributes: { [key: string]: any } | null;
};

export default function ContactDetailPage() {
  const { supabase } = useAuth();
  const params = useParams();
  const contactId = params.contactId as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});
  
  // --- INICIO DE NUEVA LÓGICA ---
  const [existingKeys, setExistingKeys] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [newValue, setNewValue] = useState('');
  // --- FIN DE NUEVA LÓGICA ---

  useEffect(() => {
    const fetchData = async () => {
      if (!contactId || !supabase) return;

      setIsLoading(true);
      // Hacemos ambas llamadas en paralelo
      const [contactRes, keysRes] = await Promise.all([
        supabase.from('contacts').select('*').eq('id', contactId).single(),
        supabase.rpc('get_distinct_attribute_keys') // Llamamos a nuestro "detective"
      ]);

      if (contactRes.error) {
        console.error('Error fetching contact:', contactRes.error);
      } else {
        setContact(contactRes.data);
        setEditForm(contactRes.data);
      }
      
      if (keysRes.error) {
        console.error('Error fetching attribute keys:', keysRes.error);
      } else {
        // Extraemos los nombres de las llaves del resultado
        setExistingKeys(keysRes.data.map((item: any) => item.attribute_key));
      }

      setIsLoading(false);
    };
    fetchData();
  }, [supabase, contactId]);

  const handleInputChange = (field: keyof Omit<Contact, 'attributes'>, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAttributeChange = (key: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: value },
    }));
  };
  
  const handleAddOrUpdateAttribute = () => {
    if (!selectedKey) {
      alert("Por favor, selecciona o crea un atributo.");
      return;
    }
    handleAttributeChange(selectedKey, newValue);
    setSelectedKey('');
    setNewValue('');
  };

  const handleSave = async () => {
    // ... (La función de guardar no cambia)
    if (!supabase) return;
    const { error } = await supabase.from('contacts').update(editForm).eq('id', contactId);
    if (error) {
      alert("Error al guardar los cambios.");
    } else {
      alert("Contacto actualizado con éxito.");
      setIsEditing(false);
      setContact(prev => ({ ...prev!, ...editForm }));
    }
  };

  if (isLoading) return <p>Cargando contacto...</p>;
  if (!contact) return <p>No se pudo encontrar el contacto.</p>;

  // Reemplaza todo desde la palabra 'return' hasta el final de la función

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/contacts" className="text-gray-500 hover:text-gray-900">&larr; Volver a contactos</Link>
        <div className="flex justify-between items-center mt-2">
          <h1 className="text-3xl font-bold text-[#383838]">Detalles del Contacto</h1>
          <button 
            onClick={() => {
              if (isEditing) handleSave();
              else setIsEditing(true);
            }}
            className="bg-[#3c527a] text-white font-bold py-2 px-6 rounded-lg hover:opacity-90"
          >
            {isEditing ? 'Guardar Cambios' : 'Editar Contacto'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        {/* --- CORRECCIÓN AQUÍ: Eliminamos el 'div' duplicado --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-6">
          <div>
            <label className="block text-sm font-medium text-gray-500">Email</label>
            <p className="mt-1 text-lg text-gray-900">{contact.email}</p>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-500">Estado del Contacto</label>
            {isEditing ? (
              <select id="status" value={editForm.status || ''} onChange={(e) => handleInputChange('status', e.target.value)} className="mt-1 w-full p-2 border rounded bg-white">
                <option value="subscribed">Suscrito</option>
                <option value="unsubscribed">No Suscrito</option>
                <option value="bounced">Rebotado</option>
              </select>
            ) : (
              <p className="mt-1 text-lg text-gray-900 capitalize">{contact.status || '-'}</p>
            )}
          </div>
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-500">Nombre</label>
            {isEditing ? (
              <input type="text" id="first_name" value={editForm.first_name || ''} onChange={(e) => handleInputChange('first_name', e.target.value)} className="mt-1 w-full p-2 border rounded"/>
            ) : (
              <p className="mt-1 text-lg text-gray-900">{contact.first_name || '-'}</p>
            )}
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-500">Apellido</label>
            {isEditing ? (
              <input type="text" id="last_name" value={editForm.last_name || ''} onChange={(e) => handleInputChange('last_name', e.target.value)} className="mt-1 w-full p-2 border rounded"/>
            ) : (
              <p className="mt-1 text-lg text-gray-900">{contact.last_name || '-'}</p>
            )}
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-500">Ciudad</label>
            {isEditing ? (
              <input type="text" id="city" value={editForm.city || ''} onChange={(e) => handleInputChange('city', e.target.value)} className="mt-1 w-full p-2 border rounded"/>
            ) : (
              <p className="mt-1 text-lg text-gray-900">{contact.city || '-'}</p>
            )}
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-500">País</label>
            {isEditing ? (
              <input type="text" id="country" value={editForm.country || ''} onChange={(e) => handleInputChange('country', e.target.value)} className="mt-1 w-full p-2 border rounded"/>
            ) : (
              <p className="mt-1 text-lg text-gray-900">{contact.country || '-'}</p>
            )}
          </div>
        </div>

        {/* EDITOR DE ATRIBUTOS MEJORADO */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Atributos Personalizados</h2>
          <div className="space-y-4">
            {Object.entries(editForm.attributes || {}).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <span className="font-semibold w-1/3 truncate">{key}:</span>
                {isEditing ? (
                  <input type="text" value={String(value)} onChange={(e) => handleAttributeChange(key, e.target.value)} className="flex-1 p-2 border rounded"/>
                ) : (
                  <span>{String(value)}</span>
                )}
              </div>
            ))}
          </div>
          
          {isEditing && (
            <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
              <select 
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="p-2 border rounded w-1/3 bg-white"
              >
                <option value="">Selecciona o crea...</option>
                {existingKeys.map(key => <option key={key} value={key}>{key}</option>)}
                <option value="new_attribute">-- Crear Nuevo Atributo --</option>
              </select>
              
              {selectedKey === 'subscription_type' ? (
                <select value={newValue} onChange={(e) => setNewValue(e.target.value)} className="p-2 border rounded flex-1 bg-white">
                  <option value="">Selecciona un valor...</option>
                  <option>Gratuito</option>
                  <option>Mensual</option>
                  <option>Anual</option>
                  <option>Cancelado</option>
                </select>
              ) : (
                <input type="text" placeholder="Valor del atributo" value={newValue} onChange={(e) => setNewValue(e.target.value)} className="p-2 border rounded flex-1"/>
              )}
              <button onClick={handleAddOrUpdateAttribute} className="bg-[#ff8080] text-white p-2 rounded">Añadir/Actualizar</button>
            </div>
          )}
          {isEditing && selectedKey === 'new_attribute' && (
            <div className="mt-2">
              <input type="text" placeholder="Nombre del nuevo atributo" onChange={(e) => setSelectedKey(e.target.value)} className="p-2 border rounded w-1/3"/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}