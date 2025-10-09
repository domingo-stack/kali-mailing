import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const requestOrigin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(requestOrigin) });

  // Sacamos los datos de la petición aquí afuera para que estén disponibles en todo el flujo
  const { campaign_id } = await req.json();
  if (!campaign_id) {
    // Usamos un return para detener la ejecución si no hay campaign_id
    return new Response(JSON.stringify({ error: "Se requiere campaign_id." }), {
        headers: { ...getCorsHeaders(requestOrigin), 'Content-Type': 'application/json' }, status: 400,
    });
  }

  // Creamos el cliente de Supabase aquí para que esté disponible en try Y catch
  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns').select('segment_id').eq('id', campaign_id).single();
    if (campaignError) throw campaignError;
    if (!campaign.segment_id) throw new Error('La campaña no tiene un segmento asociado.');

    let totalContactsEnqueued = 0;
    const PAGE_SIZE = 1000;
    let currentPage = 0;
    let keepFetching = true;

    await supabaseAdmin
      .from('campaigns')
      .update({ status: 'sending' })
      .eq('id', campaign_id);

    while (keepFetching) {
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      console.log(`Buscando contactos: Lote ${currentPage + 1}, desde ${from} hasta ${to}`);

      const { data: contacts, error: rpcError } = await supabaseAdmin
        .rpc('get_contacts_in_segment', { p_segment_id: campaign.segment_id })
        .range(from, to);

      if (rpcError) throw rpcError;

      if (contacts && contacts.length > 0) {
        console.log(`Encontrados ${contacts.length} contactos en este lote.`);
        
        const queueJobs = contacts.map((contact: { id: number }) => ({
          campaign_id: campaign_id,
          contact_id: contact.id,
        }));

        const { error: insertError } = await supabaseAdmin
          .from('campaign_queue')
          .insert(queueJobs);
        if (insertError) throw insertError;

        totalContactsEnqueued += contacts.length;

        if (contacts.length < PAGE_SIZE) {
          keepFetching = false;
        } else {
          currentPage++;
        }
      } else {
        keepFetching = false;
      }
    }

    console.log(`Proceso de encolado finalizado. Total: ${totalContactsEnqueued} contactos.`);

    await supabaseAdmin
      .from('campaigns')
      .update({ recipients_count: totalContactsEnqueued })
      .eq('id', campaign_id);
    
    return new Response(JSON.stringify({ message: `${totalContactsEnqueued} contactos han sido encolados para el envío.` }), {
      headers: { ...getCorsHeaders(requestOrigin), 'Content-Type': 'application/json' }, status: 202,
    });

  } catch (error) {
    console.error('Error fatal en trigger-campaign:', error);
    
    // Ahora supabaseAdmin y campaign_id SÍ existen aquí
    await supabaseAdmin.from('campaigns').update({ status: 'draft' }).eq('id', campaign_id);
    
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...getCorsHeaders(requestOrigin), 'Content-Type': 'application/json' }, status: 500,
    });
  }
});