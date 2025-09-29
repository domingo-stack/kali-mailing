// app/campaigns/create/page.tsx
'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function CreateCampaignPage() {
  const { supabase, user } = useAuth(); // <-- Asegúrate de obtener el 'user' del contexto
  const router = useRouter();

  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAndContinue = async () => {
    if (!campaignName || !subject) {
      alert('Por favor, completa el nombre y el asunto de la campaña.');
      return;
    }
    // Verificamos que tengamos un usuario antes de continuar
    if (!user) {
        alert('No se pudo identificar al usuario. Por favor, inicia sesión de nuevo.');
        return;
    }

    setIsSaving(true);

    const campaignData = {
      name: campaignName,
      subject: subject,
      preheader: preheader,
      status: 'draft',
      user_id: user.id // <-- LA LÍNEA CLAVE QUE AÑADIMOS
    };

    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaignData)
      .select('id')
      .single();

    if (error) {
      console.error('Error al crear la campaña:', error);
      alert(`Hubo un error al crear la campaña: ${error.message}`);
      setIsSaving(false);
    } else {
      // No necesitamos una alerta aquí, la redirección es suficiente feedback
      router.push(`/campaigns/editor/${data.id}`);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/campaigns" className="text-gray-500 hover:text-gray-900">
          &larr; Volver a Campañas
        </Link>
        <h1 className="text-3xl font-bold text-[#383838] mt-2">
          Crear Nueva Campaña
        </h1>
        <p className="text-gray-500 mt-1">Paso 1 de 3: Define los detalles básicos de tu campaña.</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
        <div>
          <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la Campaña (uso interno)
          </label>
          <input
            type="text"
            id="campaignName"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="Ej: Newsletter Septiembre 2025"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#ff8080] focus:border-[#ff8080]"
          />
        </div>
        
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Asunto del Correo (Subject)
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ej: ¡Nuevas actualizaciones en nuestra plataforma!"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#ff8080] focus:border-[#ff8080]"
          />
        </div>

        <div>
          <label htmlFor="preheader" className="block text-sm font-medium text-gray-700 mb-1">
            Pre-header (Texto de vista previa)
          </label>
          <input
            type="text"
            id="preheader"
            value={preheader}
            onChange={(e) => setPreheader(e.target.value)}
            placeholder="Ej: No te pierdas las últimas noticias..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#ff8080] focus:border-[#ff8080]"
          />
           <p className="text-xs text-gray-500 mt-1">Este es el texto corto que aparece después del asunto en la bandeja de entrada.</p>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={handleSaveAndContinue}
            disabled={isSaving}
            className="bg-[#3c527a] text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar y Continuar al Editor'}
          </button>
        </div>
      </div>
    </div>
  );
}