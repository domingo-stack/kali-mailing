'use client'

import React from 'react'

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode; // El contenido que irá dentro del modal
};

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) {
    return null; // Si no está abierto, no renderiza nada
  }

  return (
    // Fondo oscuro semitransparente
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      {/* Contenedor del modal */}
      <div className="bg-white rounded-lg shadow-xl p-6 relative w-full max-w-lg">
        {/* Botón de cierre (X) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* Aquí se renderizará el contenido que le pasemos (ej: el formulario de edición) */}
        {children}
      </div>
    </div>
  );
}