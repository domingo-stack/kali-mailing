// En: supabase/functions/ses-webhook/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('Función `ses-webhook` v4 (a prueba de errores) iniciada.');

serve(async (req: Request) => {
  try {
    const body = await req.json();
    const messageType = body.Type;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (messageType) {
      case 'SubscriptionConfirmation': {
        const subscribeURL = body.SubscribeURL;
        await fetch(subscribeURL);
        return new Response('Suscripción confirmada.', { status: 200 });
      }

      case 'Notification': {
        let sesEvent;
        if (typeof body.Message === 'string') {
          sesEvent = JSON.parse(body.Message);
        } else {
          sesEvent = body.Message;
        }

        const eventType = sesEvent.eventType;
        const mail = sesEvent.mail;
        const messageId = mail.messageId;

        const findHeader = (name: string) => 
          mail.headers.find((h: { name: string; value: string }) => h.name === name)?.value;
        
        const campaignId = findHeader('X-Campaign-ID');
        const contactId = findHeader('X-Contact-ID');

        if (!campaignId || !contactId) {
          console.warn('Evento recibido sin headers de campaña/contacto. Ignorando.');
          return new Response('Notificación ignorada (sin headers).', { status: 200 });
        }
        
        // --- LÓGICA DE INSERCIÓN MEJORADA ---
        let error = null;

        if (eventType === 'Open') {
          const { ipAddress, userAgent } = sesEvent.open;
          ({ error } = await supabaseAdmin.from('campaign_opens').insert({
            campaign_id: parseInt(campaignId), contact_id: parseInt(contactId),
            message_id: messageId, ip_address: ipAddress, user_agent: userAgent
          }));
          if (error) throw new Error(`Error al insertar apertura: ${error.message}`);
          console.log(`Apertura registrada para campaña ${campaignId}`);
        }

        if (eventType === 'Click') {
          const { ipAddress, userAgent, link } = sesEvent.click;
          ({ error } = await supabaseAdmin.from('campaign_clicks').insert({
            campaign_id: parseInt(campaignId), contact_id: parseInt(contactId),
            message_id: messageId, link_url: link, ip_address: ipAddress, user_agent: userAgent
          }));
          if (error) throw new Error(`Error al insertar clic: ${error.message}`);
          console.log(`Clic registrado para campaña ${campaignId} en el enlace ${link}`);
        }
        
        if (eventType === 'Bounce') {
          const { bounceType } = sesEvent.bounce;
          ({ error } = await supabaseAdmin.from('campaign_bounces').insert({
            campaign_id: parseInt(campaignId), contact_id: parseInt(contactId),
            message_id: messageId, bounce_type: bounceType
          }));
          if (error) throw new Error(`Error al insertar rebote: ${error.message}`);
          console.log(`Rebote (${bounceType}) registrado para campaña ${campaignId}`);
        }

        return new Response('Notificación procesada y guardada.', { status: 200 });
      }

      default:
        return new Response('Tipo de mensaje no reconocido.', { status: 400 });
    }
  } catch (error) {
    console.error('Error fatal procesando el webhook de SES:', error);
    return new Response(`Error interno: ${(error as Error).message}`, { status: 500 });
  }
});