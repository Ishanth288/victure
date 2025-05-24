
import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  user: any;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    console.log('Sign in called with:', email);
    return { user: null };
  };
  
  const signOut = async () => {
    console.log('Sign out called');
    setUser(null);
  };
  
  const value = {
    user,
    signIn,
    signOut,
    loading
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
