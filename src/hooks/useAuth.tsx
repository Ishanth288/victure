import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  ready: boolean;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error?: { message: string } }>;
  signUp: (email: string, password: string) => Promise<{ error?: { message: string } }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: { message: string } }>;
}

type UseAuthReturn = AuthState & AuthActions;

const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('Session retrieval error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
        setReady(true);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state change:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_OUT') {
          setError(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: { message: string } }> => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        setError(error.message);
        return { error: { message: error.message } };
      }
      // On successful sign-in, the onAuthStateChange listener will update user and session
      return {};
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      console.error('Sign in error in AuthProvider:', err);
      setError(errorMessage);
      return { error: { message: errorMessage } };
    } finally {
      // setLoading(false); // setLoading(false) will be handled by onAuthStateChange
    }
  };

  const signUp = async (email: string, password: string): Promise<{ error?: { message: string } }> => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password
      });

      if (error) {
        setError(error.message);
        return { error: { message: error.message } };
      }
      // On successful sign-up, the onAuthStateChange listener will update user and session (or trigger email verification flow)
      return {};
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      console.error('Sign up error in AuthProvider:', err);
      setError(errorMessage);
      return { error: { message: errorMessage } };
    } finally {
      // setLoading(false); // setLoading(false) will be handled by onAuthStateChange
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true); // Indicate loading state during sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error in AuthProvider:', error);
        setError(error.message);
        setLoading(false); // Ensure loading is false if sign out fails early
      } else {
        // onAuthStateChange will handle setting user/session to null and setLoading to false
      }
    } catch (err) {
      console.error('Sign out exception in AuthProvider:', err);
      setError(err instanceof Error ? err.message : 'Sign out failed');
      setLoading(false); // Ensure loading is false on exception
    }
  };

  const resetPassword = async (email: string): Promise<{ error?: { message: string } }> => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

      if (error) {
        setError(error.message);
        return { error: { message: error.message } };
      }

      return {};
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
      setError(errorMessage);
      return { error: { message: errorMessage } };
    } finally {
      setLoading(false); // Reset loading state after attempt
    }
  };

  const value: UseAuthReturn = {
    user,
    session,
    loading,
    error,
    ready,
    signIn,
    signUp,
    signOut,
    resetPassword
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): UseAuthReturn => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Remove the default export, keep only the named export above
// export default useAuth;
