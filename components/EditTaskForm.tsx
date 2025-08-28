'use client'

import { useEffect, useState } from 'react'

// Tipos de datos que usa este componente
type Project = {
  id: number;
  name: string;
};

type Task = {
  id: number;
  title: string;
  due_date: string | null;
  completed: boolean;
  user_responsible: string | null;
  projects: {
    id: number;
    name: string;
  } | null;
};

// Las propiedades que recibe el formulario de edición
type EditTaskFormProps = {
  task: Task;
  projects: Project[];
  onSave: (updatedData: {
      title: string;
      due_date: string | null;
      project_id: number | null;
      user_responsible: string | null;
  }) => Promise<void>;
  onCancel: () => void;
};

export default function EditTaskForm({ task, projects, onSave, onCancel }: EditTaskFormProps) {
  const [title, setTitle] = useState(task.title);
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : '');
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>(task.projects?.id || '');
  const [responsible, setResponsible] = useState(task.user_responsible || '');

  useEffect(() => {
    setTitle(task.title);
    setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
    setSelectedProjectId(task.projects?.id || '');
    setResponsible(task.user_responsible || '');
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedData = {
      title: title.trim(),
      due_date: dueDate === '' ? null : dueDate,
      project_id: selectedProjectId === '' ? null : Number(selectedProjectId),
      user_responsible: responsible.trim() === '' ? null : responsible.trim()
    };
    await onSave(updatedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título de la Tarea</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="responsible" className="block text-sm font-medium text-gray-700">Responsable</label>
        <input
          type="text"
          id="responsible"
          value={responsible}
          onChange={(e) => setResponsible(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="project" className="block text-sm font-medium text-gray-700">Proyecto</label>
        <select
          id="project"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(Number(e.target.value))}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">Sin Proyecto</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">Fecha de Entrega</label>
        <input
          type="date"
          id="due_date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none"
        >
          Guardar Cambios
        </button>
      </div>
    </form>
  );
}