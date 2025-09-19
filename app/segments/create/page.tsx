// app/segments/create/page.tsx
'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function CreateSegmentPage() {
  const { supabase } = useAuth();
  const router = useRouter();

  const [segmentName, setSegmentName] = useState('');
  const [ruleField, setRuleField] = useState('status');
  const [ruleOperator, setRuleOperator] = useState('eq');
  const [ruleValue, setRuleValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Determina si el campo seleccionado es de tipo fecha
  const isDateField = ruleField === 'created_at' || ruleField === 'last_modified_at';

  const handleSaveSegment = async () => {
    if (!segmentName || !ruleValue) {
      alert('Por favor, completa todos los campos de la regla.');
      return;
    }
    
    setIsSaving(true);

    const segmentData = {
      name: segmentName,
      // Convertimos el valor a número si es necesario
      rules: {
        field: ruleField,
        operator: ruleOperator,
        value: (isDateField && ruleOperator === 'last_days') ? Number(ruleValue) : ruleValue
      }
    };

    const { error } = await supabase
      .from('segments')
      .insert([segmentData]);

    if (error) {
      console.error('Error al guardar el segmento:', error);
      alert('Hubo un error al guardar el segmento.');
      setIsSaving(false);
    } else {
      alert('¡Segmento guardado con éxito!');
      router.push('/segments');
    }
  };
  
  // Renderiza el input correcto dependiendo del operador
  const renderValueInput = () => {
    if (isDateField && ruleOperator === 'last_days') {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={ruleValue}
            onChange={(e) => setRuleValue(e.target.value)}
            placeholder="Ej: 30"
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
          />
          <span className="text-gray-700">días</span>
        </div>
      );
    }
    
    if (isDateField && (ruleOperator === 'after' || ruleOperator === 'before')) {
      return (
        <input
          type="date"
          value={ruleValue}
          onChange={(e) => setRuleValue(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
        />
      );
    }

    return (
      <input
        type="text"
        value={ruleValue}
        onChange={(e) => setRuleValue(e.target.value)}
        placeholder="Escribe un valor..."
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
      />
    );
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <Link href="/segments" className="text-gray-500 hover:text-gray-900">
          &larr; Volver a Segmentos
        </Link>
        <h1 className="text-3xl font-bold text-[#383838] mt-2">
          Crear Nuevo Segmento
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Nombre del Segmento */}
        <div className="mb-6">
          <label htmlFor="segmentName" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Segmento
          </label>
          <input
            type="text"
            id="segmentName"
            value={segmentName}
            onChange={(e) => setSegmentName(e.target.value)}
            placeholder="Ej: Usuarios creados en los últimos 30 días"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Constructor de Reglas */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Reglas</h2>
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            {/* Campo a filtrar */}
            <select 
              value={ruleField}
              onChange={(e) => {
                setRuleField(e.target.value);
                // Reseteamos el operador si cambiamos de tipo de campo
                const isDate = e.target.value.includes('_at');
                setRuleOperator(isDate ? 'last_days' : 'eq');
                setRuleValue('');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <optgroup label="Texto">
                <option value="status">Estado</option>
                <option value="country">País</option>
                <option value="city">Ciudad</option>
              </optgroup>
              <optgroup label="Fecha">
                <option value="created_at">Fecha de Creación</option>
                <option value="last_modified_at">Última Actualización</option>
              </optgroup>
            </select>

            {/* Operador de la regla */}
            <select 
              value={ruleOperator}
              onChange={(e) => setRuleOperator(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {isDateField ? (
                <>
                  <option value="last_days">en los últimos</option>
                  <option value="after">después de</option>
                  <option value="before">antes de</option>
                </>
              ) : (
                <>
                  <option value="eq">es igual a</option>
                  <option value="neq">no es igual a</option>
                  <option value="contains">contiene</option>
                </>
              )}
            </select>

            {/* Valor de la regla (ahora es dinámico) */}
            {renderValueInput()}
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="flex justify-end mt-8">
          <button
            onClick={handleSaveSegment}
            disabled={isSaving}
            className="bg-[#3c527a] text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar Segmento'}
          </button>
        </div>
      </div>
    </div>
  );
}