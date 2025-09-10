'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  const { user, supabase } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // En app/projects/page.tsx

const fetchData = useCallback(async () => {
  if (!user || !supabase) {
    // Si no hay usuario, nos aseguramos de no quedarnos cargando.
    setLoading(false);
    return;
  }
  setLoading(true);

  try {
    // 1. Obtenemos el equipo activo del perfil del usuario.
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('active_team_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // Si hay un error al buscar el perfil, lo registramos.
      console.error('Error fetching profile:', profileError);
      setProjects([]);
      setLoading(false); // <-- Aseguramos que se detenga la carga
      return;
    }

    // 2. Si el usuario no tiene un equipo activo, no hay proyectos que mostrar.
    if (!profileData || !profileData.active_team_id) {
      console.log('User has no active team set.');
      setProjects([]);
      setLoading(false); // <-- Aseguramos que se detenga la carga
      return;
    }

    // 3. Pedimos los proyectos SOLAMENTE de ese equipo activo.
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('team_id', profileData.active_team_id);
    
    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      setProjects([]);
    } else {
      setProjects(projectsData || []);
    }
  } catch (err) {
    // Un catch general por si algo más falla.
    console.error("An unexpected error occurred in fetchData:", err);
    setProjects([]);
  } finally {
    // 4. ESTA ES LA CLAVE: El bloque 'finally' se ejecuta SIEMPRE,
    //    sin importar si hubo éxito o error.
    setLoading(false);
  }
}, [user, supabase]);

 useEffect(() => {
    fetchData();
  }, [fetchData]);

const handleAddProject = async (projectData: { name: string; description: string | null }) => {
  // 1. Verificamos que tenemos el usuario y el cliente de Supabase.
  if (!user || !supabase) return;

  // 2. Obtenemos el equipo activo desde el perfil del usuario.
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('active_team_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData || !profileData.active_team_id) {
    console.error('Error fetching active team id:', profileError);
    alert('Error: No se pudo encontrar tu equipo activo para crear el proyecto.');
    return;
  }

  // 3. Llamamos a la función RPC, pasando el ID del equipo activo.
  const { data: newProject, error: rpcError } = await supabase.rpc('create_project', {
    p_name: projectData.name,
    p_description: projectData.description,
    p_team_id: profileData.active_team_id
  });

  if (rpcError) {
    console.error('Error adding project via RPC:', rpcError);
    alert('Error al crear el proyecto: ' + rpcError.message);
  } else {
    // 4. Actualizamos el estado local para ver el proyecto nuevo al instante.
    if (newProject) {
      setProjects([...projects, newProject]);
    }
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