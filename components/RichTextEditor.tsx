'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

const Toolbar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  const buttonClass = (isActive: boolean) => 
    `p-2 rounded-md transition-colors ${isActive ? 'bg-gray-300' : 'hover:bg-gray-200'}`;

  return (
    <div className="border-b border-gray-300 p-2 flex items-center flex-wrap gap-2 bg-gray-50">
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

const RichTextEditor = ({ content, onChange, disabled }: { content: string, onChange: (newContent: string) => void, disabled: boolean }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    editable: !disabled,
    // --- LA CORRECCIÓN ESTÁ AQUÍ ---
    immediatelyRender: false, // Evita el error de hidratación en Next.js
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? '' : editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'min-h-[120px] w-full p-4 focus:outline-none',
      },
    }
  })

  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);
  
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${disabled ? 'bg-gray-100' : 'bg-white'}`}>
      {!disabled && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  )
}

export default RichTextEditor