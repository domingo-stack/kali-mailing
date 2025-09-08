// components/icons/TrashIcon.tsx

import React from 'react';

// Definimos las propiedades que nuestro ícono puede recibir.
// 'className' nos permitirá cambiar su tamaño, color, etc., desde fuera.
interface IconProps extends React.SVGProps<SVGSVGElement> {}

export const TrashIcon = ({ className, ...props }: IconProps) => {
  return (
    // Pega aquí el código <svg> que copiaste en el paso 1.
    // IMPORTANTE: Asegúrate de que el SVG tenga la propiedad 'className={className}'.
    
    // EJEMPLO:
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
  );
};