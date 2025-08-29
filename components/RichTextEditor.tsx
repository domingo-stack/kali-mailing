'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

// La barra de herramientas para el editor
const Toolbar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="border border-gray-300 rounded-t-md p-2 flex items-center space-x-2 bg-gray-50">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-gray-300 p-1 rounded' : 'p-1'}>
        <strong>B</strong>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-gray-300 p-1 rounded' : 'p-1'}>
        <em>I</em>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-gray-300 p-1 rounded' : 'p-1'}>
        ●
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'bg-gray-300 p-1 rounded' : 'p-1'}>
        1.
      </button>
    </div>
  )
}

// El componente del editor
const RichTextEditor = ({ content, onChange, disabled }: { content: string, onChange: (newContent: string) => void, disabled: boolean }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    editable: !disabled,
    // --- LA LÍNEA QUE ARREGLA EL ERROR ---
    immediatelyRender: false, 
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent 
        editor={editor} 
        className={`border border-t-0 border-gray-300 rounded-b-md p-3 min-h-[150px] prose max-w-none ${disabled ? 'bg-gray-100' : ''}`} 
      />
    </div>
  )
}

export default RichTextEditor