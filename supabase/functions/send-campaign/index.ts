// En: supabase/functions/send-campaign/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
    const { data: segment, error: segmentError } = await supabaseAdmin
      .from('segments')
      .select('rules')
      .eq('id', campaign.segment_id)
      .single();

    if (segmentError) throw new Error(`Error al buscar el segmento: ${segmentError.message}`);
    
    // 3. Construir la consulta y obtener los contactos.
    console.log('Buscando contactos del segmento con reglas:', segment.rules);
    let contactsQuery = supabaseAdmin.from('contacts').select('id, email, first_name');
    
    const rule = segment.rules as { field: string; operator: string; value: string };
    if (rule.operator === 'eq') {
      contactsQuery = contactsQuery.eq(rule.field, rule.value);
    }
    // FUTURO: Aquí añadiremos 'else if' para más operadores (contains, gt, etc.)
    // y un bucle si 'rules' se convierte en un array.

    const { data: contacts, error: contactsError } = await contactsQuery;
    if (contactsError) throw new Error(`Error al buscar contactos: ${contactsError.message}`);
    if (!contacts || contacts.length === 0) {
      // Si no hay contactos, no es un error. Simplemente lo informamos.
      console.log('No se encontraron contactos en el segmento. Finalizando.');
      await supabaseAdmin.from('campaigns').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', campaign_id)
      return new Response(JSON.stringify({ message: `Campaña finalizada. No se encontraron contactos en el segmento.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    console.log(`Enviando campaña a ${contacts.length} contactos...`);

    // 4. Recorrer los contactos y enviar el correo a cada uno.
    for (const contact of contacts) {
      // BONUS: Personalización simple. Reemplaza {{first_name}} con el nombre del contacto.
      const personalizedHtml = campaign.html_content?.replace(/{{first_name}}/g, contact.first_name || '');
      
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error al procesar la campaña:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});