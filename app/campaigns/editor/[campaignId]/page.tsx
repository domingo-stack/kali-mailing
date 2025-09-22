// app/campaigns/editor/[campaignId]/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { Menu, Transition } from '@headlessui/react'; // <-- IMPORTAMOS DE HEADLESS UI
import { ChevronDownIcon } from '@heroicons/react/20/solid';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image'
import CampaignSettingsPanel from '@/components/CampaignSettingsPanel';

type Campaign = { id: number; name: string; subject: string; preheader: string; html_content: string | null; };
type Segment = { id: number; name: string; };
type CampaignDetails = { name: string; subject: string; preheader: string; };

const MenuBar = ({ editor, onImageUploadClick, contactColumns }: { editor: any, onImageUploadClick: () => void, contactColumns: string[] }) => {
  if (!editor) return null;

  return (
    <div className="flex items-center space-x-1 p-2 bg-gray-100 rounded-t-lg border-b border-gray-300">
      {/* Botones de formato */}
      <button onClick={() => editor.chain().focus().toggleBold().run()} className="p-2 rounded hover:bg-gray-200"><b>B</b></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className="p-2 rounded hover:bg-gray-200"><i>I</i></button>
      <button onClick={onImageUploadClick} className="p-2 rounded hover:bg-gray-200 font-medium text-sm">Imagen</button>
      
      {/* Menú de Variables */}
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Variables
            <ChevronDownIcon className="ml-2 -mr-1 h-5 w-5 text-gray-400" />
          </Menu.Button>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute left-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
            <div className="px-1 py-1 ">
              {contactColumns.map(column => (
                <Menu.Item key={column}>
                  {({ active }) => (
                    <button
                      onClick={() => editor.chain().focus().insertContent(`{{${column}}}`).run()}
                      className={`${active ? 'bg-[#ff8080] text-white' : 'text-gray-900'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    >
                      {column}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
};

export default function CampaignEditorPage() {
  const { supabase, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const campaignId = params.campaignId as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editDetails, setEditDetails] = useState<CampaignDetails>({ name: '', subject: '', preheader: '' });
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [testEmail, setTestEmail] = useState(user?.email || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const contactColumns = ['email', 'first_name', 'last_name', 'city', 'country', 'status'];

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose max-w-none p-4 min-h-[400px] overflow-y-auto border-x border-b border-gray-300 rounded-b-lg focus:outline-none bg-white',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase || !campaignId) return;
      setIsLoading(true);

      const { data: campaignData, error: campaignError } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
      if (campaignError) {
        router.push('/campaigns');
        return;
      }
      
      setCampaign(campaignData);
      setEditDetails({ name: campaignData.name, subject: campaignData.subject, preheader: campaignData.preheader });
      editor?.commands.setContent(campaignData.html_content || '');
      
      const { data: segmentsData } = await supabase.from('segments').select('id, name');
      setSegments(segmentsData || []);
      
      setIsLoading(false);
    };
    fetchData();
  }, [supabase, campaignId, editor, router]);

  const handleSaveChanges = async () => {
    if (!editor || !campaign) return;
    setIsSaving(true);
    
    const html = editor.getHTML();
    
    const { error } = await supabase
      .from('campaigns')
      .update({
        name: editDetails.name,
        subject: editDetails.subject,
        preheader: editDetails.preheader,
        html_content: html 
      })
      .eq('id', campaign.id);

    if (error) alert('Error al guardar los cambios.');
    else alert('Cambios guardados con éxito.');
    
    setIsSaving(false);
  };
  
  const handleDetailsChange = (field: keyof CampaignDetails, value: string) => {
    setEditDetails(prev => ({ ...prev, [field]: value }));
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !supabase || !editor) return;

    const file = event.target.files[0];
    const fileName = `${Date.now()}_${file.name}`;
    const bucket = 'campaign_images';

    // Subimos el archivo a Supabase Storage
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) {
      alert('Error al subir la imagen.');
      console.error(error);
      return;
    }
     // Obtenemos la URL pública de la imagen que acabamos de subir
     const { data } = supabase.storage
     .from(bucket)
     .getPublicUrl(fileName);
   
   // Insertamos la imagen en el editor usando la URL pública
   if (data.publicUrl) {
     editor.chain().focus().setImage({ src: data.publicUrl }).run();
   }
 };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <CampaignSettingsPanel
        details={editDetails}
        onDetailsChange={handleDetailsChange}
        segments={segments}
        selectedSegment={selectedSegment}
        onSegmentChange={setSelectedSegment}
        testEmail={testEmail}
        onTestEmailChange={setTestEmail}
        onSendTest={() => {}}
        onSendCampaign={() => {}}
        isSending={false}
      />

      <main className="flex-1 flex flex-col p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-[#383838]">Editando: {editDetails.name}</h1>
          <button 
            onClick={handleSaveChanges} 
            disabled={isSaving} 
            className="bg-[#3c527a] text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm flex-grow flex flex-col">
        <MenuBar editor={editor} onImageUploadClick={() => fileInputRef.current?.click()} contactColumns={contactColumns} />
          <EditorContent editor={editor} className="flex-grow"/>
        </div>
        <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
              accept="image/png, image/jpeg, image/gif"
            />
      </main>
    </div>
  );
}