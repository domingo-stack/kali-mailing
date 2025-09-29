// En: supabase/functions/_shared/cors.ts

// 1. Define aquí la URL de tu aplicación desplegada en Vercel
const vercelUrl = 'https://kali-mailing-7gtwlsyei-domingos-projects-36185659.vercel.app'; 

// 2. Creamos una lista de los "orígenes" (URLs) que tienen permiso
const allowedOrigins = [
  'http://localhost:3000', // Tu entorno de desarrollo
  vercelUrl,               // Tu entorno de producción
];

// 3. Creamos una función que genera las cabeceras dinámicamente
export const getCorsHeaders = (origin: string | null) => {
  // Verificamos si el origen de la petición está en nuestra lista de permitidos
  const isAllowed = origin && allowedOrigins.includes(origin);

  return {
    // Si el origen es permitido, lo devolvemos. Si no, no devolvemos nada para máxima seguridad.
    'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};