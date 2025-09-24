// components/CampaignSettingsPanel.tsx
'use client'

type CampaignDetails = {
    name: string;
    subject: string;
    preheader: string;
    sender_name: string;
    sender_email: string;
  };

type Segment = {
  id: number;
  name: string;
};

type Sender = { id: number; name: string; email: string; };

type Props = {
  details: CampaignDetails;
  onDetailsChange: (field: keyof CampaignDetails, value: string) => void;
  segments: Segment[];
  selectedSegment: string;
  onSegmentChange: (segmentId: string) => void;
  testEmail: string;
  onTestEmailChange: (email: string) => void;
  onSendTest: () => void;
  onSendCampaign: () => void;
  saveStatus: string;
  isSendingTest: boolean;
  isSendingCampaign: boolean;      // Nuevo
  campaignError: string | null;    // Nuevo
  campaignSuccess: string | null;
  senders: Sender[];
};

export default function CampaignSettingsPanel({
  details,
  onDetailsChange,
  segments,
  selectedSegment,
  onSegmentChange,
  testEmail,
  onTestEmailChange,
  onSendTest,
  onSendCampaign,
  isSendingTest,
  saveStatus,
  isSendingCampaign,
  campaignError,
  campaignSuccess,
  senders,

}: Props) {

  const isFormIncomplete = !details.subject || !details.preheader || !selectedSegment;

  console.log({
    isSendingCampaign,
    saveStatus,
    selectedSegment,
    isDisabled: isSendingCampaign || saveStatus !== 'Guardado' || !selectedSegment
  });

    return (
        <aside className="w-96 bg-white p-6 border-r border-gray-200 flex flex-col">
          <div className="space-y-6 flex-grow overflow-y-auto pr-4"> 
          <div className="flex items-center justify-between mb-4">
    
    <span className="text-sm text-gray-500 font-medium">
        {saveStatus === 'Guardando...' ? 'Guardando...' : `Guardado ✓`}
    </span>
</div>
            {/* --- INICIO DE NUEVA SECCIÓN --- */}
            <div>
              <h2 className="text-lg font-semibold text-[#383838]">Detalles de la Campaña</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700">Nombre (interno)</label>
                  <input type="text" id="campaignName" value={details.name} onChange={(e) => onDetailsChange('name', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"/>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Asunto (Subject)</label>
                  <input type="text" id="subject" value={details.subject} onChange={(e) => onDetailsChange('subject', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"/>
                </div>
                <div>
                  <label htmlFor="preheader" className="block text-sm font-medium text-gray-700">Pre-header</label>
                  <input type="text" id="preheader" value={details.preheader} onChange={(e) => onDetailsChange('preheader', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"/>
                </div>
                <div>
                <div>
  <label htmlFor="sender" className="block text-sm font-medium text-gray-700">
    Remitente
  </label>
  <select
    id="sender"
    // Guardamos el email en `sender_email` para usarlo como identificador
    value={details.sender_email || ''} 
    onChange={(e) => {
      const selectedSender = senders.find(s => s.email === e.target.value);
      if (selectedSender) {
        onDetailsChange('sender_name', selectedSender.name);
        onDetailsChange('sender_email', selectedSender.email);
      }
    }}
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
  >
    <option value="" disabled>Selecciona un remitente...</option>
    {senders.map(sender => (
      <option key={sender.id} value={sender.email}>
        {sender.name} &lt;{sender.email}&gt;
      </option>
    ))}
  </select>
</div>
</div>
              </div>
            </div>
        {/* SECCIÓN DESTINATARIOS */}
        <div>
          <h2 className="text-lg font-semibold text-[#383838]">Destinatarios</h2>
          <div className="mt-4">
            <label htmlFor="segment" className="block text-sm font-medium text-gray-700 mb-1">
              Enviar a Segmento
            </label>
            <select
              id="segment"
              value={selectedSegment}
              onChange={(e) => onSegmentChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ff8080]"
            >
              <option value="" disabled>Selecciona un segmento...</option>
              {segments.map(segment => (
                <option key={segment.id} value={segment.id}>{segment.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* SECCIÓN PRUEBA */}
        <div>
          <h2 className="text-lg font-semibold text-[#383838]">Prueba</h2>
          <div className="mt-4 border-t pt-4">
            <label htmlFor="test-email" className="block text-sm font-medium text-gray-700 mb-1">
              Enviar correo de prueba
            </label>
            <div className="flex space-x-2">
              <input
                type="email"
                id="test-email"
                value={testEmail}
                onChange={(e) => onTestEmailChange(e.target.value)}
                placeholder="tu@email.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm"
              />
              <button 
  onClick={onSendTest} 
  disabled={isSendingTest} // Se deshabilita si está enviando
  className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isSendingTest ? 'Enviando...' : 'Enviar'} 
</button>
            </div>
          </div>
        </div>
      </div>
        
      {/* BOTÓN DE ENVÍO FINAL */}
      <div className="border-t pt-6 mt-6">
      <button 
  onClick={onSendCampaign} 
  // El botón se deshabilita si la campaña se está enviando O si el formulario está incompleto.
  disabled={isSendingCampaign || isFormIncomplete}
  className="w-full bg-[#ff8080] text-white font-bold py-3 px-8 text-lg rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isSendingCampaign ? 'Enviando...' : 'Revisar y Enviar Campaña'}
</button>
            {/* Añadimos los mensajes de feedback para el usuario */}
            {campaignSuccess && <p className="text-sm text-green-600 mt-2 text-center">{campaignSuccess}</p>}
            {campaignError && <p className="text-sm text-red-600 mt-2 text-center">{campaignError}</p>}
          </div>
      </aside>
  );
}