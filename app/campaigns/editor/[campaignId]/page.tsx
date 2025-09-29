'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import CampaignSettingsPanel from '../../../../components/CampaignSettingsPanel';
import MyEmailEditor from '../../../../components/MyEmailEditor';
import { EditorRef } from 'react-email-editor';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

type Campaign = { 
  id: number; 
  name: string; 
  subject: string; 
  preheader: string;
  sender_name: string | null;
  sender_email: string | null;
  html_content: string | null;
  json_content: object | null;
};

type Sender = { id: number; name: string; email: string; };
type Segment = { id: number; name: string; };
type CampaignDetails = { name: string; subject: string; preheader: string; sender_name: string; sender_email: string; };

export default function CampaignEditorPage() {
  const { supabase, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const campaignId = params.campaignId as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editDetails, setEditDetails] = useState<CampaignDetails>({ name: '', subject: '', preheader: '', sender_name: '', sender_email: '' });
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [testEmail, setTestEmail] = useState(user?.email || '');
  
  const [saveStatus, setSaveStatus] = useState<'Guardado' | 'Guardando...' | 'Sin guardar'>('Guardado');
  const unlayerEditorRef = useRef<EditorRef>(null);
  const [editorChangeCounter, setEditorChangeCounter] = useState(0);
  const [isSendingTest, setIsSendingTest] = useState(false);
  
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [campaignSuccess, setCampaignSuccess] = useState<string | null>(null);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [isPanelVisible, setIsPanelVisible] = useState(true); 

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase || !campaignId) return;
      setIsLoading(true);
      const { data: campaignData } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
      if (campaignData) {
        setCampaign(campaignData);
        setEditDetails({ 
          name: campaignData.name, 
          subject: campaignData.subject, 
          preheader: campaignData.preheader,
          sender_name: campaignData.sender_name || '',
          sender_email: campaignData.sender_email || ''
        });
      } else {
        router.push('/campaigns');
        return;
      }
      const { data: segmentsData } = await supabase.from('segments').select('id, name');
      setSegments(segmentsData || []);
      const { data: sendersData } = await supabase.from('verified_senders').select('*');
setSenders(sendersData || []);
      setIsLoading(false);
    };
    fetchData();
  }, [supabase, campaignId, router]);

  const handleSaveChanges = useCallback(async () => {
    if (!unlayerEditorRef.current?.editor || !campaign) return;
    setSaveStatus('Guardando...');
    const data = await new Promise<{ design: object; html: string }>((resolve, reject) => {
      if (unlayerEditorRef.current?.editor) {
        unlayerEditorRef.current.editor.exportHtml(data => resolve(data));
      } else {
        reject(new Error("Editor no disponible."));
      }
    });
    const { error } = await supabase.from('campaigns').update({
      name: editDetails.name,
      subject: editDetails.subject,
      preheader: editDetails.preheader,
      sender_name: editDetails.sender_name,
      sender_email: editDetails.sender_email,
      html_content: data.html,
      json_content: data.design,
      status: 'draft',
      segment_id: selectedSegment ? parseInt(selectedSegment, 10) : null,
    }).eq('id', campaign.id);
    setSaveStatus(error ? 'Sin guardar' : 'Guardado');
  }, [supabase, campaign, editDetails]);

  useEffect(() => {
    if (saveStatus === 'Guardado') return;
    const timer = setTimeout(() => handleSaveChanges(), 2000);
    return () => clearTimeout(timer);
  }, [editDetails, editorChangeCounter, handleSaveChanges, saveStatus, selectedSegment]);
  
  useEffect(() => {
    if (isLoading === false) setSaveStatus('Sin guardar');
  }, [editDetails, editorChangeCounter, isLoading]);
  
  const handleDetailsChange = (field: keyof CampaignDetails, value: string) => {
    setEditDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleSendTest = async () => {
    if (!unlayerEditorRef.current?.editor || !testEmail || !supabase) return;
    setIsSendingTest(true);
    try {
      const data = await new Promise<{ design: object; html: string }>((resolve) => {
        unlayerEditorRef.current!.editor!.exportHtml(data => resolve(data));
      });
      const { error } = await supabase.functions.invoke('send-test-email', {
        body: { to_email: testEmail, subject: editDetails.subject, html_content: data.html, sender_name: editDetails.sender_name, sender_email: editDetails.sender_email },
      });
      if (error) throw error;
      alert(`Correo de prueba enviado con éxito a ${testEmail}`);
    } catch (error) {
      alert(`Hubo un error al enviar el correo: ${(error as Error).message}`);
    } finally {
      setIsSendingTest(false);
    }
  };
  
  const handleSendCampaign = async () => {
  if (saveStatus !== 'Guardado') {
    alert('Por favor, espera a que se guarden los cambios.');
    return;
  }
  if (!campaignId) return;

  setIsSendingCampaign(true);
  setCampaignError(null);

  try {
    // --- NUEVO PASO 1: Previsualización ---
    const { data: preview, error: previewError } = await supabase.functions.invoke('get-campaign-preview', {
      body: { campaign_id: campaignId }
    });

    if (previewError) throw new Error(`No se pudo previsualizar la campaña: ${previewError.message}`);
    
    // --- NUEVO PASO 2: Primera Confirmación (conteo) ---
    const firstConfirmation = window.confirm(
      `Esta campaña se enviará a ${preview.contactCount} contactos. ¿Quieres continuar?`
    );
    if (!firstConfirmation) {
      setIsSendingCampaign(false);
      return;
    }
    
    // --- NUEVO PASO 3: Segunda Confirmación (final) ---
    const secondConfirmation = window.confirm(
      "El proceso de envío comenzará en segundo plano y no se puede detener. ¿Estás seguro?"
    );
    if (!secondConfirmation) {
      setIsSendingCampaign(false);
      return;
    }

    // --- PASO 4: Disparamos el envío ---
    const { data, error: invokeError } = await supabase.functions.invoke('trigger-campaign', {
      body: { campaign_id: campaignId },
    });
    
    if (invokeError) throw new Error(`Error al encolar la campaña: ${invokeError.message}`);
    
    alert(data.message || '¡Campaña puesta en cola para envío!');
    router.push('/campaigns');

  } catch (e) {
    const errorMessage = (e as Error).message;
    alert(errorMessage); // Mostramos el error directamente al usuario
    setCampaignError(errorMessage);
    setIsSendingCampaign(false);
  }
};

  if (isLoading) {
    return <div className="w-full text-center p-8">Cargando editor...</div>;
  }

  const togglePanel = () => {
    setIsPanelVisible(!isPanelVisible);
  };

  return (
    // Contenedor principal con una posición relativa para el botón
    <div className="relative flex h-screen bg-gray-50 overflow-hidden">
      
      {/* --- El botón ahora vive aquí, fuera del panel --- */}
      <button 
        onClick={togglePanel}
        className="absolute top-5 left-2 z-20 bg-white border border-gray-300 rounded-full p-1 text-gray-600 hover:bg-gray-100"
        title={isPanelVisible ? "Ocultar panel" : "Mostrar panel"}
        // Lo movemos junto con el panel
        style={{ transform: isPanelVisible ? 'translateX(24rem)' : 'translateX(0)', transition: 'transform 300ms ease-in-out' }}
      >
        {isPanelVisible 
          ? <ChevronLeftIcon className="h-5 w-5" /> 
          : <ChevronRightIcon className="h-5 w-5" />
        }
      </button>

      {/* --- Panel lateral con clases de transición --- */}
      <aside 
        className="flex-shrink-0 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out"
        style={{ width: isPanelVisible ? '24rem' : '0', overflow: 'hidden' }}
      >
        <CampaignSettingsPanel
          details={editDetails}
          onDetailsChange={handleDetailsChange}
          segments={segments}
          selectedSegment={selectedSegment}
          isPanelVisible={isPanelVisible}
          onTogglePanel={togglePanel}
          onSegmentChange={setSelectedSegment}
          senders={senders}
          testEmail={testEmail}
          onTestEmailChange={setTestEmail}
          onSendTest={handleSendTest}
          onSendCampaign={handleSendCampaign}
          isSendingTest={isSendingTest}
          saveStatus={saveStatus}
          isSendingCampaign={isSendingCampaign}
          campaignError={campaignError}
          campaignSuccess={campaignSuccess}
        />
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-grow">
          <MyEmailEditor
            ref={unlayerEditorRef} 
            initialJson={campaign?.json_content}
            onDesignUpdate={() => setEditorChangeCounter(c => c + 1)}
          />
        </div>
      </main>
    </div>
  );
}