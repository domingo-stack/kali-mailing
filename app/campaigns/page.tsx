// app/campaigns/page.tsx
import Link from 'next/link';

export default function CampaignsPage() {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#383838]">
          Campañas
        </h1>
        <Link 
          href="/campaigns/create"
          className="bg-[#ff8080] text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
        >
          Crear Nueva Campaña
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
        <h3 className="text-lg font-medium">No has creado ninguna campaña</h3>
        <p className="mt-1 text-sm">¡Haz clic en el botón para empezar a diseñar tu primer correo!</p>
      </div>
    </div>
  );
}