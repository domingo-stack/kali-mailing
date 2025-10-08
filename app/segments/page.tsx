// En: app/segments/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ConfirmationModal from '@/components/ConfirmationModal';
import { TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'; 
// --- 1. IMPORTAMOS LOS TIPOS CORRECTOS DESDE EL LUGAR CORRECTO ---
import { fieldConfig, operators, type Rule, type RulesStructure, type FieldKey } from '@/lib/segmentationConfig';

// --- 2. ACTUALIZAMOS EL TIPO 'Segment' ---
// Ahora 'rules' puede ser la nueva estructura O el array antiguo, y TypeScript lo sabe.
type Segment = {
  id: number;
  created_at: string;
  name: string;
  rules: RulesStructure | Rule[] | null;
  contact_count?: number;
  description?: string | null;
};

export default function SegmentsPage() {
  const { supabase } = useAuth();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [segmentToDelete, setSegmentToDelete] = useState<Segment | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  const fetchSegmentsAndCounts = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);

    const { data: segmentsData, error: segmentsError } = await supabase
      .from('segments')
      .select('*')
      .order('created_at', { ascending: false });

    if (segmentsError) {
      console.error('Error fetching segments:', segmentsError);
      setIsLoading(false);
      return;
    }

    const segmentsWithCounts = await Promise.all(
      segmentsData.map(async (segment: Segment) => {
        const { data: count, error: countError } = await supabase.rpc('get_segment_contact_count', { p_segment_id: segment.id });
        if (countError) {
          console.error(`Error fetching count for segment ${segment.id}:`, countError);
          return { ...segment, contact_count: 0 };
        }
        return { ...segment, contact_count: count };
      })
    );
    
    setSegments(segmentsWithCounts as Segment[]);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSegmentsAndCounts();
  }, [fetchSegmentsAndCounts]);

  const handleDeleteSegment = async () => {
    if (!segmentToDelete || !supabase) return;
    setIsActioning(true);
    const { error } = await supabase.from('segments').delete().eq('id', segmentToDelete.id);
    if (error) {
      alert("Error al eliminar el segmento.");
    } else {
      setSegments(prevSegments => prevSegments.filter(s => s.id !== segmentToDelete.id));
      setSegmentToDelete(null);
    }
    setIsActioning(false);
  }; 

  const handleDuplicate = async (segmentId: number) => {
    if (!supabase) return;
    setIsActioning(true);
    const { data: original, error: fetchError } = await supabase.from('segments').select('*').eq('id', segmentId).single();
    if (fetchError || !original) {
      alert('No se pudo encontrar el segmento para duplicar.');
      setIsActioning(false);
      return;
    }
    const duplicateData = {
      name: `${original.name} (Copia)`,
      rules: original.rules,
      description: original.description
    };
    const { error: insertError } = await supabase.from('segments').insert(duplicateData);
    if (insertError) {
      alert(`Error al duplicar el segmento: ${insertError.message}`);
    } else {
      alert('Segmento duplicado con éxito.');
      fetchSegmentsAndCounts(); 
    }
    setIsActioning(false);
  };

  return (
    <div className="w-full flex flex-col h-full bg-gray-50 p-4 sm:p-6 lg:p-8">
      <header className="flex-shrink-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Segmentos</h1>
          <Link href="/segments/create" className="bg-[#ff8080] text-white font-bold py-2 px-4 rounded-lg hover:opacity-90">
            Crear Nuevo Segmento
          </Link>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? ( <div className="text-center py-12">Cargando segmentos...</div> ) 
        : segments.length === 0 ? ( <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500"><h3 className="text-lg font-medium">Aún no hay segmentos</h3><p className="mt-1 text-sm">¡Crea tu primer segmento!</p></div> ) 
        : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contactos</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Regla Principal</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {segments.map((segment) => {
                  let rulePreview = "Sin reglas";
                  let totalRules = 0;
                  let firstRule: Rule | null = null;
                  
                  if (segment.rules) {
                    // --- 3. LÓGICA DE PREVISUALIZACIÓN MEJORADA Y SEGURA ---
                    if ('groups' in segment.rules && Array.isArray(segment.rules.groups)) {
                      totalRules = segment.rules.groups.reduce((acc, group) => acc + group.rules.length, 0);
                      if (totalRules > 0) firstRule = segment.rules.groups[0].rules[0];
                    } else if (Array.isArray(segment.rules)) {
                      totalRules = segment.rules.length;
                      if (totalRules > 0) firstRule = segment.rules[0];
                    }
                  }

                  if (firstRule) {
                    const fieldLabel = fieldConfig[firstRule.field as FieldKey]?.label || firstRule.field;
                    const fieldType = fieldConfig[firstRule.field as FieldKey]?.type;
                    const operatorLabel = fieldType ? operators[fieldType].find(op => op.value === firstRule.operator)?.label || firstRule.operator : firstRule.operator;
                    rulePreview = `${fieldLabel} ${operatorLabel} "${firstRule.value}"`;
                    if (totalRules > 1) {
                      rulePreview += ` y ${totalRules - 1} más...`;
                    }
                  }

                  return (
                    <tr key={segment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4"><Link href={`/segments/${segment.id}`} className="text-sm font-medium text-[#3c527a] hover:text-[#ff8080]">{segment.name}</Link></td>
                      <td className="px-6 py-4 text-sm font-semibold">{segment.contact_count?.toLocaleString('es-CL') ?? '...'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{rulePreview}</td>
                      <td className="px-6 py-4 text-right text-sm space-x-4">
                         <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDuplicate(segment.id); }} disabled={isActioning} title="Duplicar" className="text-gray-400 hover:text-[#3c527a] disabled:opacity-50"><DocumentDuplicateIcon className="h-5 w-5" /></button>
                         <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSegmentToDelete(segment); }} disabled={isActioning} title="Eliminar" className="text-gray-400 hover:text-red-500 disabled:opacity-50"><TrashIcon className="h-5 w-5" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ConfirmationModal isOpen={!!segmentToDelete} onClose={() => setSegmentToDelete(null)} onConfirm={handleDeleteSegment} title="Eliminar Segmento" message={`¿Estás seguro de que quieres eliminar el segmento "${segmentToDelete?.name}"?`} isActioning={isActioning}/>
    </div>
  );
}