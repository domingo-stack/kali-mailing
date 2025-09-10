// app/admin/teams/page.tsx
'use client'

import { useState, useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';
import { Team } from '@/lib/types';
import CreateTeamModal from '@/components/CreateTeamModal';
import Link from 'next/link';  // Asumiendo que tienes un tipo 'Team' en types.ts

export default function AdminTeamsPage() {
  const { user, supabase } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // 1. Verificamos el rol del usuario desde nuestra nueva tabla 'profiles'
    const fetchUserRole = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        setRole(null);
      } else {
        setRole(data?.role || null);
      }
    };

    fetchUserRole();
  }, [user]);

  useEffect(() => {
    // 2. Si el usuario es 'superadmin', cargamos todos los equipos
    if (role === 'superadmin') {
      const fetchTeams = async () => {
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching teams:", error);
        } else {
          setTeams(data as Team[]);
        }
        setIsLoading(false);
      };

      fetchTeams();
    } else if (role !== null) {
      // Si el usuario tiene un rol que no es superadmin, terminamos de cargar
      setIsLoading(false);
    }
  }, [role]); // Este efecto se ejecuta cuando conocemos el rol

  if (isLoading) {
    return <div className="max-w-4xl mx-auto p-8 text-center">Cargando...</div>;
  }

  // 3. Mostramos un mensaje si el usuario no tiene permisos
  if (role !== 'superadmin') {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
        <p className="mt-2">No tienes los permisos necesarios para ver esta página.</p>
      </div>
    );
  }

  // 4. Mostramos la página de administración si es superadmin
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Administrar Equipos</h1>
        <button 
  onClick={() => setIsCreateModalOpen(true)}
  className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700 transition">
  Crear Nuevo Equipo
</button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Todos los Equipos</h2>
        <ul className="space-y-4">
  {teams.map((team) => (
    <Link 
      key={team.id} 
      href={`/admin/teams/${team.id}`}
      className="block p-3 bg-gray-50 rounded-md hover:bg-gray-100 hover:shadow-sm transition-all cursor-pointer"
    >
      <p className="font-medium text-blue-700">{team.name}</p>
      <p className="text-sm text-gray-500">ID del Dueño: {team.owner_id}</p>
    </Link>
  ))}
</ul>
        <CreateTeamModal
    isOpen={isCreateModalOpen}
    onClose={() => setIsCreateModalOpen(false)}
    onTeamCreated={(newTeam) => {
      // Añadimos el nuevo equipo a la lista sin recargar la página
      setTeams([newTeam, ...teams]);
    }}
  /> 
      </div>
    </div>
  );
}