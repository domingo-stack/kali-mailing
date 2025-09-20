// app/segments/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ConfirmationModal from '@/components/ConfirmationModal'; // <-- 1. IMPORTAMOS EL MODAL
import { TrashIcon } from '@heroicons/react/24/outline'; 

// 1. Añadimos 'contact_count' a nuestro tipo de dato
type Segment = {
  id: number;
  created_at: string;
  name: string;
  rules: {
    field: string;
    operator: string;
    value: string;
  };
  contact_count?: number; // Hacemos el conteo opcional
};

export default function SegmentsPage() {
  const { supabase } = useAuth();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [segmentToDelete, setSegmentToDelete] = useState<Segment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 2. Usamos useCallback para que la función no se recree innecesariamente
  const fetchSegmentsAndCounts = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);

    // Primero, obtenemos la lista de todos los segmentos
    const { data: segmentsData, error: segmentsError } = await supabase
      .from('segments')
      .select('*')
      .order('created_at', { ascending: false });

    if (segmentsError) {
      console.error('Error fetching segments:', segmentsError);
      setIsLoading(false);
      return;
    }

    // Luego, para cada segmento, llamamos a nuestra función RPC para obtener el conteo
    const segmentsWithCounts = await Promise.all(
      segmentsData.map(async (segment) => {
        const { data: count, error: countError } = await supabase.rpc('get_segment_contact_count', {
          p_segment_id: segment.id,
        });

        if (countError) {
          console.error(`Error fetching count for segment ${segment.id}:`, countError);
          return { ...segment, contact_count: 0 }; // Si hay error, mostramos 0
        }
        return { ...segment, contact_count: count };
      })
    );
    
    setSegments(segmentsWithCounts);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSegmentsAndCounts();
  }, [fetchSegmentsAndCounts]);

  const handleDeleteSegment = async () => {
    if (!segmentToDelete || !supabase) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from('segments')
      .delete()
      .eq('id', segmentToDelete.id);

    if (error) {
      alert("Error al eliminar el segmento.");
      console.error(error);
    } else {
      // Actualizamos la lista en la UI para no tener que recargar la página
      setSegments(prevSegments => prevSegments.filter(s => s.id !== segmentToDelete.id));
      setSegmentToDelete(null); // Esto cerrará el modal
    }
    setIsDeleting(false);
  }; 


  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#383838]">
          Segmentos
        </h1>
        <Link 
          href="/segments/create"
          className="bg-[#ff8080] text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
        >
          Crear Nuevo Segmento
        </Link>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Cargando segmentos y calculando conteos...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md">
          <ul className="divide-y divide-gray-200">
            {segments.length > 0 ? (
              segments.map((segment) => (
                // 3. Convertimos el <li> en un Link para la futura vista de detalle
                <li key={segment.id}>
                  <Link href={`/segments/${segment.id}`} className="block p-4 sm:p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-lg font-semibold text-[#3c527a]">{segment.name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Regla: <span className="font-mono bg-gray-100 p-1 rounded-md text-xs">{segment.rules.field} {segment.rules.operator} {segment.rules.value}</span>
                        </p>
                      </div>
                      {/* 4. Mostramos el conteo de contactos */}
                      <div className="text-right">
                         <p className="text-lg font-bold text-gray-900">{segment.contact_count?.toLocaleString('es-CL')}</p>
                         <p className="text-xs text-gray-500">Contactos</p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <div className="text-center p-12 text-gray-500">
                <h3 className="text-lg font-medium">Aún no hay segmentos</h3>
                <p className="mt-1 text-sm">¡Crea tu primer segmento para empezar a agrupar tus contactos!</p>
              </div>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}