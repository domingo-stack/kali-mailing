// En: components/ImportContactsModal.tsx
'use client'

import { useState, useEffect, ChangeEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import Papa from 'papaparse';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
};

type ContactData = { [key: string]: any };

const BATCH_SIZE = 100;

export default function ImportContactsModal({ isOpen, onClose, onImportSuccess }: Props) {
  const { supabase, user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  
  // --- NUEVOS ESTADOS PARA CONTROLAR EL PROCESO ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [contactsToProcess, setContactsToProcess] = useState<ContactData[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [totalContacts, setTotalContacts] = useState(0);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  // --- 1. La función 'handleImport' ahora solo inicia el proceso ---
  const handleImport = () => {
    if (!file) return;
    setIsProcessing(true);
    setMessage('Leyendo archivo...');
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as ContactData[];
        setTotalContacts(data.length);
        setContactsToProcess(data);
        setCurrentBatchIndex(0); // Esto disparará el useEffect de abajo
      },
      error: (err) => {
        setIsProcessing(false);
        alert(`Error al leer el archivo CSV: ${err.message}`);
      }
    });
  };
  
  // --- 2. Este useEffect es el "motor" que procesa los lotes uno por uno ---
  useEffect(() => {
    // Si no estamos procesando o no hay contactos, no hacemos nada.
    if (!isProcessing || contactsToProcess.length === 0 || !supabase || !user) return;

    const processBatch = async () => {
      const from = currentBatchIndex * BATCH_SIZE;
      const to = from + BATCH_SIZE;
      const batch = contactsToProcess.slice(from, to);

      if (batch.length === 0) {
        // Hemos terminado
        setMessage('¡Importación completada con éxito!');
        setTimeout(() => { // Damos tiempo para que el usuario vea el mensaje final
            alert('¡Importación completada!');
            onImportSuccess();
            handleClose();
        }, 1000);
        return;
      }
      
      setMessage(`Procesando lote ${currentBatchIndex + 1}... (${from + batch.length} de ${totalContacts})`);

      const validContacts = batch
        .filter(c => c.email && c.email.includes('@'))
        .map(c => ({
            email: c.email,
            first_name: c.first_name || null,
            last_name: c.last_name || null,
            status: c.status || 'Subscribed',
            city: c.city || null,
            country: c.country || null,
            subscription_type: ['Gratuito', 'Mensual', 'Anual', 'Cancelado'].includes(c.subscription_type) 
                ? c.subscription_type : 'Gratuito',
            user_id: user.id,
        }));

      if (validContacts.length > 0) {
        const { error } = await supabase.from('contacts').upsert(validContacts, { onConflict: 'user_id, email' });
        if (error) {
          throw new Error(`Error en el lote ${currentBatchIndex + 1}: ${error.message}`);
        }
      }
      
      // Pasamos al siguiente lote
      setCurrentBatchIndex(currentBatchIndex + 1);
    };

    processBatch().catch(err => {
      alert(`Error durante la importación: ${(err as Error).message}`);
      handleClose();
    });

  }, [isProcessing, contactsToProcess, currentBatchIndex, supabase, user]);

  const handleClose = () => {
    setIsProcessing(false);
    setContactsToProcess([]);
    setCurrentBatchIndex(0);
    setTotalContacts(0);
    setFile(null);
    onClose();
  };

  if (!isOpen) return null;

  const progress = totalContacts > 0 ? Math.round(((currentBatchIndex * BATCH_SIZE) / totalContacts) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-[#383838] mb-4">Importar Contactos</h2>
        {!isProcessing && contactsToProcess.length === 0 ? (
          <>
            <p className="text-gray-600 mb-6">Selecciona un archivo .csv. <a href="/contacts_template.csv" download className="text-[#ff8080] font-semibold">Descargar plantilla.</a></p>
            <input type="file" accept=".csv" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#ff8080] file:text-white"/>
            {file && <p className="text-sm text-gray-500 mt-3">Archivo: {file.name}</p>}
          </>
        ) : (
          <div className="text-center">
            <p className="text-lg font-semibold">{message}</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
              <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progress > 100 ? 100 : progress}%` }}></div>
            </div>
          </div>
        )}
        <div className="flex justify-end space-x-4 mt-8">
          <button onClick={handleClose} disabled={isProcessing} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg">Cancelar</button>
          <button onClick={handleImport} disabled={isProcessing || !file} className="px-4 py-2 text-sm font-medium text-white bg-[#3c527a] rounded-lg disabled:opacity-50">
            {isProcessing ? 'Procesando...' : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  );
}