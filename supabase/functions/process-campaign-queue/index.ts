// En: supabase/functions/process-campaign-queue/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SESv2Client, SendEmailCommand } from 'npm:@aws-sdk/client-sesv2'
import { FetchHttpHandler } from 'npm:@smithy/fetch-http-handler'

type Job = {
  id: number;
  campaign_id: number;
  campaign: { subject: string; html_content: string; sender_name: string; sender_email: string; } | null;
  contact: { id: number; email: string; first_name: string | null; last_name: string | null; country: string | null; city: string | null; } | null;
};

const BATCH_SIZE = 600; // Puedes ajustar este valor

Deno.serve(async (_req) => {
  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const sesClient = new SESv2Client({
      region: Deno.env.get('AWS_REGION')!,
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
      },
      requestHandler: new FetchHttpHandler(),
    });

    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('campaign_queue')
      .select(`
        id, campaign_id,
        campaign:campaigns (subject, html_content, sender_name, sender_email),
        contact:contacts (id, email, first_name, last_name, country, city)
      `)
      .eq('status', 'pending')
      .limit(BATCH_SIZE)
      .returns<Job[]>();
    
    if (jobsError) throw jobsError;
    if (!jobs || jobs.length === 0) {
      console.log('No hay trabajos pendientes en la cola. Finalizando.');
      return new Response(JSON.stringify({ message: "No jobs pending." }), { status: 200 });
    }

    console.log(`Procesando un lote de ${jobs.length} correos.`);
    
    const jobIds = jobs.map(j => j.id);
    await supabaseAdmin.from('campaign_queue').update({ status: 'processing' }).in('id', jobIds);

    for (const job of jobs) {
      if (!job.contact || !job.campaign) {
        await supabaseAdmin.from('campaign_queue').update({ status: 'failed', error_message: 'Faltan datos de contacto o campaña.' }).eq('id', job.id);
        continue;
      }
      
      try {
        const personalizedHtml = job.campaign.html_content
          ?.replace(/{{first_name}}/g, job.contact.first_name || '')
          .replace(/{{last_name}}/g, job.contact.last_name || '')
          .replace(/{{email}}/g, job.contact.email || '')
          .replace(/{{country}}/g, job.contact.country || '')
          .replace(/{{city}}/g, job.contact.city || '');

        const command = new SendEmailCommand({
          FromEmailAddress: `"${job.campaign.sender_name}" <${job.campaign.sender_email}>`,
          Destination: { ToAddresses: [job.contact.email] },
          ConfigurationSetName: 'destino-eventos',
          Content: {
            Simple: {
              Subject: { Data: job.campaign.subject },
              Body: { Html: { Data: personalizedHtml } },
              Headers: [
                { Name: 'X-Campaign-ID', Value: job.campaign_id.toString() },
                { Name: 'X-Contact-ID',  Value: job.contact.id.toString() }
              ]
            },
          },
        });

        await sesClient.send(command);
        await supabaseAdmin.from('campaign_queue').update({ status: 'sent', processed_at: new Date().toISOString() }).eq('id', job.id);

      } catch (sendError) {
        console.error(`Error enviando al contacto ${job.contact.id}:`, sendError);
        await supabaseAdmin.from('campaign_queue').update({ status: 'failed', error_message: (sendError as Error).message }).eq('id', job.id);
      }
    }
    
    // --- BLOQUE AÑADIDO ---
    // Después de procesar el lote, verificamos si la campaña ha terminado.
    const campaignId = jobs[0].campaign_id;
    
    // Contamos cuántos trabajos QUEDAN pendientes para esta campaña específica.
    const { count: remainingJobs } = await supabaseAdmin
      .from('campaign_queue')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');

    console.log(`Quedan ${remainingJobs ?? 0} trabajos para la campaña ${campaignId}.`);

    // Si ya no quedan trabajos pendientes, marcamos la campaña como 'sent'.
    if (remainingJobs === 0) {
      console.log(`Campaña ${campaignId} completada. Actualizando estado a 'sent'.`);
      await supabaseAdmin
        .from('campaigns')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', campaignId);
    }
    // --- FIN DEL BLOQUE AÑADIDO ---

    return new Response(JSON.stringify({ message: `Lote de ${jobs.length} procesado.` }), { status: 200 });

  } catch (error) {
    console.error("Error fatal en process-campaign-queue:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
});