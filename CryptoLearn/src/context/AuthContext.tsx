import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { initializeProgress } from '../services/progress';

interface SignupArgs {
  email: string;
  password: string;
  username: string;
  dob: string; // YYYY-MM-DD
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (args: SignupArgs) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Create the profile row in `accounts` and seed all progress rows for a newly
// authenticated user. Idempotent: the accounts row is upserted, and progress
// rows are inserted only if missing (so we never wipe existing progress).
async function provisionUser(user: User) {
  const md = (user.user_metadata ?? {}) as { username?: string; dob?: string };
  if (md.username && md.dob) {
    await supabase.from('accounts').upsert(
      { id: user.id, email: user.email, username: md.username, dob: md.dob },
      { onConflict: 'id' },
    );
  }
  // Ensure the user exists in every progress table (course/section/lesson/question).
  await initializeProgress(user.id);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) void provisionUser(data.session.user);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) void provisionUser(s.user);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signUp({ email, password, username, dob }: SignupArgs): Promise<void> {
    // Save username + DOB in user metadata so provisionUser can build the
    // accounts row once we have an authenticated session.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, dob } },
    });
    if (error) throw error;

    // Email confirmation is expected to be DISABLED in the Supabase project, so
    // signUp should return a session. If it doesn't, try to sign in immediately.
    let user = data.session?.user ?? null;
    if (!data.session) {
      const { data: s, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        throw new Error(
          'Account created, but automatic login failed. If email confirmation is still ' +
            'enabled in Supabase (Authentication → Providers → Email), disable it.',
        );
      }
      user = s.user;
    }
    if (user) await provisionUser(user);
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
