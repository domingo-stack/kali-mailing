'use client'

import { useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'

type Project = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
    } else if (data) {
      setProjects(data as Project[]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAddProject = async (e: FormEvent) => {
    e.preventDefault();
    if (newName.trim() === '') return;

    const { error } = await supabase.rpc('insert_project', {
      new_name: newName.trim(),
      new_description: newDescription.trim() === '' ? null : newDescription.trim()
    });

    if (error) {
      console.error('Error adding project via RPC:', error);
    } else {
      setNewName('');
      setNewDescription('');
      await fetchProjects();
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Gestión de Proyectos</h1>

        <form onSubmit={handleAddProject} className="mb-8 p-4 bg-white rounded-lg shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-xl font-semibold">Crear Nuevo Proyecto</h2>
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">Nombre del Proyecto</label>
            <input
              id="projectName"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              placeholder="Ej: Lanzamiento Q4"
              required
            />
          </div>
          <div>
            <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700">Descripción (Opcional)</label>
            <textarea
              id="projectDescription"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              placeholder="Describe brevemente el objetivo del proyecto"
            ></textarea>
          </div>
          <div className="text-right">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700">
              Crear Proyecto
            </button>
          </div>
        </form>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Proyectos Existentes</h2>
          {loading ? (
            <p>Cargando proyectos...</p>
          ) : (
            <ul className="space-y-3">
              {projects.map(project => (
                <li key={project.id}>
                  <Link href={`/projects/${project.id}`} className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <h3 className="font-bold text-lg text-blue-600">{project.name}</h3>
                    <p className="text-gray-600 text-sm">{project.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}