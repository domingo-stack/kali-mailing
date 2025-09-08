// components/ProjectMembers.tsx
'use client';

// Tipo para un miembro del proyecto
type Member = {
  user_id: string;
  email: string;
};

type ProjectMembersProps = {
  members: Member[];
};

export default function ProjectMembers({ members }: ProjectMembersProps) {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex -space-x-2">
        {members.slice(0, 5).map(member => (
          <div 
            key={member.user_id}
            className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm border-2 border-white"
            title={member.email}
          >
            {member.email?.charAt(0).toUpperCase() || '?'}
          </div>
        ))}
        {members.length > 5 && (
          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm border-2 border-white">
            +{members.length - 5}
          </div>
        )}
      </div>
      <button className="px-3 py-1.5 text-sm font-semibold text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200">
        Invitar (Próximamente)
      </button>
    </div>
  );
}