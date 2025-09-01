'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

// La barra de herramientas para el editor
const Toolbar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  const buttonClass = (isActive: boolean) => 
    `p-2 rounded-md transition-colors ${isActive ? 'bg-gray-300' : 'hover:bg-gray-200'}`;

  return (
    <div className="border border-gray-300 rounded-t-lg p-2 flex items-center flex-wrap gap-2 bg-gray-50">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={buttonClass(editor.isActive('bold'))}>
        <span className="font-bold">B</span>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={buttonClass(editor.isActive('italic'))}>
        <span className="italic">I</span>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={buttonClass(editor.isActive('bulletList'))}>
        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={buttonClass(editor.isActive('orderedList'))}>
        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
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
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        // Añadimos las clases de prose para que tailwind aplique los estilos
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none',
      },
    }
  })

  return (
    <div className={`border border-gray-300 rounded-lg ${disabled ? 'bg-gray-100' : 'bg-white'}`}>
      {!disabled && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  )
}

export default RichTextEditor