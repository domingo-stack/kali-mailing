// app/campaigns/editor/[campaignId]/page.tsx
'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
// 1. IMPORTAMOS useParams
import { useRouter, useParams } from 'next/navigation';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

type Campaign = {
  id: number;
  name: string;
  subject: string;
  preheader: string;
  html_content: string | null;
};

type Segment = {
  id: number;
  name: string;
};

const MenuBar = ({ editor }: { editor: any }) => {
  // ... (El código de MenuBar no cambia)
  if (!editor) return null;
  return (
    <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-t-lg border-b border-gray-300">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-gray-300 p-2 rounded' : 'p-2 rounded hover:bg-gray-200'}><strong>B</strong></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-gray-300 p-2 rounded' : 'p-2 rounded hover:bg-gray-200'}><em>I</em></button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'bg-gray-300 p-2 rounded' : 'p-2 rounded hover:bg-gray-200'}><del>S</del></button>
      <button onClick={() => editor.chain().focus().setParagraph().run()} className={editor.isActive('paragraph') ? 'bg-gray-300 p-1 rounded' : 'p-1 rounded hover:bg-gray-200'}>P</button>
    </div>
  );
};

// 2. YA NO RECIBIMOS 'params' COMO ARGUMENTO
export default function CampaignEditorPage() { 
  const { supabase } = useAuth();
  const router = useRouter();
  const params = useParams(); // 3. USAMOS EL HOOK useParams
  const campaignId = params.campaignId as string; // Obtenemos el ID desde aquí

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [testEmail, setTestEmail] = useState('');

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose max-w-none p-4 h-96 overflow-y-auto border border-gray-300 rounded-b-lg focus:outline-none',
      },
    },
    // 4. AÑADIMOS LA SOLUCIÓN PARA EL ERROR DE TIPTAP
    immediatelyRender: false,
  });

  // ... (El resto del código, useEffects y handlers, no cambia)
  useEffect(() => {
    const fetchData = async () => {
      const [campaignRes, segmentsRes] = await Promise.all([
        supabase.from('campaigns').select('*').eq('id', campaignId).single(),
        supabase.from('segments').select('id, name')
      ]);

      const { data: campaignData, error: campaignError } = campaignRes;
      const { data: segmentsData, error: segmentsError } = segmentsRes;

      if (campaignError) {
        console.error('Error fetching campaign:', campaignError);
        alert('No se pudo cargar la campaña.');
        router.push('/campaigns');
        return;
      }
      if (segmentsError) {
        console.error('Error fetching segments:', segmentsError);
      }
      
      setCampaign(campaignData);
      setSegments(segmentsData || []);
      if (campaignData.html_content) {
        editor?.commands.setContent(campaignData.html_content);
      }
      setIsLoading(false);
    };

    if (supabase && campaignId && editor) { // Aseguramos que el editor esté listo
      fetchData();
    }
  }, [supabase, campaignId, router, editor]);

  const handleSaveContent = async () => {
    if (!editor || !campaign) return;
    setIsSaving(true);
    const html = editor.getHTML();
    const { error } = await supabase.from('campaigns').update({ html_content: html }).eq('id', campaign.id);
    if (error) {
      alert('Error al guardar el contenido.');
    } else {
      alert('Contenido guardado con éxito.');
    }
    setIsSaving(false);
  };
  
  const handleSendTest = () => {
    if (!testEmail) {
      alert('Por favor, ingresa un email de prueba.');
      return;
    }
    console.log(`Enviando prueba a: ${testEmail}`);
    alert(`Correo de prueba enviado a ${testEmail} (simulación).`);
  };

  const handleSendCampaign = () => {
    if (!selectedSegment) {
      alert('Por favor, selecciona un segmento de destinatarios.');
      return;
    }
    console.log(`Enviando campaña a segmento ID: ${selectedSegment}`);
    const confirmation = confirm('¿Estás seguro de que quieres enviar esta campaña a todos los contactos del segmento seleccionado?');
    if (confirmation) {
      alert('Enviando campaña... (simulación)');
    }
  };

  if (isLoading) {
    return <p>Cargando editor...</p>;
  }

  // El JSX para renderizar no cambia
  return (
    <div className="w-full space-y-8">
      <div>
        <Link href="/campaigns" className="text-gray-500 hover:text-gray-900">&larr; Volver a Campañas</Link>
        <h1 className="text-3xl font-bold text-[#383838] mt-2">Editando: {campaign?.name}</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <p className="text-lg font-semibold text-[#383838]">Paso 2: Diseña el contenido</p>
        <div className="mt-4">
          <MenuBar editor={editor} />
          <EditorContent editor={editor} />
        </div>
        <div className="flex justify-end pt-4 mt-4 border-t">
          <button onClick={handleSaveContent} disabled={isSaving} className="bg-[#3c527a] text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 disabled:opacity-50">
            {isSaving ? 'Guardando...' : 'Guardar Contenido'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <p className="text-lg font-semibold text-[#383838]">Paso 3: Envío y Prueba</p>
        <div className="mt-4">
          <label htmlFor="segment" className="block text-sm font-medium text-gray-700 mb-1">Destinatarios</label>
          <select id="segment" value={selectedSegment} onChange={(e) => setSelectedSegment(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm">
            <option value="" disabled>Selecciona un segmento...</option>
            {segments.map(segment => (
              <option key={segment.id} value={segment.id}>{segment.name}</option>
            ))}
          </select>
        </div>
        <div className="mt-6 border-t pt-6">
          <label htmlFor="test-email" className="block text-sm font-medium text-gray-700 mb-1">Enviar un correo de prueba</label>
          <div className="flex space-x-2">
            <input type="email" id="test-email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="tu@email.com" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm" />
            <button onClick={handleSendTest} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700">Enviar Prueba</button>
          </div>
        </div>
        <div className="flex justify-end pt-6 mt-6 border-t">
          <button onClick={handleSendCampaign} className="bg-[#ff8080] text-white font-bold py-3 px-8 text-lg rounded-lg hover:opacity-90">
            Revisar y Enviar Campaña
          </button>
        </div>
      </div>
    </div>
  );
}