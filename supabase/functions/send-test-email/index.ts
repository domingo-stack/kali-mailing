// En: supabase/functions/send-test-email/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getCorsHeaders } from '../_shared/cors.ts' 
import { SESv2Client, SendEmailCommand } from 'npm:@aws-sdk/client-sesv2'
import { FetchHttpHandler } from 'npm:@smithy/fetch-http-handler'

console.log("Función 'send-test-email' v9 (Corrección de env var) iniciada.");

const sesClient = new SESv2Client({
  region: Deno.env.get('AWS_REGION')!,
  credentials: {
    accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
    // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
    secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!, // Corregido de AWS_SECRET_KEY
  },
  requestHandler: new FetchHttpHandler(), 
});
console.log("Cliente de SES v9 creado con éxito. ✅");

serve(async (req: Request) => {
  const requestOrigin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(requestOrigin) })
  }

  try {
    const { to_email, subject, html_content, sender_name, sender_email } = await req.json()

    if (!sender_name || !sender_email) {
      throw new Error('No se proporcionaron los datos del remitente (sender_name y sender_email).');
    }
     

    const command = new SendEmailCommand({
      FromEmailAddress: `"${sender_name}" <${sender_email}>`,
      Destination: { ToAddresses: [to_email] },
      Content: {
        Simple: {
          Subject: { Data: `[PRUEBA] ${subject}` },
          Body: { Html: { Data: html_content } },
        },
      },
    })

    console.log(`Intentando enviar correo de prueba a: ${to_email}`);
    const response = await sesClient.send(command);
    console.log(`Correo enviado con éxito. Message ID: ${response.MessageId}`);

    return new Response(JSON.stringify({ message: `Correo enviado`, aws_message_id: response.MessageId }), {
      headers: { ...getCorsHeaders(requestOrigin), 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error al procesar la solicitud de envío:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...getCorsHeaders(requestOrigin), 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})