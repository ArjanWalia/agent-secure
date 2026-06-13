import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface SignupArgs {
  email: string;
  password: string;
  username: string;
  dob: string; // YYYY-MM-DD
}

interface SignUpResult {
  // true when Supabase requires email verification before a session exists.
  needsVerification: boolean;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (args: SignupArgs) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Create the profile row in `accounts` for an authenticated user. Safe to call
// repeatedly (upsert). We read username/DOB from the auth user's metadata,
// which is set at signup — this is why we can defer row creation until AFTER
// email verification, when a valid session (and auth.uid()) finally exists.
async function ensureAccount(user: User) {
  const md = (user.user_metadata ?? {}) as { username?: string; dob?: string };
  if (!md.username || !md.dob) return; // nothing to persist yet
  await supabase.from('accounts').upsert(
    { id: user.id, email: user.email, username: md.username, dob: md.dob },
    { onConflict: 'id' },
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) void ensureAccount(data.session.user);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // When a session appears (e.g. first login after verifying email),
      // make sure the profile row exists.
      if (s?.user) void ensureAccount(s.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signUp({ email, password, username, dob }: SignupArgs): Promise<SignUpResult> {
    // Stash username + DOB in user metadata so we can build the accounts row
    // once the user is authenticated (the RLS policy needs auth.uid() == id).
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, dob } },
    });
    if (error) throw error;

    if (data.session?.user) {
      // Email confirmation is disabled → we already have a session, create now.
      await ensureAccount(data.session.user);
      return { needsVerification: false };
    }
    // No session yet → Supabase is requiring email verification.
    return { needsVerification: true };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ user: session?.user ?? null, session, loading, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
