// Este archivo será nuestra "fuente única de la verdad" para todo lo relacionado con segmentos.

// --- TIPOS DE DATOS ---

export const initialRulesState: RulesStructure = {
    condition: 'AND',
    groups: [
      {
        condition: 'AND',
        rules: [{ field: 'country', operator: 'eq', value: '' }]
      }
    ]
  };
  
export type Rule = {
    field: string;
    operator: string;
    value: any;
  };
  
  export type RuleGroup = {
    condition: 'AND' | 'OR';
    rules: Rule[];
  };
  
  export type RulesStructure = {
    condition: 'AND' | 'OR';
    groups: RuleGroup[];
  };
  
  // --- TIPOS DE CONFIGURACIÓN ---
  export type OperatorType = 'text' | 'select' | 'select-dynamic' | 'date';
  
  export type FieldConfigObject = {
    label: string;
    type: OperatorType;
    options?: readonly string[];
  };
  
  export type FieldKey = 'status' | 'country' | 'city' | 'subscription_type' | 'created_at';
  
  // --- OBJETOS DE CONFIGURACIÓN ---
  export const fieldConfig: Record<FieldKey, FieldConfigObject> = {
    'status': { label: 'Estado', type: 'select', options: ['Subscribed', 'Unsubscribed', 'Pending'] },
    'country': { label: 'País', type: 'text' },
    'city': { label: 'Ciudad', type: 'text' },
    'subscription_type': { label: 'Tipo de Suscripción', type: 'select-dynamic' },
    'created_at': { label: 'Fecha de Creación', type: 'date' },
  };
  
  export const operators: Record<OperatorType, readonly { value: string; label: string }[]> = {
    text: [ { value: 'eq', label: 'es igual a' }, { value: 'neq', label: 'no es igual a' }, { value: 'contains', label: 'contiene' }, ],
    select: [ { value: 'eq', label: 'es' }, { value: 'neq', label: 'no es' }, ],
    'select-dynamic': [ { value: 'eq', label: 'es' }, { value: 'neq', label: 'no es' }, ],
    date: [ { value: 'last_days', label: 'en los últimos (días)' }, { value: 'older_than_days', label: 'hace más de (días)' }, { value: 'after', label: 'después de (fecha)' }, { value: 'before', label: 'antes de (fecha)' }, ],
  };

  