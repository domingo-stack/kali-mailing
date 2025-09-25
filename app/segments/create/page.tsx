// En: app/segments/create/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

// --- CORRECCIÓN: Importamos desde los lugares correctos ---
import SegmentRuleBuilder from '@/components/SegmentRuleBuilder';
import { 
  RulesStructure,
  fieldConfig, 
  FieldKey 
} from '@/lib/segmentationConfig'; // <-- La fuente de la verdad para los tipos y la config

// Definimos el estado inicial para un nuevo segmento
const initialRulesState: RulesStructure = {
  condition: 'AND',
  groups: [
    {
      condition: 'AND',
      rules: [{ field: 'country', operator: 'eq', value: '' }]
    }
  ]
};

export default function CreateSegmentPage() {
  const { supabase } = useAuth();
  const router = useRouter();

  const [segmentName, setSegmentName] = useState('');
  const [rules, setRules] = useState<RulesStructure>(initialRulesState);
  const [isSaving, setIsSaving] = useState(false);
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, string[]>>({});

  const activeDynamicFields = useMemo(() => {
    const fields = new Set<string>();
    rules.groups.forEach(group => {
      group.rules.forEach(rule => {
        if (fieldConfig[rule.field as FieldKey]?.type === 'select-dynamic') {
          fields.add(rule.field);
        }
      });
    });
    return Array.from(fields);
  }, [rules]);

  useEffect(() => {
    if (!supabase || activeDynamicFields.length === 0) return;
    const fetchOptions = async () => {
      const newOptions = { ...dynamicOptions };
      let needsUpdate = false;
      for (const field of activeDynamicFields) {
        if (!newOptions[field]) {
          const { data, error } = await supabase.rpc('get_distinct_contact_attributes', { column_name: field });
          if (!error && data) {
            newOptions[field] = data.map((item: { distinct_value: string }) => item.distinct_value);
            needsUpdate = true;
          }
        }
      }
      if (needsUpdate) setDynamicOptions(newOptions);
    };
    fetchOptions();
  }, [supabase, activeDynamicFields, dynamicOptions]);

  const handleSaveSegment = async () => {
    if (!segmentName) {
      alert('Por favor, dale un nombre a tu segmento.');
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.from('segments').insert([{ 
      name: segmentName, 
      rules: rules
    }]);

    if (error) {
      alert('Hubo un error al guardar el segmento.');
      console.error(error);
      setIsSaving(false);
    } else {
      alert('¡Segmento guardado con éxito!');
      router.push('/segments');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Link href="/segments" className="text-sm text-gray-500 hover:text-gray-900">&larr; Volver a Segmentos</Link>
        <h1 className="text-3xl font-bold text-gray-800 mt-2">Crear Nuevo Segmento</h1>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
        <div className="mb-6">
          <label htmlFor="segmentName" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Segmento</label>
          <input type="text" id="segmentName" value={segmentName} onChange={(e) => setSegmentName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ej: Clientes Premium de Perú" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Reglas</h2>
          <SegmentRuleBuilder value={rules} onChange={setRules} dynamicOptions={dynamicOptions} />
        </div>
        <div className="flex justify-end mt-8">
          <button onClick={handleSaveSegment} disabled={isSaving} className="bg-[#3c527a] text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 disabled:opacity-50">
            {isSaving ? 'Guardando...' : 'Guardar Segmento'}
          </button>
        </div>
      </div>
    </div>
  );
}