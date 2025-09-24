// app/campaigns/StatusBadge.tsx
'use client'

const statusColors: { [key: string]: string } = {
  draft: 'bg-gray-400',
  sent: 'bg-green-500',
  scheduled: 'bg-blue-500',
  error: 'bg-red-500',
};

export default function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;

  const color = statusColors[status.toLowerCase()] || 'bg-gray-200';
  // Aseguramos que el texto siempre sea legible
  const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className="flex items-center">
      <span className={`h-2 w-2 rounded-full ${color} mr-2`}></span>
      <span className="text-sm font-medium text-gray-800">{capitalizedStatus}</span>
    </div>
  );
}