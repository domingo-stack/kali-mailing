// En: app/segments/[segmentId]/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// --- 1. IMPORTAMOS TODO DESDE NUESTRA FUENTE DE LA VERDAD ---
import SegmentRuleBuilder from '@/components/SegmentRuleBuilder';
import { 
  RulesStructure, 
  initialRulesState, // <-- Lo importamos también
  fieldConfig,
  FieldKey
} from '@/lib/segmentationConfig';

type Contact = { id: number; email: string; first_name: string | null; last_name: string | null; status: string | null; };
// El tipo 'SegmentData' ya no es necesario, usaremos los tipos importados

export default function SegmentDetailPage() {
  const { supabase } = useAuth();
  const params = useParams();
  const segmentId = params.segmentId as string;
  const router = useRouter();

  // Usamos 'any' temporalmente para el estado inicial, la lógica de fetchData lo corregirá
  const [segment, setSegment] = useState<any | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [editForm, setEditForm] = useState<{ name?: string; rules?: RulesStructure }>({});
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, string[]>>({});

  const fetchData = useCallback(async () => {
    if (!supabase || !segmentId) return;
    setIsLoading(true);
    
    const { data: segmentData, error: segmentError } = await supabase.from('segments').select('id, name, rules').eq('id', segmentId).single();
    if (segmentError) { router.push('/segments'); return; }
    
    if (segmentData) {
      let transformedRules: RulesStructure;
      if (segmentData.rules && segmentData.rules.groups) {
        transformedRules = segmentData.rules;
      } else if (Array.isArray(segmentData.rules) && segmentData.rules.length > 0) {
        transformedRules = { condition: 'AND', groups: [{ condition: 'AND', rules: segmentData.rules }] };
      } else {
        transformedRules = initialRulesState;
      }
      
      const transformedSegmentData = { ...segmentData, rules: transformedRules };
      setSegment(transformedSegmentData);
      setEditForm({ name: transformedSegmentData.name, rules: transformedSegmentData.rules });
    }
    
    const { data: contactsData } = await supabase.rpc('get_contacts_in_segment', { p_segment_id: parseInt(segmentId) });
    if (contactsData) setContacts(contactsData);
    
    setIsLoading(false);
  }, [supabase, segmentId, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeDynamicFields = useMemo(() => {
    const fields = new Set<string>();
    editForm.rules?.groups.forEach(group => {
        group.rules.forEach(rule => {
            if (fieldConfig[rule.field as FieldKey]?.type === 'select-dynamic') {
                fields.add(rule.field);
            }
        });
    });
    return Array.from(fields);
  }, [editForm.rules]);

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

  const handleRulesChange = (newRules: RulesStructure) => setEditForm(prev => ({ ...prev, rules: newRules }));
  const handleNameChange = (name: string) => setEditForm(prev => ({ ...prev, name }));
  
  const handleSaveChanges = async () => {
    if (!supabase) return;
    const { error } = await supabase.from('segments').update({ name: editForm.name, rules: editForm.rules }).eq('id', segmentId);
    if (error) { alert("Error al guardar."); } 
    else { setIsEditing(false); fetchData(); }
  };

  if (isLoading) return <p>Cargando segmento...</p>;
  if (!segment) return <p>Segmento no encontrado.</p>;
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Link href="/segments" className="text-sm text-gray-500 hover:text-gray-900">&larr; Volver a todos los segmentos</Link>
        <div className="flex justify-between items-center mt-2">
          {isEditing ? (
            <input 
              type="text" 
              value={editForm.name || ''} 
              onChange={(e) => handleNameChange(e.target.value)} 
              className="text-3xl font-bold text-gray-800 border-b-2 focus:outline-none focus:border-blue-500"
            />
          ) : (
            <h1 className="text-3xl font-bold text-gray-800">{segment.name}</h1>
          )}
          <div className="flex space-x-4">
            <button 
              onClick={() => isEditing ? handleSaveChanges() : setIsEditing(true)} 
              className="bg-[#3c527a] text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
            >
              {isEditing ? 'Guardar Cambios' : 'Editar Segmento'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Reglas de Segmentación</h2>
        {isEditing ? (
          <SegmentRuleBuilder
            value={editForm.rules || initialRulesState}
            onChange={handleRulesChange}
            dynamicOptions={dynamicOptions}
          />
        ) : (
          <div className="space-y-4">
            {segment.rules.groups?.map((group: any, groupIndex: number) => (
              <div key={groupIndex}>
                {groupIndex > 0 && (
                  <div className="flex justify-center my-2">
                    <span className="text-xs font-bold text-gray-500 bg-gray-200 rounded-full px-2 py-1">
                      {segment.rules.condition === 'AND' ? 'Y' : 'O'}
                    </span>
                  </div>
                )}
                <div className="border border-gray-200 rounded-lg p-4 space-y-2">
                  {group.rules.map((rule: any, ruleIndex: number) => {
                    const fieldLabel = fieldConfig[rule.field as FieldKey]?.label || rule.field;
                    const fieldType = fieldConfig[rule.field as FieldKey]?.type;
                    // We'll define a local operators object to avoid the error
                    const localOperators: Record<string, { value: string, label: string }[]> = {
                      string: [
                        { value: 'equals', label: 'es igual a' },
                        { value: 'contains', label: 'contiene' },
                        { value: 'startsWith', label: 'empieza con' },
                        { value: 'endsWith', label: 'termina con' },
                      ],
                      number: [
                        { value: 'equals', label: 'es igual a' },
                        { value: 'greaterThan', label: 'mayor que' },
                        { value: 'lessThan', label: 'menor que' },
                      ],
                      boolean: [
                        { value: 'isTrue', label: 'es verdadero' },
                        { value: 'isFalse', label: 'es falso' },
                      ],
                      // Agrega más tipos si es necesario
                    };
                    const operatorOptions = fieldType && localOperators[fieldType] ? localOperators[fieldType] : [];
                    const operatorLabel = operatorOptions.find((op: any) => op.value === rule.operator)?.label || rule.operator;
                    return (
                      <div key={ruleIndex} className="flex items-center space-x-2 text-sm">
                        <span className="font-semibold text-gray-800">{fieldLabel}</span>
                        <span className="text-gray-500">{operatorLabel}</span>
                        <span className="font-semibold text-gray-800 bg-gray-100 p-1 rounded">"{String(rule.value)}"</span>
                         {ruleIndex < group.rules.length - 1 && (
                           <span className="text-xs font-bold text-gray-400">{group.condition}</span>
                         )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-[#383838] mb-4">
          Contactos en este Segmento ({contacts.length})
        </h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contacts.length > 0 ? (
                contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.first_name} {contact.last_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center p-12 text-gray-500">
                    <h3 className="text-lg font-medium">Este segmento no tiene contactos</h3>
                    <p className="mt-1 text-sm">Ajusta las reglas para incluir a más personas.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}