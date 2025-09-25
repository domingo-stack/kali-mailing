'use client';

import React from 'react';
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

const mergeTags = {
  first_name: {
    name: "Nombre",
    value: "{{first_name}}"
  },
  last_name: {
    name: "Apellido",
    value: "{{last_name}}"
  },
  email: {
    name: "Email",
    value: "{{email}}"
  },
  country: {
    name: "País",
    value: "{{country}}"
  },
  city: {
    name: "Ciudad",
    value: "{{city}}"
  }
};

// Here we make our MyEmailEditor component. 
// It can use a special "ref" to talk to the editor, and it takes our Props.
const MyEmailEditor = React.forwardRef<EditorRef, Props>(({ onDesignUpdate, initialJson }, ref) => {
  const onReady: EmailEditorProps['onReady'] = (unlayer: Editor) => {
    // Carga el diseño guardado si existe.
    if (initialJson && Object.keys(initialJson).length > 0) {
      unlayer.loadDesign(initialJson);
    }
    if (onDesignUpdate) {
      unlayer.addEventListener('design:updated', onDesignUpdate);
    }
  };

  return (
    <EmailEditor
      ref={ref}
      onReady={onReady}
      minHeight="100vh" // Ocupa toda la altura disponible
      options={{
        mergeTags,
      }}
    />
  );
});

MyEmailEditor.displayName = 'MyEmailEditor';
export default MyEmailEditor;

