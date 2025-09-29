'use client'
import { useState } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (inputValue: string) => void;
  title: string;
  message: string;
  isActioning?: boolean;
};

export default function InputModal({ isOpen, onClose, onConfirm, title, message, isActioning = false }: Props) {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (inputValue.trim()) {
      onConfirm(inputValue);
    } else {
      alert('Por favor, ingresa un nombre.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <p className="mt-2 text-gray-600">{message}</p>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="mt-4 w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="Escribe el nuevo nombre aquí..."
        />
        <div className="mt-6 flex justify-end space-x-4">
          <button onClick={onClose} disabled={isActioning} className="px-4 py-2 bg-gray-200 rounded-lg">Cancelar</button>
          <button onClick={handleConfirm} disabled={isActioning} className="px-4 py-2 text-white bg-blue-600 rounded-lg">
            {isActioning ? 'Duplicando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}