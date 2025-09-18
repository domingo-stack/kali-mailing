// components/MyProjects.tsx
'use client';

import Link from 'next/link';
import { Project } from '@/lib/types';
import ProjectCard from './ProjectCard'; // Importamos nuestra nueva tarjeta
import { ChevronRightIcon } from '@/components/icons/ChevronRightIcon';

type ProjectWithMembers = Project & { members: { user_id: string; email: string; }[] };

type MyProjectsProps = {
  projects: ProjectWithMembers[];
  onFavoriteToggle: (projectId: number) => void;
  onInviteClick: (project: ProjectWithMembers) => void;
  onDeleteClick: (project: ProjectWithMembers) => void;
};

export default function MyProjects({ projects, onFavoriteToggle, onInviteClick, onDeleteClick }: MyProjectsProps) {
  const projectsPreview = projects.slice(0, 10); // Mostramos hasta 10 proyectos en el dashboard

  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold" style={{ color: '#383838' }}>
          Mis Proyectos
        </h2>
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

      {/* Contenedor con grid de 2 columnas y scroll */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto p-2 -mx-2">
        {projectsPreview.length > 0 ? (
          projectsPreview.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onFavoriteToggle={onFavoriteToggle}
              onInviteClick={onInviteClick}
              onDeleteClick={onDeleteClick}
            />
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-8 border-2 border-dashed rounded-lg">
            <p>No tienes proyectos aún.</p>
            <p className="text-xs mt-1">¡Crea tu primer proyecto para organizar tus tareas!</p>
          </div>
        )}
      </div>
    </div>
  );
}