// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tu paleta de colores de marca
        'primary': '#ff8080',    // Naranja
        'secondary': '#3c527a',  // Azul
        'text': '#383838',      // Gris oscuro para texto
        'background': '#F8F8F8' // Gris muy claro para fondos
      },
    },
  },
  plugins: [],
}
export default config