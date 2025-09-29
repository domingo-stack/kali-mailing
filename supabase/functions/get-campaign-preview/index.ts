import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const requestOrigin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(requestOrigin) });

  try {
    const { campaign_id } = await req.json();
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Obtenemos el segment_id de la campaña
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns').select('segment_id').eq('id', campaign_id).single();
    if (campaignError) throw campaignError;
    
    // Llamamos a nuestra función de conteo que ya es inteligente
    const { data: count, error: countError } = await supabaseAdmin
      .rpc('get_segment_contact_count', { p_segment_id: campaign.segment_id });
    if (countError) throw countError;

    return new Response(JSON.stringify({ contactCount: count }), {
      headers: { ...getCorsHeaders(requestOrigin), 'Content-Type': 'application/json' }, status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...getCorsHeaders(requestOrigin), 'Content-Type': 'application/json' }, status: 400,
    });
  }
})