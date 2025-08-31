'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Session, User } from '@supabase/supabase-js'

// Creamos el contexto que almacenará la información de la sesión
const AuthContext = createContext<{ session: Session | null; user: User | null }>({
  session: null,
  user: null,
});

// Creamos el "Proveedor", un componente que envolverá nuestra aplicación
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Esta función se ejecuta una vez para obtener la sesión inicial
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Esto escucha los cambios en el estado de autenticación (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Limpiamos la suscripción cuando el componente se desmonta
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
  };

  // No mostramos la app hasta que sepamos si hay una sesión o no
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Creamos un "hook" personalizado para acceder fácilmente a la información del usuario
export function useAuth() {
  return useContext(AuthContext);
}