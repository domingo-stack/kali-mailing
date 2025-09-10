// app/admin/teams/[id]/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Team } from '@/lib/types';
import Link from 'next/link';
import { TrashIcon } from '@/components/icons/TrashIcon';

// El tipo para los miembros que nos devolverá la nueva función
type TeamMember = {
  user_id: string;
  email: string;
  role: string;
};

export default function TeamManagementPage() {
  const { user, supabase } = useAuth();
  const params = useParams();
  const teamId = Number(params.id);

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user || !teamId) return;

    setIsLoading(true);
    setError(null);

    // Obtenemos los detalles del equipo y los miembros en paralelo
    const [teamDetailsRes, teamMembersRes] = await Promise.all([
      supabase.from('teams').select('*').eq('id', teamId).single(),
      supabase.rpc('get_team_members_by_id', { p_team_id: teamId })
    ]);

    if (teamDetailsRes.error) {
      console.error('Error fetching team details:', teamDetailsRes.error);
      setError('No se pudo cargar el equipo o no tienes permiso para verlo.');
    } else {
      setTeam(teamDetailsRes.data as Team);
    }

    if (teamMembersRes.error) {
      console.error('Error fetching team members:', teamMembersRes.error);
      setError('No se pudieron cargar los miembros del equipo.');
    } else {
      setMembers(teamMembersRes.data as TeamMember[]);
    }

    setIsLoading(false);
  }, [user, teamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <div className="max-w-4xl mx-auto p-8 text-center">Cargando datos del equipo...</div>;
  }

  if (error) {
    return <div className="max-w-4xl mx-auto p-8 text-center text-red-500">{error}</div>;
  }

  if (!team) {
    return <div className="max-w-4xl mx-auto p-8 text-center">Equipo no encontrado.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-6">
        <Link href="/admin/teams" className="text-sm text-blue-600 hover:underline">
          &larr; Volver a todos los equipos
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestionar Equipo: {team.name}</h1>
        {/* Aquí irá el botón de eliminar equipo en el futuro */}
      </div>

      {/* Sección para editar el nombre del equipo */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Detalles del Equipo</h2>
        {/* Aquí irá un formulario para editar el nombre */}
        <p>Próximamente: Editar nombre del equipo.</p>
      </div>

      {/* Sección para gestionar miembros */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Miembros del Equipo</h2>
            <button className="bg-blue-600 text-white font-semibold px-4 py-2 text-sm rounded-md hover:bg-blue-700 transition">
              Invitar Miembro
            </button>
        </div>
        <ul className="space-y-4">
          {members.map((member) => (
            <li key={member.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div>
                <p className="font-medium">{member.email}</p>
                <p className="text-sm text-gray-500">{member.role}</p>
              </div>
              {member.role !== 'Dueño' && (
                <button className="text-red-500 hover:text-red-700 p-1 rounded-md">
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