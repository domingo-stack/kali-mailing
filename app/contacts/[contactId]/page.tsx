// En: app/contacts/[contactId]/page.tsx
'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';

type Contact = {
  id: number;
  created_at: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
  city: string | null;
  country: string | null;
  subscription_type: string | null; // <-- Columna principal
  attributes: { [key: string]: any } | null;
};

export default function ContactDetailPage() {
  const { supabase } = useAuth();
  const params = useParams();
  const contactId = params.contactId as string;
  const router = useRouter();

  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});
  
  const [existingKeys, setExistingKeys] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!contactId || !supabase) return;
      setIsLoading(true);

      const [contactRes, keysRes] = await Promise.all([
        supabase.from('contacts')
          .select('id, created_at, email, first_name, last_name, status, city, country, attributes, subscription_type::text')
          .eq('id', contactId)
          .single(),
        supabase.rpc('get_distinct_attribute_keys')
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
    if (!supabase) return;
    const { error } = await supabase.from('contacts').update(editForm).eq('id', contactId);
    if (error) {
      alert("Error al guardar los cambios.");
    } else {
      alert("Contacto actualizado con éxito.");
      setIsEditing(false);
      // Actualizamos el estado local para reflejar los cambios guardados
      const { data: updatedContact } = await supabase.from('contacts').select('*, subscription_type::text').eq('id', contactId).single();
      setContact(updatedContact);
    }
  };

  if (isLoading) return <p>Cargando contacto...</p>;
  if (!contact) return <p>No se pudo encontrar el contacto.</p>;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/contacts" className="text-gray-500 hover:text-gray-900">&larr; Volver a contactos</Link>
        <div className="flex justify-between items-center mt-2">
          <h1 className="text-3xl font-bold text-[#383838]">Detalles del Contacto</h1>
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="bg-[#3c527a] text-white font-bold py-2 px-6 rounded-lg hover:opacity-90"
          >
            {isEditing ? 'Guardar Cambios' : 'Editar Contacto'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        {/* --- SECCIÓN PRINCIPAL DE DATOS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-6">
          <div>
            <label className="block text-sm font-medium text-gray-500">Email</label>
            <p className="mt-1 text-lg text-gray-900">{contact.email}</p>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-500">Estado del Contacto</label>
            {isEditing ? (
              <select id="status" value={editForm.status || ''} onChange={(e) => handleInputChange('status', e.target.value)} className="mt-1 w-full p-2 border rounded bg-white">
                <option value="Subscribed">Suscrito</option>
                <option value="Unsubscribed">No Suscrito</option>
                <option value="Bounced">Rebotado</option>
              </select>
            ) : (<p className="mt-1 text-lg text-gray-900 capitalize">{contact.status || '-'}</p>)}
          </div>
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-500">Nombre</label>
            {isEditing ? (<input type="text" id="first_name" value={editForm.first_name || ''} onChange={(e) => handleInputChange('first_name', e.target.value)} className="mt-1 w-full p-2 border rounded"/>) 
            : (<p className="mt-1 text-lg text-gray-900">{contact.first_name || '-'}</p>)}
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-500">Apellido</label>
            {isEditing ? (<input type="text" id="last_name" value={editForm.last_name || ''} onChange={(e) => handleInputChange('last_name', e.target.value)} className="mt-1 w-full p-2 border rounded"/>) 
            : (<p className="mt-1 text-lg text-gray-900">{contact.last_name || '-'}</p>)}
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-500">Ciudad</label>
            {isEditing ? (<input type="text" id="city" value={editForm.city || ''} onChange={(e) => handleInputChange('city', e.target.value)} className="mt-1 w-full p-2 border rounded"/>) 
            : (<p className="mt-1 text-lg text-gray-900">{contact.city || '-'}</p>)}
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-500">País</label>
            {isEditing ? (<input type="text" id="country" value={editForm.country || ''} onChange={(e) => handleInputChange('country', e.target.value)} className="mt-1 w-full p-2 border rounded"/>) 
            : (<p className="mt-1 text-lg text-gray-900">{contact.country || '-'}</p>)}
          </div>
          {/* --- NUEVO CAMPO 'subscription_type' COMO CAMPO PRINCIPAL --- */}
          <div>
            <label htmlFor="subscription_type" className="block text-sm font-medium text-gray-500">Tipo de Suscripción</label>
            {isEditing ? (
              <select id="subscription_type" value={editForm.subscription_type || ''} onChange={(e) => handleInputChange('subscription_type', e.target.value)} className="mt-1 w-full p-2 border rounded bg-white">
                <option value="">No especificado</option>
                <option value="Gratuito">Gratuito</option>
                <option value="Mensual">Mensual</option>
                <option value="Anual">Anual</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            ) : (
              <p className="mt-1 text-lg text-gray-900">{contact.subscription_type || '-'}</p>
            )}
          </div>
        </div>

        {/* --- SECCIÓN DE ATRIBUTOS PERSONALIZADOS (AHORA MÁS LIMPIA) --- */}
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
              <select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)} className="p-2 border rounded w-1/3 bg-white">
                <option value="">Selecciona o crea...</option>
                {/* Filtramos para no mostrar 'subscription_type' aquí */}
                {existingKeys.filter(k => k !== 'subscription_type').map(key => <option key={key} value={key}>{key}</option>)}
                <option value="new_attribute">-- Crear Nuevo Atributo --</option>
              </select>
              
              {/* YA NO NECESITAMOS LA LÓGICA ESPECIAL PARA 'subscription_type' AQUÍ */}
              <input type="text" placeholder="Valor del atributo" value={newValue} onChange={(e) => setNewValue(e.target.value)} className="p-2 border rounded flex-1"/>
              
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