'use client'

import { useState } from 'react'

type Project = {
  id: number;
  name: string;
};

type AddTaskFormProps = {
  onAddTask: (taskData: { 
    title: string; 
    projectId: number | null; 
    dueDate: string | null; 
    responsible: string | null 
  }) => Promise<void>;
  projects: Project[];
};

export default function AddTaskForm({ onAddTask, projects }: AddTaskFormProps) {
  const [title, setTitle] = useState('');
  const [selectedProject, setSelectedProject] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [responsible, setResponsible] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const taskData = {
        title: title.trim(),
        projectId: selectedProject === '' ? null : Number(selectedProject),
        dueDate: dueDate === '' ? null : dueDate,
        responsible: responsible.trim() === '' ? null : responsible.trim()
      };
      await onAddTask(taskData);
      
      setTitle('');
      setSelectedProject('');
      setDueDate('');
      setResponsible('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col gap-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="¿Qué necesitas hacer?"
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 items-center gap-4">
          <input
            type="text"
            value={responsible}
            onChange={(e) => setResponsible(e.target.value)}
            placeholder="Responsable (ej: CEO)"
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(Number(e.target.value))}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Sin Proyecto</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Añadir Tarea
          </button>
        </div>
      </div>
    </form>
  );
}