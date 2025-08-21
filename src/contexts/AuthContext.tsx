'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { userOperations } from '@/lib/database';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, displayName?: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && user) {
        await updateProfile(user, { displayName });
      }
      
      // Create user profile in Realtime Database
      if (user) {
        try {
          const [firstName, lastName] = displayName ? displayName.split(' ') : ['', ''];
          await userOperations.createUser(user.uid, {
            username: displayName || email.split('@')[0],
            firstName: firstName || '',
            lastName: lastName || '',
            email: user.email,
            gender: '',
            photoURL: user.photoURL || ''
          });
        } catch (dbError) {
          console.warn('Database profile creation failed, but authentication succeeded:', dbError);
          // Don't throw error - auth succeeded even if DB write failed
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user profile exists, create if not
      if (result.user) {
        try {
          const existingUser = await userOperations.getUser(result.user.uid);
          if (!existingUser) {
            const [firstName, lastName] = result.user.displayName ? result.user.displayName.split(' ') : ['', ''];
            await userOperations.createUser(result.user.uid, {
              username: result.user.displayName || result.user.email?.split('@')[0] || '',
              firstName: firstName || '',
              lastName: lastName || '',
              email: result.user.email,
              gender: '',
              photoURL: result.user.photoURL || ''
            });
          }
        } catch (dbError) {
          console.warn('Database operations failed during Google login:', dbError);
          // Don't throw error - auth succeeded even if DB operations failed
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    loginWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
