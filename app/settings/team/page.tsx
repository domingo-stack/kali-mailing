// app/settings/team/page.tsx
'use client'; 

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TrashIcon } from '@/components/icons/TrashIcon';
import AuthGuard from '@/components/AuthGuard';

type TeamMember = {
  user_id: string;
  email: string;
  role: string;
};

export default function TeamSettingsPage() {
  const { supabase } = useAuth();
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [emailToAdd, setEmailToAdd] = useState('');
  
  useEffect(() => {
    if (!supabase) return; 

    async function fetchMembers() {
      const { data, error } = await supabase.rpc('get_team_members_by_active_team');

      if (error) {
        console.error('Error al cargar los miembros del equipo:', error);
      } else {
        setMembers(data || []);
      }
      setIsLoading(false);
    }

    fetchMembers();
  }, [supabase]);

  // --- NUEVA FUNCIÓN PARA AÑADIR MIEMBROS ---
  const handleAddMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailToAdd || !supabase) return;

    setIsAdding(true);

    const { data, error } = await supabase.rpc('add_member_to_active_team', {
      member_email: emailToAdd,
    });

    if (error) {
      alert(`Error al añadir al miembro: ${error.message}`);
    } else {
      alert(data); // Muestra el mensaje de éxito de la función
      setEmailToAdd('');
      // Volvemos a cargar los miembros para ver al nuevo integrante
      const { data: updatedMembers } = await supabase.rpc('get_team_members_by_active_team');
      setMembers(updatedMembers || []);
    }

    setIsAdding(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    // ... (Esta función no cambia)
    if (!supabase) return;
    if (confirm('¿Estás seguro de que quieres eliminar a este miembro del equipo?')) {
      const { error } = await supabase.rpc('remove_team_member', {
        member_id_to_remove: memberId
      });
  
      if (error) {
        alert(`Error al eliminar el miembro: ${error.message}`);
      } else {
        setMembers(members.filter(member => member.user_id !== memberId));
        alert('Miembro eliminado con éxito.');
      }
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-6">Gestión de Equipo</h1>
        
        {/* --- NUEVO FORMULARIO --- */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Añadir Miembro Existente</h2>
          <p className="text-sm text-gray-500 mb-4">
            El usuario debe haberse registrado previamente en la plataforma.
          </p>
          <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={emailToAdd}
              onChange={(e) => setEmailToAdd(e.target.value)}
              placeholder="email@registrado.com"
              className="flex-grow p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              required
              disabled={isAdding}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
              disabled={isAdding}
            >
              {isAdding ? 'Añadiendo...' : 'Añadir al Equipo'}
            </button>
          </form>
        </div>

        {/* --- La lista de miembros no cambia --- */}
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
    </AuthGuard>
  );
}