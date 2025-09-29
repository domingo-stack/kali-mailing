// En: supabase/functions/trigger-campaign/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const requestOrigin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(requestOrigin) });
  
  try {
    const { campaign_id } = await req.json();
    if (!campaign_id) throw new Error("Se requiere campaign_id.");

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    
    // 1. Obtenemos el segment_id de la campaña
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns').select('segment_id').eq('id', campaign_id).single();
    if (campaignError) throw campaignError;
    if (!campaign.segment_id) throw new Error('La campaña no tiene un segmento asociado.');

    // 2. Llamamos DIRECTAMENTE a la función que OBTIENE los contactos
    const { data: contacts, error: rpcError } = await supabaseAdmin
      .rpc('get_contacts_in_segment', { p_segment_id: campaign.segment_id });
    if (rpcError) throw rpcError;

    // --- NUEVO MICRÓFONO DE DEPURACIÓN ---
    console.log(`La función 'get_contacts_in_segment' encontró ${contacts?.length || 0} contactos.`);

    if (!contacts || contacts.length === 0) {
      // Si realmente no hay contactos, lo informamos y terminamos.
      return new Response(JSON.stringify({ message: `0 contactos han sido encolados para el envío.` }), {
        headers: { ...getCorsHeaders(requestOrigin), 'Content-Type': 'application/json' }, status: 200,
      });
    }

    // 3. Preparamos los contactos para la cola
    // Definimos el tipo de contacto para evitar el error de tipo implícito 'any'
    type Contact = { id: string | number };

    const queueJobs = (contacts as Contact[]).map((contact: Contact) => ({
      campaign_id: campaign_id,
      contact_id: contact.id,
    }));
    // 4. Insertamos los trabajos en la cola
    const { error: insertError } = await supabaseAdmin
      .from('campaign_queue')
      .insert(queueJobs);
    if (insertError) throw insertError;
    
    const count = queueJobs.length;

    // 5. Actualizamos la campaña
    await supabaseAdmin
      .from('campaigns')
      .update({ status: 'sending', recipients_count: count })
      .eq('id', campaign_id);
    
    return new Response(JSON.stringify({ message: `${count} contactos han sido encolados para el envío.` }), {
      headers: { ...getCorsHeaders(requestOrigin), 'Content-Type': 'application/json' }, status: 202,
    });

  } catch (error) {
    console.error('Error fatal en trigger-campaign:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...getCorsHeaders(requestOrigin), 'Content-Type': 'application/json' }, status: 400,
    });
  }
})