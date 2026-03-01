import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/auth';
import { onAuthStateChanged, signOut } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Setting up auth listener');
    try {
      const unsubscribe = onAuthStateChanged((currentUser) => {
        console.log('AuthContext: Auth state updated, user:', currentUser ? currentUser.uid : 'null');
        setUser(currentUser);
        setLoading(false);
      });

      return () => {
        console.log('AuthProvider: Cleaning up auth listener');
        unsubscribe?.();
      };
    } catch (error) {
      console.error('AuthProvider: Error setting up listener:', error);
      setLoading(false);
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error: any) {
      console.error('Sign out error:', error.message);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    signOut: handleSignOut,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
