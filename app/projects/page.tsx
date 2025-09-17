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
  const [showArchived, setShowArchived] = useState(false);

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
    let query = supabase
    .from('projects')
    .select('*')
    .eq('team_id', profileData.active_team_id);
  
  // 4. Añadimos el filtro de archivado dinámicamente
  if (showArchived) {
    query = query.not('archived_at', 'is', null); // Pedimos los archivados
  } else {
    query = query.is('archived_at', null); // Pedimos los activos
  }
  
  
  const { data: projectsData, error: projectsError } = await query;
    
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
}, [user, supabase, showArchived]);

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
const handleUnarchiveProject = async (projectId: number) => {
  if (!supabase) return;
  const { error } = await supabase
    .from('projects')
    .update({ archived_at: null }) // Ponemos la fecha de archivado en null
    .eq('id', projectId);

  if (error) {
    alert('Error al desarchivar el proyecto: ' + error.message);
  } else {
    await fetchData(); // Refrescamos la lista para que el proyecto desaparezca de la vista
  }
};

return (
  <AuthGuard>
    <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold" style={{ color: '#383838' }}>
          {showArchived ? 'Proyectos Archivados' : 'Mis Proyectos'}
        </h1>
        <div className="flex items-center gap-4">
          {/* Checkbox to show archived projects */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showArchivedProjects"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
              style={{ accentColor: '#3c527a' }}
            />
            <label htmlFor="showArchivedProjects" className="text-sm font-medium" style={{ color: '#383838' }}>
              Mostrar archivados
            </label>
          </div>
          {/* The "New Project" button is only shown if we are NOT viewing the archived projects */}
          {!showArchived && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-md transition-opacity"
              style={{ backgroundColor: '#ff8080' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <PlusIcon className="h-5 w-5" />
              Nuevo Proyecto
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p>Cargando proyectos...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {projects.length > 0 ? (
            projects.map(project => (
              <div 
                  key={project.id}
                  className="block p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow relative"
              >
                <Link href={`/projects/${project.id}`} className="block">
                  <h2 className="text-xl font-bold" style={{ color: '#383838' }}>{project.name}</h2>
                  <p className="mt-2 text-sm text-gray-600 truncate">{project.description || 'Sin descripción'}</p>
                </Link>
                {/* 👇 CORRECTED BUTTON: Unarchive button, only visible in the archived view */}
                {showArchived && (
                  <button 
                    onClick={() => handleUnarchiveProject(project.id)}
                    className="absolute top-4 right-4 text-gray-400 transition-colors p-1" 
                    title="Desarchivar proyecto"
                    onMouseEnter={(e) => e.currentTarget.style.color = '#3c527a'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M7 9a7 7 0 0110-5.46M20 20v-5h-5M17 15a7 7 0 01-10 5.46" />
                      </svg>
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500 py-16">
              {showArchived ? 'No tienes proyectos archivados.' : 'No tienes proyectos. ¡Crea el primero!'}
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
);}