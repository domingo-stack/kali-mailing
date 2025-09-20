// supabase/functions/send-test-email/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SESv2Client, SendEmailCommand } from 'https://esm.sh/@aws-sdk/client-sesv2'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Función 'send-test-email' iniciada."); // Log inicial

const sesClient = new SESv2Client({
  region: Deno.env.get('AWS_REGION')!,
  credentials: {
    accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
    secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
  },
})

serve(async (req: Request) => {
  console.log("Petición recibida."); // Log de nueva petición
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to_email, subject, html_content } = await req.json()
    console.log(`Intentando enviar correo a: ${to_email}`); // Log con datos

    const from_email = 'domingo@califica.ai' // Asumo tu email verificado
    
    const command = new SendEmailCommand({
      FromEmailAddress: from_email,
      Destination: { ToAddresses: [to_email] },
      Content: {
        Simple: {
          Subject: { Data: `[PRUEBA] ${subject}` },
          Body: { Html: { Data: html_content } },
        },
      },
    })
    
    console.log("Enviando comando a AWS SES...");
    const response = await sesClient.send(command) // Capturamos la respuesta
    console.log("Respuesta de AWS SES recibida:", response); // Log de la respuesta de AWS

    return new Response(JSON.stringify({ 
      message: `Correo de prueba enviado a ${to_email}`,
      aws_message_id: response.MessageId // Devolvemos el ID del mensaje de AWS
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error dentro de la función:", error); // Log del error
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})