'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Session, User } from '@supabase/supabase-js'

// El contexto solo se preocupará por la sesión y el estado de carga inicial.
const AuthContext = createContext<{ 
  session: Session | null; 
  user: User | null; 
  isLoading: boolean;
}>({
  session: null,
  user: null,
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificamos la sesión inicial UNA SOLA VEZ.
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    }
    checkInitialSession();

    // Escuchamos cambios (login/logout) y solo actualizamos la sesión.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    session,
    user,
    isLoading,
  }), [session, user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}