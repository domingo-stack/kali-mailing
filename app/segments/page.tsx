// app/segments/page.tsx
'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

// Definimos un tipo para la estructura de un segmento
type Segment = {
  id: number;
  created_at: string;
  name: string;
  rules: {
    field: string;
    operator: string;
    value: string;
  };
};

export default function SegmentsPage() {
  const { supabase } = useAuth();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSegments = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('segments')
        .select('*')
        .order('created_at', { ascending: false }); // Mostramos los más nuevos primero

      if (error) {
        console.error('Error fetching segments:', error);
      } else if (data) {
        setSegments(data);
      }
      setIsLoading(false);
    };

    if (supabase) {
      fetchSegments();
    }
  }, [supabase]);

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
        <p className="text-gray-500">Cargando segmentos...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md">
          <ul className="divide-y divide-gray-200">
            {segments.length > 0 ? (
              segments.map((segment) => (
                <li key={segment.id} className="p-4 sm:p-6 hover:bg-gray-50 flex justify-between items-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{segment.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Regla: <span className="font-mono bg-gray-100 p-1 rounded-md text-xs">{segment.rules.field} {segment.rules.operator} {segment.rules.value}</span>
                    </p>
                  </div>
                  <div>
                    {/* Futuros botones de acción (Editar, Borrar) */}
                  </div>
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