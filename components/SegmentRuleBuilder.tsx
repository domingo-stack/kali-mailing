'use client'

import React from 'react';
import { TrashIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
// IMPORTAMOS TODO DESDE NUESTRA FUENTE DE LA VERDAD
import { 
  fieldConfig, 
  operators, 
  type Rule, 
  type RulesStructure, 
  type RuleGroup, 
  type FieldKey 
} from '@/lib/segmentationConfig';

// --- SUB-COMPONENTE DE FILA (CORREGIDO Y TIPADO) ---
type RuleRowProps = { 
  rule: Rule; 
  onUpdate: (updatedRule: Rule) => void; 
  onRemove: () => void; 
  dynamicOptions: string[]; 
};

function RuleRow({ rule, onUpdate, onRemove, dynamicOptions }: RuleRowProps) {
    const currentField = fieldConfig[rule.field as FieldKey];
    const availableOperators = operators[currentField.type];
  
    const handleFieldChange = (newField: string) => {
      const newFieldType = fieldConfig[newField as FieldKey].type;
      const newOperator = operators[newFieldType][0].value;
      onUpdate({ field: newField, operator: newOperator, value: '' });
    };
  
    const renderValueInput = () => {
        switch (currentField.type) {
            case 'select': return <select value={rule.value} onChange={(e) => onUpdate({ ...rule, value: e.target.value })} className="flex-1 p-2 border rounded">{currentField.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}</select>;
            case 'select-dynamic': return <select value={rule.value} onChange={(e) => onUpdate({ ...rule, value: e.target.value })} className="flex-1 p-2 border rounded"><option value="">Selecciona...</option>{dynamicOptions.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}</select>;
            case 'date':
                if (rule.operator === 'after' || rule.operator === 'before') {
                    return <input type="date" value={rule.value} onChange={(e) => onUpdate({ ...rule, value: e.target.value })} className="flex-1 p-2 border rounded" />;
                }
                return <div className="flex items-center space-x-2 flex-1"><input type="number" value={rule.value} onChange={(e) => onUpdate({ ...rule, value: e.target.value })} placeholder="Ej: 30" className="w-24 p-2 border rounded" /><span className="text-gray-600">días</span></div>;
            default: return <input type="text" value={rule.value} onChange={(e) => onUpdate({ ...rule, value: e.target.value })} className="flex-1 p-2 border rounded" placeholder="Escribe un valor..." />;
        }
    };
  
    return (
      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
        <select value={rule.field} onChange={(e) => handleFieldChange(e.target.value)} className="p-2 border rounded bg-white">{Object.entries(fieldConfig).map(([key, config]) => <option key={key} value={key}>{config.label}</option>)}</select>
        <select value={rule.operator} onChange={(e) => onUpdate({ ...rule, operator: e.target.value })} className="p-2 border rounded bg-white">{availableOperators.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}</select>
        {renderValueInput()}
        <button onClick={onRemove} className="text-gray-400 hover:text-red-500"><TrashIcon className="h-5 w-5" /></button>
      </div>
    );
}

// --- COMPONENTE PRINCIPAL ---
type BuilderProps = { value: RulesStructure; onChange: (newValue: RulesStructure) => void; dynamicOptions: Record<string, string[]>; };

export default function SegmentRuleBuilder({ value, onChange, dynamicOptions }: BuilderProps) {
  const handleGroupConditionChange = (groupIndex: number, newCondition: 'AND' | 'OR') => {
    const newGroups = value.groups.map((g, i) => i === groupIndex ? { ...g, condition: newCondition } : g);
    onChange({ ...value, groups: newGroups });
  };
  const handleAddRuleToGroup = (groupIndex: number) => {
    const newGroups = value.groups.map((g, i) => i === groupIndex ? { ...g, rules: [...g.rules, { field: 'country', operator: 'eq', value: '' }] } : g);
    onChange({ ...value, groups: newGroups });
  };
  const handleRemoveRule = (groupIndex: number, ruleIndex: number) => {
    const newGroups = [...value.groups];
    const newRules = newGroups[groupIndex].rules.filter((_, i) => i !== ruleIndex);
    newGroups[groupIndex].rules = newRules;
    if (newGroups[groupIndex].rules.length === 0 && newGroups.length > 1) {
      onChange({ ...value, groups: newGroups.filter((_, i) => i !== groupIndex) });
    } else {
      onChange({ ...value, groups: newGroups });
    }
  };
  const handleUpdateRule = (groupIndex: number, ruleIndex: number, updatedRule: Rule) => {
    const newGroups = [...value.groups];
    newGroups[groupIndex].rules[ruleIndex] = updatedRule;
    onChange({ ...value, groups: newGroups });
  };
  const handleAddGroup = () => {
    const newGroup: RuleGroup = { condition: 'AND', rules: [{ field: 'country', operator: 'eq', value: '' }] };
    onChange({ ...value, groups: [...value.groups, newGroup] });
  };
  const handleTopLevelConditionChange = (newCondition: 'AND' | 'OR') => {
    onChange({ ...value, condition: newCondition });
  };

  return (
    <div className="space-y-4">
      {value.groups.map((group, groupIndex) => (
        <div key={groupIndex}>
          <div className="bg-white p-4 rounded-lg border space-y-3">
            {group.rules.map((rule, ruleIndex) => (
              <RuleRow
                key={ruleIndex}
                rule={rule}
                onUpdate={(updatedRule: Rule) => handleUpdateRule(groupIndex, ruleIndex, updatedRule)}
                onRemove={() => handleRemoveRule(groupIndex, ruleIndex)}
                dynamicOptions={dynamicOptions[rule.field] || []}
              />
            ))}
             <div className="flex items-center justify-between mt-3">
                <button onClick={() => handleAddRuleToGroup(groupIndex)} className="flex items-center text-xs text-blue-600"><PlusCircleIcon className="h-4 w-4 mr-1" />Añadir Regla</button>
                <div className="flex items-center text-xs">
                  <span>Coincidir con:</span>
                  <select value={group.condition} onChange={(e) => handleGroupConditionChange(groupIndex, e.target.value as 'AND' | 'OR')} className="ml-2 border-none bg-transparent font-semibold text-xs p-1 rounded">
                    <option value="AND">Todas (Y)</option>
                    <option value="OR">Cualquiera (O)</option>
                  </select>
                </div>
            </div>
          </div>
          {groupIndex < value.groups.length - 1 && (
            <div className="flex justify-center my-2">
              <select value={value.condition} onChange={(e) => handleTopLevelConditionChange(e.target.value as 'AND' | 'OR')} className="border-gray-300 rounded-full font-bold text-xs p-1">
                <option value="AND">Y</option>
                <option value="OR">O</option>
              </select>
            </div>
          )}
        </div>
      ))}
      <button onClick={handleAddGroup} className="flex items-center text-sm text-blue-600 font-semibold hover:text-blue-800">
          <PlusCircleIcon className="h-5 w-5 mr-1" />
          Añadir Grupo de Condiciones
      </button>
    </div>
  );
}