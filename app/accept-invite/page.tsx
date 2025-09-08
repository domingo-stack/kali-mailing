// app/accept-invite/page.tsx

'use client';

import { useState } from 'react';
// ¡CORRECCIÓN! Importamos directamente desde la librería de Supabase
import { createClient } from '@supabase/supabase-js'; 
import { useRouter } from 'next/navigation';

export default function AcceptInvitePage() {
  // ¡CORRECCIÓN! Creamos el cliente aquí, pasándole las variables de entorno
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const router = useRouter();
  
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Actualiza el usuario con su nueva contraseña y nombre
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
      data: {
        full_name: fullName, 
      }
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      // Si todo sale bien, lo enviamos a la página principal
      router.push('/');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Finaliza tu registro</h2>
        <p className="text-center text-gray-600">
          ¡Bienvenido! Solo necesitas configurar tu nombre y contraseña para empezar.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Nombre Completo
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          {error && <p className="text-sm text-center text-red-500">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Guardando...' : 'Guardar y Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}