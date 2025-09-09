'use client'

import React from 'react'

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  // Esta función detiene el clic para que no se propague al fondo
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    // Fondo oscuro - AHORA CIERRA EL MODAL AL HACER CLIC
    <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-start p-4 pt-16 sm:pt-24">
      {/* Contenedor del modal - AHORA EVITA QUE SE CIERRE AL HACER CLIC DENTRO */}
      <div onClick={handleContentClick} className="bg-white rounded-lg shadow-xl relative w-full max-w-2xl flex flex-col max-h-[85vh]">
        <div className="overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}