// En: supabase/functions/_shared/cors.ts

export const corsHeaders = {
  // ARREGLO CLAVE: Esta línea le dice al navegador:
  // "Cualquier página ('*'), desde cualquier origen, tiene permiso para hablar con esta función."
  // Para producción, podríamos restringirlo a 'https://tu-dominio.com', pero para desarrollo '*' es perfecto.
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}