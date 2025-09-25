// En: components/ImportContactsModal.tsx
'use client'

import { useState, ChangeEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import Papa from 'papaparse';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void; // Usaremos esto para refrescar
};

const BATCH_SIZE = 100; // Enviaremos los contactos en lotes de 100

export default function ImportContactsModal({ isOpen, onClose, onImportSuccess }: Props) {
  const { supabase, user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0); // Para la barra de progreso
  const [message, setMessage] = useState(''); // Para mensajes al usuario

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!file || !supabase || !user) return;
    
    setIsProcessing(true);
    setProgress(0);
    setMessage('Procesando archivo CSV...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const allContacts = results.data as any[];
          const totalContacts = allContacts.length;
          if (totalContacts === 0) throw new Error("El archivo no contiene contactos.");
          
          setMessage(`Se encontraron ${totalContacts} contactos. Iniciando importación...`);

          // Procesamiento por lotes
          for (let i = 0; i < totalContacts; i += BATCH_SIZE) {
            const batch = allContacts.slice(i, i + BATCH_SIZE);
            
            const validContacts = batch
              .filter(c => c.email && c.email.includes('@'))
              .map(c => ({
                ...c,
                user_id: user.id,
                status: c.status || 'Subscribed',
                // Manejo de 'subscription_type' con nuestro ENUM
                subscription_type: ['Gratuito', 'Mensual', 'Anual', 'Cancelado'].includes(c.subscription_type) 
                  ? c.subscription_type 
                  : 'Gratuito',
              }));

            if (validContacts.length > 0) {
              const { error } = await supabase.from('contacts').upsert(validContacts, { onConflict: 'user_id, email' });
              if (error) {
                // Si un lote falla, nos detenemos y mostramos el error
                throw new Error(`Error en el lote ${i / BATCH_SIZE + 1}: ${error.message}`);
              }
            }
            
            // Actualizamos el progreso
            const newProgress = Math.round(((i + BATCH_SIZE) / totalContacts) * 100);
            setProgress(newProgress > 100 ? 100 : newProgress);
            setMessage(`Importando... ${i + BATCH_SIZE > totalContacts ? totalContacts : i + BATCH_SIZE} de ${totalContacts} contactos.`);
          }
          
          alert('¡Importación completada con éxito!');
          onImportSuccess(); // Refrescamos la lista de contactos en la página principal
          onClose(); // Cerramos el modal

        } catch (err) {
          alert(`Error durante la importación: ${(err as Error).message}`);
        } finally {
          setIsProcessing(false);
          setProgress(0);
          setFile(null);
          setMessage('');
        }
      },
      error: (err) => {
        setIsProcessing(false);
        alert(`Error al leer el archivo CSV: ${err.message}`);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-[#383838] mb-4">Importar Contactos</h2>
        {!isProcessing ? (
          <>
            <p className="text-gray-600 mb-6">
              Selecciona un archivo .csv. <a href="/contacts_template.csv" download className="text-[#ff8080] font-semibold">Descargar plantilla.</a>
            </p>
            <input type="file" accept=".csv" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#ff8080] file:text-white"/>
            {file && <p className="text-sm text-gray-500 mt-3">Archivo: {file.name}</p>}
          </>
        ) : (
          <div className="text-center">
            <p className="text-lg font-semibold">{message}</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
              <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}
        <div className="flex justify-end space-x-4 mt-8">
          <button onClick={onClose} disabled={isProcessing} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg">Cancelar</button>
          <button onClick={handleImport} disabled={isProcessing || !file} className="px-4 py-2 text-sm font-medium text-white bg-[#3c527a] rounded-lg disabled:opacity-50">
            {isProcessing ? 'Procesando...' : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  );
}