'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { IUser, UserRole } from '@/types';

interface AuthContextType {
  user: IUser | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  role: UserRole | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string, portalRole?: 'FARMER' | 'BUYER') => Promise<IUser | null>;
  registerWithEmail: (
    email: string,
    password: string,
    profile: {
      name: string;
      role: UserRole;
      location: string;
      phone?: string;
      organizationName?: string;
      organizationType?: string;
      primaryCrops?: string;
      capacity?: string;
      gstin?: string;
    }
  ) => Promise<IUser | null>;
  loginWithGoogle: (rolePreference?: 'FARMER' | 'BUYER') => Promise<{ needsProfile?: boolean; googleUser?: any; user?: IUser } | null>;
  completeGoogleProfile: (profileData: any) => Promise<IUser | null>;
  logout: () => Promise<void>;
  demoLogin: (role: 'FARMER' | 'BUYER' | 'ADMIN') => Promise<IUser | null>;
  refreshProfile: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<IUser | null>;
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

  const loginWithEmail = async (email: string, password: string, portalRole?: 'FARMER' | 'BUYER'): Promise<IUser | null> => {
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      // Server-side verification and lookup via MongoDB
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password, role: portalRole }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        // Background sync to Firebase client auth if possible (silent)
        try {
          await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        } catch (e) {
          // Firebase account already exists or sync ok
        }

        setUser(data.user);
        setToken(data.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('agrilink_active_user', JSON.stringify(data.user));
          localStorage.setItem('agrilink_active_token', data.token);
        }
        return data.user;
      }

      // If backend explicitly returned an error (e.g. invalid password or user not found)
      if (data.error) {
        throw new Error(data.error);
      }

      throw new Error('Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    password: string,
    profile: {
      name: string;
      role: UserRole;
      location: string;
      phone?: string;
      organizationName?: string;
      organizationType?: string;
      primaryCrops?: string;
      capacity?: string;
      gstin?: string;
    }
  ): Promise<IUser | null> => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...profile }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
        } catch (e) {
          // Firebase account already exists or sync ok
        }

        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('agrilink_active_user', JSON.stringify(data.user));
        localStorage.setItem('agrilink_active_token', data.token);
        return data.user;
      }

      throw new Error(data.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (
    rolePreference: 'FARMER' | 'BUYER' = 'FARMER'
  ): Promise<{ needsProfile?: boolean; googleUser?: any; user?: IUser } | null> => {
    setLoading(true);
    try {
      let userCredential;
      try {
        userCredential = await signInWithPopup(auth, googleProvider);
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/internal-error' || fbErr.message?.includes('auth/internal-error')) {
          throw new Error('Google sign-in popup was blocked or interrupted by browser security settings. Please allow popups/cookies for localhost, or sign in below using your email and password.');
        } else if (fbErr.code === 'auth/popup-closed-by-user' || fbErr.message?.includes('popup-closed-by-user')) {
          throw new Error('Google sign-in window was closed before completing.');
        } else if (fbErr.code === 'auth/popup-blocked' || fbErr.message?.includes('popup-blocked')) {
          throw new Error('Google sign-in popup was blocked. Please allow popups for localhost:3000.');
        }
        throw new Error(fbErr.message || 'Failed to authenticate with Google');
      }

      const fbUser = userCredential.user;
      const idToken = await fbUser.getIdToken();

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          firebaseUid: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName || 'Google User',
          photoURL: fbUser.photoURL,
          role: rolePreference,
        }),
      });

      const data = await res.json();

      if (data.needsProfile) {
        return {
          needsProfile: true,
          googleUser: {
            ...data.googleUser,
            idToken,
          },
        };
      }

      if (data.success && data.user) {
        setUser(data.user);
        setToken(data.token || idToken);
        if (typeof window !== 'undefined') {
          localStorage.setItem('agrilink_active_user', JSON.stringify(data.user));
          localStorage.setItem('agrilink_active_token', data.token || idToken);
        }
        return { user: data.user, needsProfile: false };
      }

      throw new Error(data.error || 'Failed to authenticate with Google');
    } finally {
      setLoading(false);
    }
  };

  const completeGoogleProfile = async (profileData: any): Promise<IUser | null> => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: profileData.idToken ? `Bearer ${profileData.idToken}` : '',
        },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setToken(data.token || profileData.idToken);
        localStorage.setItem('agrilink_active_user', JSON.stringify(data.user));
        localStorage.setItem('agrilink_active_token', data.token || profileData.idToken);
        return data.user;
      }

      throw new Error(data.error || 'Failed to complete profile');
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

  const demoLogin = async (role: 'FARMER' | 'BUYER' | 'ADMIN'): Promise<IUser | null> => {
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
        return data.user;
      }
      return null;
    } catch (err) {
      console.error('Login error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchUserProfile(token);
    }
  };

  const updateProfile = async (profileData: any): Promise<IUser | null> => {
    setLoading(true);
    try {
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('agrilink_active_token') : null);
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: activeToken ? `Bearer ${activeToken}` : '',
        },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('agrilink_active_user', JSON.stringify(data.data));
        }
        return data.data;
      }
      throw new Error(data.error || 'Failed to update profile');
    } finally {
      setLoading(false);
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
        loginWithGoogle,
        completeGoogleProfile,
        logout,
        demoLogin,
        refreshProfile,
        updateProfile,
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
