// components/AddProjectForm.tsx

'use client';

import { useState } from 'react';

type AddProjectFormProps = {
  onAddProject: (projectData: { name: string; description: string | null }) => Promise<void>;
  onCancel: () => void;
};

export default function AddProjectForm({ onAddProject, onCancel }: AddProjectFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    await onAddProject({
      name: name.trim(),
      description: description.trim() === '' ? null : description.trim(),
    });
    // El modal se cierra desde el padre, no es necesario setLoading(false) aquí.
  };

  return (
    <div className="relative p-6">
      <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
  
      <h2 className="text-xl font-bold mb-4" style={{ color: '#383838' }}>Crear Nuevo Proyecto</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          {/* 👇 CAMBIO 1: Color de la etiqueta */}
          <label htmlFor="projectName" className="block text-sm font-medium" style={{ color: '#383838' }}>
            Nombre del Proyecto
          </label>
          <input
            id="projectName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            required
          />
        </div>
        <div>
          {/* 👇 CAMBIO 2: Color de la etiqueta */}
          <label htmlFor="projectDescription" className="block text-sm font-medium" style={{ color: '#383838' }}>
            Descripción (Opcional)
          </label>
          <textarea
            id="projectDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancelar
          </button>
          {/* 👇 CAMBIO 3: Botón principal usa el color de la marca */}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
            style={{
              backgroundColor: loading ? '#FCA5A5' : '#ff8080',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creando...' : 'Crear Proyecto'}
          </button>
        </div>
      </form>
    </div>
  );
}