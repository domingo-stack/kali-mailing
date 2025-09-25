// En: supabase/functions/import-contacts/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const ALLOWED_SUBSCRIPTION_TYPES = ['Gratuito', 'Mensual', 'Anual', 'Cancelado'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')!
    const jwt = authHeader.replace('Bearer ', '')
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '')
    const { data: { user } } = await supabaseClient.auth.getUser(jwt)
    if (!user) throw new Error("No se pudo identificar al usuario.")
    
    const { contacts } = await req.json();
    console.log('Función `import-contacts` invocada con:', contacts);

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) throw new Error('El archivo CSV está vacío o no tiene un formato válido.')
    if (!contacts[0].hasOwnProperty('email')) throw new Error('La cabecera "email" es obligatoria en el archivo CSV.');

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    
    const validContacts = contacts
      .filter(contact => contact && typeof contact.email === 'string' && contact.email.includes('@'))
      .map(contact => {
        let subType = 'Gratuito';
        if (contact.subscription_type && ALLOWED_SUBSCRIPTION_TYPES.includes(contact.subscription_type)) {
          subType = contact.subscription_type;
        }
        return {
          email: contact.email,
          first_name: contact.first_name || null,
          last_name: contact.last_name || null,
          status: contact.status || 'Subscribed',
          city: contact.city || null,
          country: contact.country || null,
          subscription_type: subType,
          user_id: user.id,
        }
      }); 

    console.log('Contactos validados listos para guardar:', validContacts);
    if (validContacts.length === 0) throw new Error('No se encontraron filas con un email válido en el archivo.');

    // --- LÓGICA DE GUARDADO MEJORADA ---
    const { error } = await supabaseAdmin
      .from('contacts')
      .upsert(validContacts, { onConflict: 'user_id, email' });

    if (error) {
      console.error("Error en el upsert de Supabase:", error);
      throw new Error(`Error de base de datos: ${error.message}`);
    }
    // --- FIN DE LA MEJORA ---

    return new Response(JSON.stringify({ message: `${validContacts.length} contactos importados/actualizados con éxito.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
    })
  }
})