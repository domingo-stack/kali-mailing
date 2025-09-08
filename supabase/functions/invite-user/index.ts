// supabase/functions/invite-user/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Function script loaded"); // Se muestra cuando la función se carga por primera vez

Deno.serve(async (req) => {
  // Manejo de la petición OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("--- Inicio de la invocación ---"); // PUNTO DE CONTROL 1

    const { emailToInvite } = await req.json()
    console.log(`Punto de control 2: Email a invitar recibido: ${emailToInvite}`);
    
    const authHeader = req.headers.get('Authorization');
    console.log(`Punto de control 3: Cabecera de autorización presente: ${!!authHeader}`);
    
    if (!authHeader) {
      throw new Error("¡La cabecera de autorización (Authorization) está ausente!");
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    console.log(`Punto de control 4: Usuario que invita encontrado: ${user ? user.id : 'null'}`);
    
    if (!user) throw new Error("No se pudo encontrar al usuario que está enviando la invitación.")

    const { data: teamData, error: teamError } = await supabaseClient
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .single()
    
    if (teamError) throw teamError;
    if (!teamData) throw new Error(`No se encontró equipo para el usuario ${user.id}`);
    
    console.log(`Punto de control 5: ID de equipo encontrado: ${teamData.team_id}`);
    const { team_id } = teamData

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    console.log("Punto de control 6: Enviando invitación con el cliente de administrador...");
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      emailToInvite,
      {
        redirectTo: 'http://localhost:3000/accept-invite',
        data: { team_id: team_id }
      }
    )

    if (inviteError) throw inviteError

    console.log("--- Invocación exitosa ---");
    return new Response(JSON.stringify({ message: `Invitación enviada a ${emailToInvite}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("!!! ERROR CAPTURADO EN LA FUNCIÓN:", error); // Log de error detallado
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})