// supabase/functions/import-contacts/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // --- INICIO DEL CAMBIO ---
    // 1. Extraemos el token de autorización del usuario que hace la llamada
    const authHeader = req.headers.get('Authorization')!
    const jwt = authHeader.replace('Bearer ', '')

    // 2. Creamos un cliente de Supabase para obtener los datos del usuario a partir del token
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    const { data: { user } } = await supabaseClient.auth.getUser(jwt)
    if (!user) {
      throw new Error("No se pudo identificar al usuario.")
    }
    const userId = user.id
    // --- FIN DEL CAMBIO ---


    const { contacts } = await req.json()

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      throw new Error('El archivo CSV está vacío o no tiene un formato válido.')
    }
    if (!contacts[0].hasOwnProperty('email')) {
        throw new Error('La cabecera "email" es obligatoria en el archivo CSV.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const validContacts = contacts
      .map(contact => ({
        email: contact.email,
        first_name: contact.first_name || null,
        last_name: contact.last_name || null,
        status: contact.status || 'subscribed',
        city: contact.city || null,
        country: contact.country || null,
        user_id: userId, // <-- 3. Asignamos la ID del usuario a cada contacto
      }))
      .filter(contact => contact.email); 

    if (validContacts.length === 0) {
      throw new Error('No se encontraron filas con un email válido en el archivo.')
    }

    const { error } = await supabaseAdmin
      .from('contacts')
      .upsert(validContacts, { onConflict: 'email' })

    if (error) throw error

    return new Response(JSON.stringify({ message: `${validContacts.length} contactos importados con éxito.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})