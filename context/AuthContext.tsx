// context/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
// 1. IMPORTAMOS createClient y SupabaseClient AQUÍ
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Session, User } from '@supabase/supabase-js'

// 2. AÑADIMOS EL CLIENTE DE SUPABASE AL TIPO DEL CONTEXTO
type AuthContextType = { 
  session: Session | null; 
  user: User | null; 
  isLoading: boolean;
  supabase: SupabaseClient; // El cliente siempre estará disponible
};

// Creamos el cliente de Supabase una sola vez fuera del componente
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    }
    checkInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Cuando la sesión cambia, el cliente de Supabase se actualiza automáticamente.
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
    supabase, // 3. PROVEEMOS EL CLIENTE A TRAVÉS DEL CONTEXTO
  }), [session, user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}