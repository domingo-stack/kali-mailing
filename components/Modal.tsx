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

  return (
    // Fondo oscuro
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-start p-4 pt-16 sm:pt-24">
      {/* Contenedor del modal */}
      <div className="bg-white rounded-lg shadow-xl relative w-full max-w-2xl flex flex-col max-h-[85vh]">
        {/* Botón de cierre (X) ahora está DENTRO del contenido que pasemos */}
        <div className="overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}