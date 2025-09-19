// components/ImportContactsModal.tsx
'use client'

import { useState, ChangeEvent } from 'react';
import Papa from 'papaparse';
import { useAuth } from '@/context/AuthContext'; // <-- 1. IMPORTAMOS useAuth

export default function ImportContactsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { supabase } = useAuth(); // <-- 2. OBTENEMOS EL CLIENTE DE SUPABASE
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleImport = () => {
    if (!file) {
      alert('Por favor, selecciona un archivo CSV.');
      return;
    }
    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const contactsToImport = results.data;
        
        // --- 3. INVOCAMOS LA EDGE FUNCTION ---
        const { data, error } = await supabase.functions.invoke('import-contacts', {
          body: { contacts: contactsToImport },
        });

        if (error) {
          console.error("Error al invocar la función:", error);
          alert(`Error al importar: ${error.message}`);
        } else {
          console.log("Respuesta de la función:", data);
          alert(data.message || 'Importación completada.');
          window.location.reload(); // Recargamos la página para ver los nuevos contactos
        }
        
        setIsProcessing(false);
        onClose();
        // --- FIN DE LA LLAMADA A LA FUNCIÓN ---
      },
      error: (error) => {
        setIsProcessing(false);
        console.error("Error al procesar el CSV:", error);
        alert("Hubo un error al leer el archivo CSV.");
      }
    });
  };

  if (!isOpen) return null;

  return (
    // ... (El JSX del modal se queda exactamente igual que antes)
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-[#383838] mb-4">Importar Contactos desde CSV</h2>
        <p className="text-gray-600 mb-6">
          Selecciona un archivo .csv para subir tus contactos. 
          <a href="/contacts_template.csv" download className="text-[#ff8080] font-semibold hover:underline ml-1">
            Descargar plantilla de ejemplo.
          </a>
        </p>
        <input type="file" accept=".csv" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#ff8080] file:text-white hover:file:opacity-90"/>
        {file && <p className="text-sm text-gray-500 mt-3">Archivo: {file.name}</p>}
        <div className="flex justify-end space-x-4 mt-8">
          <button onClick={onClose} disabled={isProcessing} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50">Cancelar</button>
          <button onClick={handleImport} disabled={isProcessing} className="px-4 py-2 text-sm font-medium text-white bg-[#3c527a] rounded-lg hover:opacity-90 disabled:opacity-50">
            {isProcessing ? 'Procesando...' : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  );
}