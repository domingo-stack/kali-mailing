// supabase/functions/import-contacts/index.ts

// deno-lint-ignore no-import-prefix
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { contacts } = await req.json()

    if (!contacts || !Array.isArray(contacts)) {
      throw new Error('Se esperaba un array de contactos.')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const validContacts = contacts.map(contact => ({
      email: contact.email,
      first_name: contact.first_name || null,
      last_name: contact.last_name || null,
      status: contact.status || 'subscribed',
    })).filter(contact => contact.email);

    if (validContacts.length === 0) {
      throw new Error('No se encontraron contactos válidos para importar.')
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