// En: context/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js'

// --- 1. Definimos el tipo para el perfil del usuario ---
type Profile = {
  role: string;
  // aquí podrías añadir más campos en el futuro, como 'full_name', 'avatar_url', etc.
};

// --- 2. Añadimos 'profile' al tipo del contexto ---
type AuthContextType = { 
  session: Session | null; 
  user: User | null; 
  profile: Profile | null; // <-- Nuevo
  isLoading: boolean;
  supabase: SupabaseClient;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null); // <-- Nuevo estado
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // La comprobación de sesión inicial ahora también busca el perfil
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      // --- 3. Lógica para buscar el perfil ---
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        setProfile(profileData);
      }
      setIsLoading(false);
    }
    
    checkInitialSession();

    // El listener de cambios de sesión también actualiza el perfil
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        setProfile(profileData);
      } else {
        setProfile(null); // Limpiamos el perfil al cerrar sesión
      }
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  const value = useMemo(() => ({
    session,
    user,
    profile, // <-- Nuevo valor proveído
    isLoading,
    supabase,
  }), [session, user, profile, isLoading]);

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