// components/AddContactModal.tsx
'use client'

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onContactAdded: () => void;
};

export default function AddContactModal({ isOpen, onClose, onContactAdded }: Props) {
  const { supabase } = useAuth();
  
  // Estado para los campos fijos
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  
  // Estado del Contacto (permiso de envío), con "Suscrito" por defecto
  const [contactStatus, setContactStatus] = useState('subscribed');
  
  // Estado del Cliente (tipo de suscripción)
  const [subscriptionType, setSubscriptionType] = useState('Gratuito');

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveContact = async () => {
    if (!email) {
      alert('El campo de email es obligatorio.');
      return;
    }
    setIsSaving(true);

    // --- CORRECCIÓN AQUÍ ---
    // Movemos 'subscription_type' fuera de 'attributes' y lo ponemos como una columna principal.
    const contactData = {
      email,
      first_name: firstName || null,
      last_name: lastName || null,
      city: city || null,
      country: country || null,
      status: contactStatus,
      subscription_type: subscriptionType, // <-- AHORA ES UNA COLUMNA PRINCIPAL
      attributes: {} // Dejamos attributes vacío por ahora, o podrías quitarlo si no añades otros
    };

    const { error } = await supabase.from('contacts').insert(contactData);

    if (error) {
      console.error('Error al añadir contacto:', error);
      alert('Hubo un error al guardar el contacto.');
    } else {
      alert('¡Contacto añadido con éxito!');
      onContactAdded();
      onClose();
      // Limpiamos el formulario
      setEmail('');
      setFirstName('');
      setLastName('');
      setCity('');
      setCountry('');
      setSubscriptionType('Gratuito');
    }
    setIsSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg space-y-4">
        <h2 className="text-2xl font-bold text-[#383838]">Añadir Nuevo Contacto</h2>
        
        {/* --- Formulario Mejorado --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email*</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="subscriptionType" className="block text-sm font-medium text-gray-700">Tipo de Suscripción</label>
            <select 
  id="subscriptionType" 
  value={subscriptionType} 
  onChange={(e) => setSubscriptionType(e.target.value)}
  // AÑADIMOS clases para el foco y quitamos la apariencia por defecto
  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#ff8080] focus:border-[#ff8080]"
>
  <option>Gratuito</option>
  <option>Mensual</option>
  <option>Anual</option>
  <option>Cancelado</option>
</select>
          </div>
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Nombre</label>
            <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Apellido</label>
            <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">Ciudad</label>
            <input type="text" id="city" value={city} onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">País</label>
            <input type="text" id="country" value={country} onChange={(e) => setCountry(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* --- Botones --- */}
        <div className="flex justify-end space-x-4 pt-4">
          <button onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">
            Cancelar
          </button>
          <button onClick={handleSaveContact} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-[#3c5c7a] rounded-lg hover:opacity-90">
            {isSaving ? 'Guardando...' : 'Guardar Contacto'}
          </button>
        </div>
      </div>
    </div>
  );
}