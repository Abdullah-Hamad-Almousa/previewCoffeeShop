import { supabase } from '@/lib/supabase';

export type UserRole = 'customer' | 'manager';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

/** Generate a random 6-char alphanumeric string */
function randomUsername(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function fetchUserRole(userId: string): Promise<{ role: UserRole; username: string }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role, username')
    .eq('user_id', userId)
    .single();

  if (error || !data) return { role: 'customer', username: 'user' };
  return {
    role: data.role as UserRole,
    username: data.username ?? 'user',
  };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  captchaToken: string,
  username?: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { captchaToken },
  });

  if (error) throw error;

  // Profile row is auto-created by the DB trigger (handle_new_user)
  // But if the trigger didn't fire (e.g. in test), insert manually
  if (data.user) {
    const finalUsername = (username && username.length >= 6) ? username : randomUsername();
    await supabase.from('profiles').upsert(
      { user_id: data.user.id, role: 'customer', username: finalUsername },
      { onConflict: 'user_id' }
    );
  }

  return data;
}

export async function signInWithEmail(
  email: string,
  password: string,
  captchaToken: string
) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  // First check if there's a stored session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;

  const { role, username } = await fetchUserRole(session.user.id);
  return { id: session.user.id, email: session.user.email ?? '', username, role };
}

// ---------- MFA (TOTP) ----------

export async function enrollMFA() {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
  });
  if (error) throw error;
  return data;
}

export async function verifyMFA(factorId: string, code: string) {
  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });
  if (error) throw error;
  return data;
}

export async function unenrollMFA(factorId: string) {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}

export async function listMFAFactors() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data;
}