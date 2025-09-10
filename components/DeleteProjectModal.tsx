// components/DeleteProjectModal.tsx
'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Project } from '@/lib/types';
import { TrashIcon } from '@/components/icons/TrashIcon';

type DeleteProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  // El proyecto que queremos eliminar
  projectToDelete: Project | null;
  // La lista de todos los demás proyectos para la opción de migrar
  allProjects: Project[];
  // Función para refrescar los datos en la página principal después de borrar
  onProjectDeleted: () => void;
};

export default function DeleteProjectModal({
  isOpen,
  onClose,
  projectToDelete,
  allProjects,
  onProjectDeleted,
}: DeleteProjectModalProps) {
  // Estado para saber qué opción eligió el usuario: 'delete' o 'migrate'
  const [deleteOption, setDeleteOption] = useState<'delete' | 'migrate'>('delete');
  // Estado para guardar a qué proyecto se van a migrar las tareas
  const [destinationProjectId, setDestinationProjectId] = useState<string>('');
  // Estado para el botón de confirmación
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useAuth();


  // Reiniciar el estado del modal cada vez que se abre
  useEffect(() => {
    if (isOpen) {
      setDeleteOption('delete');
      setDestinationProjectId('');
      setIsDeleting(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !projectToDelete) return null;

  // Filtramos la lista de proyectos para el dropdown, quitando el que vamos a borrar
  const availableProjectsForMigration = allProjects.filter(
    (p) => p.id !== projectToDelete.id
  );

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setError(null);

    if (deleteOption === 'delete') {
      // Opción 1: Borrar todo
      const { error } = await supabase.rpc('delete_project_and_tasks', {
        project_id_to_delete: projectToDelete.id,
      });

      if (error) {
        setError(`Error al eliminar: ${error.message}`);
        setIsDeleting(false);
      } else {
        onProjectDeleted(); // Refresca los datos en la página
        onClose(); // Cierra el modal
      }
    } else {
      // Opción 2: Migrar y luego borrar
      if (!destinationProjectId) {
        setError('Por favor, selecciona un proyecto de destino.');
        setIsDeleting(false);
        return;
      }
      
      const { error } = await supabase.rpc('migrate_tasks_and_delete_project', {
        source_project_id: projectToDelete.id,
        destination_project_id: Number(destinationProjectId),
      });

      if (error) {
        setError(`Error al migrar: ${error.message}`);
        setIsDeleting(false);
      } else {
        onProjectDeleted();
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-2">Eliminar Proyecto</h2>
        <p className="mb-4 text-gray-600">
          Estás a punto de eliminar el proyecto: <strong className="text-red-600">{projectToDelete.name}</strong>.
          Esta acción no se puede deshacer.
        </p>

        {/* Opciones de Borrado */}
        <div className="space-y-4">
          <label className="flex items-center p-3 border rounded-md has-[:checked]:bg-red-50 has-[:checked]:border-red-400">
            <input
              type="radio"
              name="deleteOption"
              value="delete"
              checked={deleteOption === 'delete'}
              onChange={() => setDeleteOption('delete')}
              className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
            />
            <span className="ml-3 text-sm">
              <strong className="block">Eliminar todo permanentemente</strong>
              Se borrarán el proyecto y todas sus tareas asociadas.
            </span>
          </label>

          <label className="flex items-center p-3 border rounded-md has-[:checked]:bg-blue-50 has-[:checked]:border-blue-400">
            <input
              type="radio"
              name="deleteOption"
              value="migrate"
              checked={deleteOption === 'migrate'}
              onChange={() => setDeleteOption('migrate')}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              disabled={availableProjectsForMigration.length === 0}
            />
            <span className="ml-3 text-sm">
              <strong className="block">Mover tareas y eliminar proyecto</strong>
              Las tareas se moverán a otro proyecto antes de eliminar este.
            </span>
          </label>
          
          {/* Dropdown para migrar, solo visible si se elige esa opción */}
          {deleteOption === 'migrate' && (
            <div className="pl-4">
              <select
                value={destinationProjectId}
                onChange={(e) => setDestinationProjectId(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona un proyecto de destino...</option>
                {availableProjectsForMigration.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

        {/* Botones de Acción */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md text-sm font-semibold hover:bg-gray-300"
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 disabled:bg-red-300 flex items-center"
            disabled={isDeleting || (deleteOption === 'migrate' && !destinationProjectId)}
          >
            <TrashIcon className="w-4 h-4 mr-2"/>
            {isDeleting ? 'Eliminando...' : 'Confirmar Eliminación'}
          </button>
        </div>
      </div>
    </div>
  );
}