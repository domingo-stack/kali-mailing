// app/campaigns/page.tsx
'use client'

// ARREGLO 1: Importamos 'useCallback'
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import StatusBadge from './StatusBadge';
import { TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

type Campaign = {
  id: number;
  name: string | null;
  status: string | null;
  created_at: string;
};

export default function CampaignsPage() {
  const { supabase } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  const fetchCampaigns = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching campaigns:', error);
    } else {
      setCampaigns(data || []);
      if (!data || data.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    }
    setLoading(false);
  }, [supabase, page]);

  // ARREGLO 2: Nos aseguramos de que el useEffect no sea async
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleDelete = async (campaignId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta campaña? Esta acción no se puede deshacer.')) {
      const { error } = await supabase.from('campaigns').delete().eq('id', campaignId);
      if (error) {
        alert('Error al eliminar la campaña.');
      } else {
        setCampaigns(currentCampaigns => currentCampaigns.filter(c => c.id !== campaignId));
      }
    }
  };

  const handleDuplicate = async (campaignId: number) => {
    const { data: original, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
    
    if (fetchError || !original) {
        alert('No se pudo encontrar la campaña para duplicar.');
        return;
    }

    const duplicate = { ...original };
    delete (duplicate as any).id;
    delete (duplicate as any).created_at;
    duplicate.name = `${original.name} (Copia)`;
    duplicate.status = 'draft';

    const { error: insertError } = await supabase.from('campaigns').insert(duplicate);

    if (insertError) {
      alert('Error al duplicar la campaña.');
    } else {
      alert('Campaña duplicada con éxito.');
      setPage(0);
      fetchCampaigns();
    }
  };

  if (loading && campaigns.length === 0) {
    return <div className="p-8 text-center">Cargando campañas...</div>;
  }
  
  // ARREGLO 3: El JSX está completo y sin errores de sintaxis
  // En: app/campaigns/page.tsx

return (
  // Paso 1: El contenedor principal ahora usa Flexbox en formato de columna (flex-col)
  // y le decimos que ocupe toda la altura disponible (h-full).
  <div className="w-full flex flex-col h-full">

    {/* --- ZONA 1: Cabecera Fija --- */}
    {/* 'flex-shrink-0' es la clave: le prohíbe a esta sección encogerse. */}
    <header className="flex-shrink-0">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#383838]">Campañas</h1>
        <Link href="/campaigns/create" className="bg-[#ff8080] text-white font-bold py-2 px-4 rounded-lg hover:opacity-90">
          Crear Nueva Campaña
        </Link>
      </div>
    </header>

    {/* --- ZONA 2: Contenido con Scroll --- */}
    {/* 'flex-1' le dice a esta sección que crezca y ocupe todo el espacio sobrante.
        'overflow-y-auto' le añade el scroll vertical solo a esta zona. */}
    <div className="flex-1 overflow-y-auto">
      {loading && campaigns.length === 0 ? (
          <div className="text-center p-8">Cargando...</div>
      ) : campaigns.length === 0 && page === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
              <h3 className="text-lg font-medium">No has creado ninguna campaña</h3>
              <p className="mt-1 text-sm">¡Haz clic en el botón para empezar a diseñar tu primer correo!</p>
          </div>
      ) : (
          <>
              <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                          <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaña</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Modificación</th>
                              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                          </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
  {campaigns.map((campaign) => {
    
    // --- LÓGICA AÑADIDA ---
    // Determinamos la URL a la que debe dirigir el enlace
    // Si el estado es 'sent', va a la página de estadísticas.
    // Para cualquier otro estado ('draft', etc.), va al editor.
    const campaignUrl = campaign.status === 'sent' 
      ? `/campaigns/stats/${campaign.id}` 
      : `/campaigns/editor/${campaign.id}`;
    // --- FIN DE LA LÓGICA AÑADIDA ---

    return (
      <tr key={campaign.id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          {/* Usamos la nueva variable campaignUrl en el href */}
          <Link href={campaignUrl} className="text-sm font-medium text-[#3c527a] hover:text-[#ff8080]">
            {campaign.name || 'Campaña sin nombre'}
          </Link>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <StatusBadge status={campaign.status} />
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {format(new Date(campaign.created_at), "d 'de' LLLL, yyyy 'a las' HH:mm", { locale: es })}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
          <button onClick={() => handleDuplicate(campaign.id)} title="Duplicar" className="text-gray-400 hover:text-[#3c527a]">
            <DocumentDuplicateIcon className="h-5 w-5" />
          </button>
          <button onClick={() => handleDelete(campaign.id)} title="Eliminar" className="text-gray-400 hover:text-[#ff8080]">
            <TrashIcon className="h-5 w-5" />
          </button>
        </td>
      </tr>
    );
  })}
</tbody>
                  </table>
              </div>

              {/* La paginación también queda dentro de la zona de scroll */}
              <div className="flex justify-between items-center mt-4">
                  <button 
                      onClick={() => setPage(page - 1)} 
                      disabled={page === 0 || loading}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md disabled:opacity-50"
                  >
                      Anterior
                  </button>
                  <span className="text-sm text-gray-700">Página {page + 1}</span>
                  <button 
                      onClick={() => setPage(page + 1)} 
                      disabled={!hasMore || loading}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md disabled:opacity-50"
                  >
                      Siguiente
                  </button>
              </div>
          </>
      )}
    </div>
  </div>
);}
