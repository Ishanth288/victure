
import React, { createContext, useContext, useState, useEffect } from 'react';

// Define a type for the user
type User = {
  id: string;
  email: string;
} | null;

// Define the context type
type AuthContextType = {
  currentUser: User;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
};

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  updateEmail: async () => {},
  updatePassword: async () => {},
});

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  // Mock functions for authentication
  async function signup(email: string, password: string) {
    // In a real app, this would call a backend service
    console.log(`Signing up with ${email} and ${password}`);
    setCurrentUser({ id: '123', email });
  }

  async function login(email: string, password: string) {
    // In a real app, this would call a backend service
    console.log(`Logging in with ${email} and ${password}`);
    setCurrentUser({ id: '123', email });
  }

  async function logout() {
    // In a real app, this would call a backend service
    console.log('Logging out');
    setCurrentUser(null);
  }

  async function resetPassword(email: string) {
    // In a real app, this would call a backend service
    console.log(`Resetting password for ${email}`);
  }

  async function updateEmail(email: string) {
    // In a real app, this would call a backend service
    console.log(`Updating email to ${email}`);
    if (currentUser) {
      setCurrentUser({ ...currentUser, email });
    }
  }

  async function updatePassword(password: string) {
    // In a real app, this would call a backend service
    console.log(`Updating password to ${password}`);
  }

  useEffect(() => {
    // Simulate loading user data
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    logout,
    resetPassword,
    updateEmail,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
