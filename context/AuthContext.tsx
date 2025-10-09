// En: context/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation';
import type { Session, User } from '@supabase/supabase-js'
// --- CAMBIO 1: Importamos nuestro nuevo creador de cliente ---
import { createClient } from '@/supabase/client'

// Definimos el tipo para el perfil (está perfecto como lo tenías)
type Profile = {
  role: string;
};

type AuthContextType = { 
  session: Session | null; 
  user: User | null; 
  profile: Profile | null;
  isLoading: boolean;
  supabase: any; // El tipo exacto del cliente SSR es complejo, 'any' es una solución práctica aquí
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // --- CAMBIO 2: Creamos el cliente DENTRO del provider y obtenemos el router ---
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- CAMBIO 3: Un useEffect unificado y más robusto ---
  useEffect(() => {
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
          setProfile(profileData as Profile | null);
        } else {
          setProfile(null);
        }
        
        setIsLoading(false);
        router.refresh();
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error("¡ERROR CRÍTICO AL INICIALIZAR AuthContext!:", error);
      // ¡IMPORTANTE! Liberamos la app aunque haya un error para que no se quede en blanco.
      setIsLoading(false);
    }
    // -------------------------------------------------------------
  }, [supabase, router]);

  const value = useMemo(() => ({
    session,
    user,
    profile,
    isLoading,
    supabase,
  }), [session, user, profile, isLoading, supabase]);

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
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