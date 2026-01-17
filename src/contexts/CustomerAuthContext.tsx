import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomerProfile {
  id: string;
  user_id: string;
  phone: string;
  full_name: string | null;
}

interface CustomerAuthContextType {
  user: User | null;
  session: Session | null;
  profile: CustomerProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (phone: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (phone: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

// Normalize phone to +233 format
const normalizePhone = (phone: string): string => {
  const clean = phone.replace(/\s/g, "");
  return clean.startsWith("0") ? "+233" + clean.slice(1) : clean;
};

// Convert phone to pseudo-email for auth
const phoneToEmail = (phone: string): string => {
  const normalized = normalizePhone(phone);
  return `${normalized.replace("+", "")}@customer.eidikos.local`;
};

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data as CustomerProfile | null);
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const hydrateFromSession = async (nextSession: Session | null) => {
      // We share one auth system for both staff + customers.
      // Only treat the session as a "customer session" if this user is actually a customer.
      if (!nextSession?.user) {
        setSession(null);
        setUser(null);
        setProfile(null);
        return;
      }

      try {
        const userId = nextSession.user.id;

        // SECURITY: determine customer status from backend function, not client storage.
        const { data: isCustomer, error } = await supabase.rpc('is_customer', { _user_id: userId });
        if (error) throw error;

        if (isCustomer) {
          setSession(nextSession);
          setUser(nextSession.user);
          // Defer profile fetch with setTimeout to avoid deadlock
          setTimeout(() => {
            fetchProfile(userId);
          }, 0);
        } else {
          // Staff session: Customer context should be "logged out"
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (e) {
        console.error('Error determining customer session:', e);
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    };

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      hydrateFromSession(nextSession);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      hydrateFromSession(existingSession).finally(() => setLoading(false));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (phone: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const email = phoneToEmail(phone);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid phone number or password');
        }
        throw error;
      }

      toast.success('Welcome back!');
      return { error: null };
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || 'Sign in failed');
      return { error: err };
    }
  };

  const signUp = async (phone: string, password: string, fullName?: string): Promise<{ error: Error | null }> => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-signup', {
        body: { phone, password, fullName },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Sign up failed');

      // Auto sign in after successful signup
      const signInResult = await signIn(phone, password);
      if (signInResult.error) throw signInResult.error;

      toast.success('Account created successfully!');
      return { error: null };
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || 'Sign up failed');
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const value: CustomerAuthContextType = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!session && !!profile,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}
