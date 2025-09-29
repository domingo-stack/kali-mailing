// En: supabase/functions/send-campaign/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

import { SESv2Client, SendEmailCommand } from 'npm:@aws-sdk/client-sesv2'
import { FetchHttpHandler } from 'npm:@smithy/fetch-http-handler'

console.log("Función 'send-campaign' v2 (Lógica Completa) iniciada.");

const sesClient = new SESv2Client({
  region: Deno.env.get('AWS_REGION')!,
  credentials: {
    accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
    secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
  },
  requestHandler: new FetchHttpHandler(), 
});

serve(async (req: Request) => {
  const requestOrigin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(requestOrigin) })
  }

  try {
    const { campaign_id } = await req.json()
    if (!campaign_id) {
      throw new Error("Se requiere el ID de la campaña (campaign_id).");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // --- LÓGICA COMPLETA DE LA CAMPAÑA ---

    // 1. Obtener los datos de la campaña. Asumimos que tiene una columna 'segment_id'.
    console.log(`Buscando datos para la campaña: ${campaign_id}`);
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('subject, html_content, segment_id, sender_name, sender_email')
      .eq('id', campaign_id)
      .single();

    if (campaignError) throw new Error(`Error al buscar la campaña: ${campaignError.message}`);
    if (!campaign.segment_id) throw new Error('La campaña no tiene un segmento asociado.');

    // 2. Obtener las reglas del segmento.
    const { data: contacts, error: contactsError } = await supabaseAdmin
    .rpc('get_contacts_in_segment', { p_segment_id: campaign.segment_id });
    
  if (contactsError) throw new Error(`Error al buscar contactos: ${contactsError.message}`);
  if (!contacts || contacts.length === 0) {
    const errorMessage = 'No se encontraron contactos en este segmento. Por favor, ajusta las reglas o selecciona otro segmento.';
    console.warn(errorMessage);
    // Devolvemos un error 400 (Bad Request) que el frontend puede atrapar
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...getCorsHeaders(requestOrigin), 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  console.log(`Enviando campaña a ${contacts.length} contactos...`);

    // 4. Recorrer los contactos y enviar el correo a cada uno.
    for (const contact of contacts) {
      // BONUS: Personalización simple. Reemplaza {{first_name}} con el nombre del contacto.
      const personalizedHtml = campaign.html_content
  ?.replace(/{{first_name}}/g, contact.first_name || '')
  .replace(/{{last_name}}/g, contact.last_name || '')
  .replace(/{{email}}/g, contact.email || '')
  .replace(/{{country}}/g, contact.country || '')
  .replace(/{{city}}/g, contact.city || '');
      
      const command = new SendEmailCommand({
        FromEmailAddress: `"${campaign.sender_name}" <${campaign.sender_email}>`,
        Destination: { ToAddresses: [contact.email] },
        ConfigurationSetName: 'destino-eventos', 
      
        Content: {
          Simple: {
            Subject: { Data: campaign.subject },
            Body: { Html: { Data: personalizedHtml } },
            
            // --- CORRECCIÓN: Los Headers y ListManagementOptions van aquí adentro ---
            Headers: [
              { Name: 'X-Campaign-ID', Value: campaign_id.toString() },
              { Name: 'X-Contact-ID',  Value: contact.id.toString() }
            ]
          }, 
        }
      });
      
      await sesClient.send(command);
    }

    // 5. Actualizar el estado de la campaña a 'sent' (enviada).
    console.log('Actualizando estado final de la campaña...');
    await supabaseAdmin.from('campaigns').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', campaign_id);

    return new Response(JSON.stringify({ message: `Campaña enviada con éxito a ${contacts.length} contactos.` }), {
      headers: { ...getCorsHeaders(requestOrigin), 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error al procesar la campaña:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...getCorsHeaders(requestOrigin), 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});