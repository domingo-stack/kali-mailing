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
      <h2 className="text-xl font-bold mb-4">Invitar Miembros al Proyecto</h2>
      <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
        {loading ? (
          <p>Cargando miembros...</p>
        ) : availableMembers.length > 0 ? (
          availableMembers.map(member => (
            <div
              key={member.user_id}
              onClick={() => handleToggleSelection(member.user_id)}
              className={`flex items-center p-2 rounded-md cursor-pointer ${
                selectedMembers.includes(member.user_id) ? 'bg-blue-100' : 'hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                readOnly
                checked={selectedMembers.includes(member.user_id)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-sm">{member.email}</span>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-4">Todos los miembros del equipo ya están en este proyecto.</p>
        )}
      </div>
      <div className="flex justify-end space-x-3 pt-4 mt-4 border-t">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md">
          Cancelar
        </button>
        <button
          onClick={handleAddMembers}
          disabled={loading || selectedMembers.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md disabled:bg-gray-400"
        >
          {loading ? 'Añadiendo...' : `Añadir (${selectedMembers.length})`}
        </button>
      </div>
    </div>
  );
}