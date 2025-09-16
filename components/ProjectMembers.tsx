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
          // 👇 CAMBIO 1: Avatares usan el color secundario (azul)
          <div 
            key={member.user_id}
            className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm border-2 border-white"
            title={member.email}
            style={{ backgroundColor: '#3c527a' }}
          >
            {member.email?.charAt(0).toUpperCase() || '?'}
          </div>
        ))}
        {members.length > 5 && (
          // 👇 CAMBIO 2: El contador "+X" usa tonos del color secundario
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white"
            style={{ backgroundColor: '#EBF0F7', color: '#3c527a' }}
          >
            +{members.length - 5}
          </div>
        )}
      </div>
      {/* 👇 CAMBIO 3: Botón "Invitar" usa el color primario (naranja) */}
      <button 
        className="px-3 py-1.5 text-sm font-semibold rounded-md transition-colors"
        style={{ backgroundColor: '#FFF0F0', color: '#ff8080' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFEAE A'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFF0F0'}
      >
        Invitar
      </button>
    </div>
  );
}