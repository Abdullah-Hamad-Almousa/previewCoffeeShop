import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';
import {
  signUpWithEmail,
  signInWithEmail,
  signOut as signOutService,
  getCurrentUser,
  fetchUserRole,
  type AuthUser,
  type UserRole,
} from '@/services/auth';

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string, captchaToken: string) => Promise<void>;
  signUp: (email: string, password: string, captchaToken: string, username?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial session
    getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));

    // Listen for auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        return;
      }
      const { role, username } = await fetchUserRole(session.user.id);
      setUser({ id: session.user.id, email: session.user.email ?? '', username, role });
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, captchaToken: string) => {
    const data = await signInWithEmail(email, password, captchaToken);
    if (data.user) {
      const { role, username } = await fetchUserRole(data.user.id);
      setUser({ id: data.user.id, email: data.user.email ?? '', username, role });
    }
  };

  const signUp = async (email: string, password: string, captchaToken: string, username?: string) => {
    await signUpWithEmail(email, password, captchaToken, username);
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    if (sessionUser) {
      const { role, username: uname } = await fetchUserRole(sessionUser.id);
      setUser({ id: sessionUser.id, email: sessionUser.email ?? '', username: uname, role });
    }
  };

  const signOut = async () => {
    await signOutService();
    setUser(null);
    router.replace('/(auth)/sign-in');
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}