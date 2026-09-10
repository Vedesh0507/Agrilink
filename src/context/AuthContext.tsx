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
  loginWithEmail: (email: string, password: string) => Promise<void>;
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
    // Check local storage for demo hackathon session or listen to Firebase
    const savedDemoUser = localStorage.getItem('agrilink_active_user');
    const savedToken = localStorage.getItem('agrilink_active_token');

    if (savedDemoUser && savedToken) {
      try {
        const parsed = JSON.parse(savedDemoUser);
        setUser(parsed);
        setToken(savedToken);
      } catch (e) {
        localStorage.removeItem('agrilink_active_user');
        localStorage.removeItem('agrilink_active_token');
      }
    }

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
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);
      localStorage.setItem('agrilink_active_token', idToken);
      await fetchUserProfile(idToken);
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      const idToken = await fbUser.getIdToken();
      setToken(idToken);

      // Create profile in MongoDB
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          firebaseUid: fbUser.uid,
          email: fbUser.email,
          ...profile,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        localStorage.setItem('agrilink_active_user', JSON.stringify(data.data));
        localStorage.setItem('agrilink_active_token', idToken);
      } else {
        throw new Error(data.error || 'Failed to create profile');
      }
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

  /**
   * Fast Demo Login switcher for the Hackathon Judges:
   * Instantly loads pre-seeded Farmer A, Institutional Buyer, or Ops Admin
   * from MongoDB with full authenticated session state.
   */
  const demoLogin = async (role: 'FARMER' | 'BUYER' | 'ADMIN') => {
    setLoading(true);
    try {
      const emailMap = {
        FARMER: 'ramesh.farmer@agrilink.in',
        BUYER: 'procurement@godavarifresh.in',
        ADMIN: 'ops@agrilink.in',
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
      console.error('Demo login switch error:', err);
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
