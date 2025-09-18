// components/ProjectCard.tsx
'use client';

import Link from 'next/link';
import { Project } from '@/lib/types';
import { UserPlusIcon } from '@/components/icons/UserPlusIcon';
import { TrashIcon } from '@/components/icons/TrashIcon';

// The Avatar component
const Avatar = ({ email }: { email: string | undefined }) => {
  const initial = email ? email.charAt(0).toUpperCase() : '?';
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border-2 border-white"
      title={email}
      style={{ backgroundColor: '#3c527a', color: 'white' }}
    >
      {initial}
    </div>
  );
};

type ProjectWithMembers = Project & { members: { user_id: string; email: string; }[] };

// En components/ProjectCard.tsx

type ProjectCardProps = {
  project: ProjectWithMembers;
  onFavoriteToggle: (projectId: number) => void;
  onInviteClick: (project: ProjectWithMembers) => void; // Corregido: sin guion
  onDeleteClick: (project: ProjectWithMembers) => void; // Corregido: sin guion y añadida
};

export default function ProjectCard({ project, onFavoriteToggle, onInviteClick, onDeleteClick }: ProjectCardProps) {
  
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <div className="relative group">
      <Link
        href={`/projects/${project.id}`}
        className="block p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow h-32 flex flex-col justify-between"
      >
        {/* Top Section: Title and Description */}
        <div className="overflow-hidden pr-8">
          <h3 
            className="font-bold truncate" 
            style={{ color: '#383838' }}
            title={project.name}
          >
            {project.name}
          </h3>
          <p 
            className="text-sm text-gray-500 mt-1 h-10 overflow-hidden"
            title={project.description || ''}
          >
            {project.description}
          </p>
        </div>


        {/* Bottom Section: Members and Hidden Actions */}
        <div className="flex justify-between items-center">
          {/* Members */}
          <div className="flex -space-x-2">
            {project.members.slice(0, 3).map(member => (
              <Avatar key={member.user_id} email={member.email} />
            ))}
            {project.members.length > 3 && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border-2 border-white" style={{ backgroundColor: '#EBF0F7', color: '#3c527a' }}>
                +{project.members.length - 3}
              </div>
            )}
          </div>

          {/* Actions that appear on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
             <button
                onClick={(e) => handleActionClick(e, () => onInviteClick(project))}
                className="w-7 h-7 flex items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-gray-400 transition-colors"
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3c527a'; e.currentTarget.style.color = '#3c527a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#9CA3AF'; }}
                title="Invitar miembros"
              >
                <UserPlusIcon className="h-4 w-4" />
              </button>
              <button
                  onClick={(e) => handleActionClick(e, () => onDeleteClick(project))}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 transition-colors"
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFF0F0'; e.currentTarget.style.color = '#ff8080'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                  title="Eliminar proyecto"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
          </div>
        </div>
      {/* 👇 THIS IS THE FIX: The </Link> tag was in the wrong place. It should be here. */}
      </Link>

      {/* The Favorite Star button should be OUTSIDE the Link */}
      <button
        onClick={(e) => handleActionClick(e, () => onFavoriteToggle(project.id))}
        className="absolute top-3 right-3 p-1 rounded-full text-gray-300 hover:bg-yellow-100 transition-colors"
        title={project.is_favorited ? 'Quitar de favoritos' : 'Marcar como favorito'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" style={project.is_favorited ? { color: '#FBBF24' } : {}}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </button>
    </div>
  );
}