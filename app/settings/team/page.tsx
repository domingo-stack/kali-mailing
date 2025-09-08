// app/settings/team/page.tsx

'use client'; 

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { TrashIcon } from '@/components/icons/TrashIcon';

type TeamMember = {
  user_id: string;
  email: string;
  role: string;
};

export default function TeamSettingsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false); // <-- Nuevo estado para el botón
  const [emailToInvite, setEmailToInvite] = useState('');

  useEffect(() => {
    async function fetchMembers() {
      const { data, error } = await supabase.rpc('get_team_members');

      if (error) {
        console.error('Error al cargar los miembros del equipo:', error);
        alert('No se pudieron cargar los miembros del equipo.');
      } else {
        setMembers(data);
      }
      setIsLoading(false);
    }

    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- ¡FUNCIÓN ACTUALIZADA! ---
  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailToInvite) return;

    setIsInviting(true); // Bloqueamos el botón

    // Llamamos a nuestra Edge Function "invite-user"
    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: { emailToInvite },
    });

    if (error) {
      alert(`Error al enviar la invitación: ${error.message}`);
    } else {
      alert(data.message); // Muestra el mensaje de éxito desde la función
      setEmailToInvite(''); // Limpia el campo
    }

    setIsInviting(false); // Desbloqueamos el botón
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar a este miembro?')) {
        alert(`Próximamente: Eliminar miembro con ID: ${memberId}`);
    }
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto p-8 text-center">Cargando equipo...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Gestión de Equipo</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Invitar Nuevo Miembro</h2>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={emailToInvite}
            onChange={(e) => setEmailToInvite(e.target.value)}
            placeholder="email@ejemplo.com"
            className="flex-grow p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            required
            disabled={isInviting} // <-- Deshabilitamos mientras se envía
          />
          <button
            type="submit"
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
            disabled={isInviting} // <-- Deshabilitamos mientras se envía
          >
            {isInviting ? 'Enviando...' : 'Enviar Invitación'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Miembros del Equipo</h2>
        <ul className="space-y-4">
          {members.map((member) => (
            <li key={member.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div>
                <p className="font-medium">{member.email}</p>
                <p className="text-sm text-gray-500">{member.role}</p>
              </div>
              {member.role !== 'Dueño' && (
                 <button 
                    onClick={() => handleRemoveMember(member.user_id)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-md"
                 >
                    <TrashIcon className="w-5 h-5" />
                 </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}