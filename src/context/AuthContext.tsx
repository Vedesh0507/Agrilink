'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { IUser, UserRole } from '@/types';

interface AuthContextType {
  user: IUser | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  role: UserRole | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string, portalRole?: 'FARMER' | 'BUYER') => Promise<void>;
  registerWithEmail: (email: string, password: string, profile: { name: string; role: UserRole; location: string; phone?: string; organizationName?: string }) => Promise<void>;
  logout: () => Promise<void>;
  demoLogin: (role: 'FARMER' | 'BUYER' | 'ADMIN') => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from MongoDB given token
  const fetchUserProfile = async (idToken: string) => {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('agrilink_active_user');
    const savedToken = localStorage.getItem('agrilink_active_token');

    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setToken(savedToken);
      } catch (e) {
        localStorage.removeItem('agrilink_active_user');
        localStorage.removeItem('agrilink_active_token');
      }
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          try {
            const idToken = await fbUser.getIdToken();
            setToken(idToken);
            localStorage.setItem('agrilink_active_token', idToken);
            await fetchUserProfile(idToken);
          } catch (e) {
            console.error('Error getting Firebase token:', e);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      setLoading(false);
    }
  }, []);

  const loginWithEmail = async (email: string, password: string, portalRole?: 'FARMER' | 'BUYER') => {
    setLoading(true);
    try {
      // First attempt server-side verification and lookup
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: portalRole }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('agrilink_active_user', JSON.stringify(data.user));
        localStorage.setItem('agrilink_active_token', data.token);
        return;
      }

      // If backend fails, try Firebase client auth if available
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();
        setToken(idToken);
        localStorage.setItem('agrilink_active_token', idToken);
        await fetchUserProfile(idToken);
      } catch (fbErr: any) {
        throw new Error(data.error || fbErr.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    password: string,
    profile: { name: string; role: UserRole; location: string; phone?: string; organizationName?: string }
  ) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...profile }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('agrilink_active_user', JSON.stringify(data.user));
        localStorage.setItem('agrilink_active_token', data.token);
        return;
      }

      throw new Error(data.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('agrilink_active_user');
    localStorage.removeItem('agrilink_active_token');
    setUser(null);
    setFirebaseUser(null);
    setToken(null);
  };

  const demoLogin = async (role: 'FARMER' | 'BUYER' | 'ADMIN') => {
    setLoading(true);
    try {
      const emailMap = {
        FARMER: 'ramesh.farmer@agrilink.in',
        BUYER: 'procurement@godavarifresh.in',
        ADMIN: 'pavanmanpealli521@gmail.com',
      };

      const email = emailMap[role];
      const res = await fetch(`/api/auth/demo-switch?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (data.success && data.user) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('agrilink_active_user', JSON.stringify(data.user));
        localStorage.setItem('agrilink_active_token', data.token);
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchUserProfile(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        token,
        role: user?.role || null,
        loading,
        loginWithEmail,
        registerWithEmail,
        logout,
        demoLogin,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
