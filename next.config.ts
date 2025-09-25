/** @type {import('next').NextConfig} */
const nextConfig = {
  // Aquí pueden ir otras configuraciones que ya tengas...

  // AÑADE ESTE BLOQUE:
  eslint: {
    // Advertencia: Esto deshabilita la comprobación de ESLint durante el build.
    // Es útil para desplegar rápido, pero es buena práctica arreglar los warnings después.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
