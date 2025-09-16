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
      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border-2 border-white"
      title={email}
      // 👇 CAMBIO: Usamos el color secundario (azul) de fondo y texto blanco
      style={{ backgroundColor: '#3c527a', color: 'white' }}
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
        {/* 👇 CAMBIO 1: Título de la sección */}
        <h2 
          className="text-2xl font-bold" 
          style={{ color: '#383838' }}
        >
          Mis Proyectos
        </h2>
        {/* 👇 CAMBIO 2: Enlace "Ver todos" */}
        <Link 
          href="/projects" 
          className="flex items-center gap-1 text-sm font-semibold"
          style={{ color: '#ff8080' }}
          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
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
                {/* 👇 CAMBIO 3: Título de cada proyecto */}
                <h3 
                  className="font-semibold" 
                  style={{ color: '#383838' }}
                >
                  {project.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1 truncate">{project.description || 'Sin descripción'}</p>
              </Link>
              <div className="flex items-center ml-4">
                <div className="flex -space-x-2">
                  {project.members.map(member => (
                    <Avatar key={member.user_id} email={member.email} />
                  ))}
                </div>
                {/* 👇 CAMBIO 4: Botón "Invitar" */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); 
                    onInviteClick(project);
                  }}
                  className="ml-2 w-7 h-7 flex items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-gray-400 transition-colors"
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3c527a'; e.currentTarget.style.color = '#3c527a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#9CA3AF'; }}
                  title="Invitar miembros"
                >
                  <UserPlusIcon className="h-4 w-4" />
                </button>
                {/* 👇 CAMBIO 5: Botón "Eliminar" */}
                <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClick(project);
                    }}
                    className="ml-2 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 transition-colors"
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFF0F0'; e.currentTarget.style.color = '#ff8080'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
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