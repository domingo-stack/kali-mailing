// components/InviteProjectMembersModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

type TeamMember = {
  user_id: string;
  email: string;
};

type InviteProjectMembersModalProps = {
  projectId: number;
  onClose: () => void;
  onMembersAdded: () => void;
};

export default function InviteProjectMembersModal({ projectId, onClose, onMembersAdded }: InviteProjectMembersModalProps) {
  const [availableMembers, setAvailableMembers] = useState<TeamMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { supabase } = useAuth();
  
  useEffect(() => {
    async function fetchAvailableMembers() {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_team_members_not_in_project', {
        p_project_id: projectId,
      });
      if (error) {
        console.error('Error fetching available members:', error);
      } else {
        setAvailableMembers(data || []);
      }
      setLoading(false);
    }
    fetchAvailableMembers();
  }, [projectId]);

  const handleToggleSelection = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) return;
    setLoading(true);
    const { error } = await supabase.rpc('add_members_to_project', {
      p_project_id: projectId,
      p_user_ids: selectedMembers,
    });
    if (error) {
      alert('Error al añadir miembros: ' + error.message);
    } else {
      onMembersAdded(); // Avisa al componente padre que se añadieron miembros
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h2 
        className="text-xl font-bold mb-4" 
        style={{ color: '#383838' }}
      >
        Invitar Miembros al Proyecto
      </h2>
      <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
        {loading ? (
          <p>Cargando miembros...</p>
        ) : availableMembers.length > 0 ? (
          availableMembers.map(member => (
            <div
              key={member.user_id}
              onClick={() => handleToggleSelection(member.user_id)}
              // 👇 CAMBIO 1: El fondo del miembro seleccionado usa un tono del color primario
              className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-gray-50`}
              style={selectedMembers.includes(member.user_id) ? { backgroundColor: '#FFF0F0' } : {}}
            >
              <input
                type="checkbox"
                readOnly
                checked={selectedMembers.includes(member.user_id)}
                // 👇 CAMBIO 2: El color del checkbox usa el primario
                className="h-4 w-4 rounded border-gray-300 focus:ring-orange-500"
                style={{ accentColor: '#ff8080' }} // La forma moderna de colorear checkboxes
              />
              <span className="ml-3 text-sm" style={{ color: '#383838' }}>{member.email}</span>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-4">Todos los miembros del equipo ya están en este proyecto.</p>
        )}
      </div>
      <div className="flex justify-end space-x-3 pt-4 mt-4 border-t">
        <button 
          type="button" 
          onClick={onClose} 
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancelar
        </button>
        <button
          onClick={handleAddMembers}
          disabled={loading || selectedMembers.length === 0}
          // 👇 CAMBIO 3: Botón de Añadir usa el color primario
          className="px-4 py-2 text-sm font-medium text-white rounded-md"
          style={{
            backgroundColor: (loading || selectedMembers.length === 0) ? '#FCA5A5' : '#ff8080',
            cursor: (loading || selectedMembers.length === 0) ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Añadiendo...' : `Añadir (${selectedMembers.length})`}
        </button>
      </div>
    </div>
  );}