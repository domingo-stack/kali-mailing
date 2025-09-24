'use client';

import React from 'react';
// ARREGLO: Importamos los tipos necesarios directamente desde la librería y su sub-ruta de tipos.
import EmailEditor, { EditorRef, EmailEditorProps } from 'react-email-editor';
import { Editor } from 'react-email-editor/dist/types';

// Nota: El tipo para el diseño JSON es simplemente un objeto genérico.
// Esto nos da flexibilidad y evita errores de importación.
// Let's define our Props type. 
// "onDesignUpdate" is a function you can give if you want to do something when the design changes.
// "initialJson" is the starting design, and it's just a regular object (we'll use "any" for flexibility).
type Props = {
  onDesignUpdate?: () => void;
  initialJson?: any | null;
};

// Here we make our MyEmailEditor component. 
// It can use a special "ref" to talk to the editor, and it takes our Props.
const MyEmailEditor = React.forwardRef<EditorRef, Props>(({ onDesignUpdate, initialJson }, ref) => {
  // ARREGLO: Tipamos 'unlayer' correctamente para que TypeScript sepa qué es.
  const onReady: EmailEditorProps['onReady'] = (unlayer: Editor) => {
    // Carga el diseño guardado si existe.
    if (initialJson && Object.keys(initialJson).length > 0) {
      unlayer.loadDesign(initialJson);
    }
    
    // Escucha los cambios en el diseño para activar el autoguardado.
    if (onDesignUpdate) {
      unlayer.addEventListener('design:updated', onDesignUpdate);
    }
  };

  return (
    <EmailEditor
      ref={ref}
      onReady={onReady}
      minHeight="100vh" // Ocupa toda la altura disponible
    />
  );
});

MyEmailEditor.displayName = 'MyEmailEditor';
export default MyEmailEditor;

