// components/CreateTeamModal.tsx
'use client'

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext'
import { Team } from '@/lib/types';

type CreateTeamModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: (newTeam: Team) => void;
};

export default function CreateTeamModal({ isOpen, onClose, onTeamCreated }: CreateTeamModalProps) {
  const [teamName, setTeamName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useAuth();

  const handleCreateTeam = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!teamName.trim()) return;

    setIsCreating(true);
    setError(null);

    const { data, error } = await supabase.rpc('create_new_team', {
      team_name: teamName.trim(),
    });

    if (error) {
      setError(error.message);
      setIsCreating(false);
    } else {
      onTeamCreated(data as Team);
      setTeamName('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Crear Nuevo Equipo</h2>
        <form onSubmit={handleCreateTeam}>
          <label htmlFor="teamName" className="block text-sm font-medium text-gray-700">
            Nombre del Equipo
          </label>
          <input
            id="teamName"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej: Equipo de Marketing"
            required
          />
          
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-md text-sm font-semibold hover:bg-gray-300"
              disabled={isCreating}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isCreating || !teamName.trim()}
            >
              {isCreating ? 'Creando...' : 'Crear Equipo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}