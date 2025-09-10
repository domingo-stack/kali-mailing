// components/ProjectDriveLink.tsx
'use client'

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FolderIcon, XMarkIcon } from '@heroicons/react/24/outline';

type ProjectDriveLinkProps = {
  projectId: number;
  driveUrl: string | null | undefined;
  onLinkUpdate: () => void; // Función para refrescar los datos en la página padre
};

export default function ProjectDriveLink({ projectId, driveUrl, onLinkUpdate }: ProjectDriveLinkProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLink, setCurrentLink] = useState(driveUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const { supabase } = useAuth();

  const handleSave = async () => {
    if (!supabase) return; // Nos aseguramos de que supabase esté disponible
    setIsSaving(true);
    const { error } = await supabase.rpc('update_project_drive_url', {
      p_project_id: projectId,
      p_drive_url: currentLink,
    });
    if (error) {
      alert(`Error al guardar el enlace: ${error.message}`);
    } else {
      onLinkUpdate();
      setIsOpen(false);
    }
    setIsSaving(false);
  };
  return (
    <div className="relative">
      {/* El ícono de la carpeta que cambia de color */}
      <button
        onClick={() => setIsOpen(true)}
        title="Enlace a Google Drive"
        className={`p-2 rounded-full transition-colors ${
          driveUrl ? 'text-green-500 hover:bg-green-100' : 'text-red-500 hover:bg-red-100'
        }`}
      >
        <FolderIcon className="w-5 h-5" />
      </button>

      {/* El pop-up que aparece al hacer clic */}
      {isOpen && (
        <div className="absolute right-0 top-10 w-72 bg-white rounded-lg shadow-xl border z-20 p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-sm">Enlace de Drive del Proyecto</h4>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
              <XMarkIcon className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">Pega la URL de la carpeta de Google Drive para este proyecto.</p>
          <input
            type="url"
            placeholder="https://drive.google.com/..."
            value={currentLink}
            onChange={(e) => setCurrentLink(e.target.value)}
            className="w-full p-2 border rounded-md text-sm mb-3"
          />
          <div className="flex justify-end gap-2">
            {driveUrl && (
                <a
                    href={driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-md text-xs font-semibold hover:bg-gray-200"
                >
                    Ir al enlace
                </a>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}