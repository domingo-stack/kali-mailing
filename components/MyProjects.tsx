'use client'

import Link from 'next/link'
import { Project } from '@/lib/types'
import { ChevronRightIcon, UserPlusIcon } from '@heroicons/react/20/solid'
import { TrashIcon } from '@/components/icons/TrashIcon';

// El tipo de proyecto ahora incluye la lista de miembros
type ProjectWithMembers = Project & { members: { user_id: string; email: string; }[] };

type MyProjectsProps = {
  projects: ProjectWithMembers[];
  onInviteClick: (project: ProjectWithMembers) => void;
  onDeleteClick: (project: ProjectWithMembers) => void;
};

const Avatar = ({ email }: { email: string | undefined }) => {
  const initial = email ? email.charAt(0).toUpperCase() : '?';
  return (
    <div
      className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs border-2 border-white"
      title={email}
    >
      {initial}
    </div>
  );
};

export default function MyProjects({ projects, onInviteClick, onDeleteClick }: MyProjectsProps) {
  const projectsPreview = projects.slice(0, 3);

  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Mis Proyectos</h2>
        <Link 
          href="/projects" 
          className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          Ver todos
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {projectsPreview.length > 0 ? (
          projectsPreview.map(project => (
            <div 
              key={project.id}
              className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow flex justify-between items-center"
            >
              <Link href={`/projects/${project.id}`} className="flex-1">
                <h3 className="font-semibold text-gray-800">{project.name}</h3>
                <p className="text-sm text-gray-500 mt-1 truncate">{project.description || 'Sin descripción'}</p>
              </Link>
              <div className="flex items-center ml-4">
                <div className="flex -space-x-2">
                  {project.members.map(member => (
                    <Avatar key={member.user_id} email={member.email} />
                  ))}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Evita que el Link se active
                    onInviteClick(project);
                  }}
                  className="ml-2 w-7 h-7 flex items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
                  title="Invitar miembros"
                >
                  <UserPlusIcon className="h-4 w-4" />
                </button>
                <button
                      onClick={(e) => {
                        e.stopPropagation(); // Evita que se active el Link de navegación
                        onDeleteClick(project);
                      }}
                      className="ml-2 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                      title="Eliminar proyecto"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8 border-2 border-dashed rounded-lg">
            <p>No tienes proyectos aún.</p>
            <p className="text-xs mt-1">¡Crea tu primer proyecto para organizar tus tareas!</p>
          </div>
        )}
      </div>
    </div>
  );
}