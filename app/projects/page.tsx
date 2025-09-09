'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Project } from '@/lib/types'
import AuthGuard from '@/components/AuthGuard'
import { useAuth } from '@/context/AuthContext'
import Modal from '@/components/Modal'
import AddProjectForm from '@/components/AddProjectForm'
import { PlusIcon } from '@heroicons/react/24/outline'

// 1. DEFINIMOS EL TIPO DE DATO QUE ESPERAMOS DE LA CONSULTA
type TeamWithProjects = {
  teams: {
    projects: Project[];
  } | null;
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // 2. APLICAMOS EL TIPO A LA CONSULTA USANDO <T>
    const { data: teamData, error: teamError } = await supabase
      .from('team_members')
      .select('teams(*, projects(*))')
      .eq('user_id', user.id)
      .single<TeamWithProjects>(); // <-- Le decimos a Supabase qué forma tienen los datos
      
    if (teamError) {
      console.error('Error fetching projects:', teamError);
      setProjects([]);
    } else if (teamData && teamData.teams) {
      // 3. USAMOS EL TIPO SEGURO: AHORA TYPESCRIPT SABE QUE .teams y .projects EXISTEN
      setProjects(teamData.teams.projects || []);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddProject = async (projectData: { name: string; description: string | null }) => {
    if (!user) return;

    const { data: teamData, error: teamError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single();

    if (teamError || !teamData) {
      console.error('Error fetching team id:', teamError);
      alert('Error: No se pudo encontrar tu equipo para crear el proyecto.');
      return;
    }

    const { error: rpcError } = await supabase.rpc('create_project', {
      p_name: projectData.name,
      p_description: projectData.description,
      p_team_id: teamData.team_id
    });

    if (rpcError) {
      console.error('Error adding project via RPC:', rpcError);
      alert('Error al crear el proyecto: ' + rpcError.message);
    } else {
      await fetchData();
      setIsCreateModalOpen(false);
    }
  };

  return (
    <AuthGuard>
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mis Proyectos</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5" />
            Nuevo Proyecto
          </button>
        </div>

        {loading ? (
          <p>Cargando proyectos...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {projects.length > 0 ? (
              projects.map(project => (
                <Link
                  href={`/projects/${project.id}`}
                  key={project.id}
                  className="block p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
                  <p className="mt-2 text-sm text-gray-600 truncate">{project.description || 'Sin descripción'}</p>
                </Link>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 py-16">
                No tienes proyectos. ¡Crea el primero!
              </p>
            )}
          </div>
        )}
      </main>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <AddProjectForm
          onAddProject={handleAddProject}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </AuthGuard>
  );
}