// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from '../axios';
import { LoginResponse } from '../types/Auth';
import toast from 'react-hot-toast';

export type UserRole = 'Admin' | 'Manager' | 'User' | 'Customer';

interface AuthUser {
  username: string;
  initials: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  location: string;
  setLocation: (location: string) => void;
  login: (username: string, password: string) => Promise<{ requiresTwoFactor: boolean; username?: string }>;
  verify2FA: (username: string, code: string) => Promise<void>;
  logout: () => void;
  updateInitials: (initials: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys - centralized
const STORAGE_KEYS = {
  TOKEN: 'token',
  ROLE: 'role',
  USERNAME: 'username',
  INITIALS: 'initials',
} as const;

// Session storage key for location (session-long persistence)
const SESSION_KEYS = {
  LOCATION: 'selectedLocation',
} as const;

// Available locations
export const LOCATIONS = ['All', 'IN', 'TN'] as const;
export type LocationCode = typeof LOCATIONS[number];

// Helper to load initial state from localStorage
const loadStoredAuth = (): { user: AuthUser | null; token: string | null } => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const role = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole | null;
  const username = localStorage.getItem(STORAGE_KEYS.USERNAME);
  const initials = localStorage.getItem(STORAGE_KEYS.INITIALS);

  if (token && role && username) {
    return {
      token,
      user: {
        username,
        initials: initials || username.substring(0, 3).toUpperCase(),
        role,
      },
    };
  }

  return { user: null, token: null };
};

// Helper to save auth to localStorage
const saveAuthToStorage = (token: string, user: AuthUser) => {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.ROLE, user.role);
  localStorage.setItem(STORAGE_KEYS.USERNAME, user.username);
  localStorage.setItem(STORAGE_KEYS.INITIALS, user.initials);
};

// Helper to clear all auth from localStorage
const clearAuthFromStorage = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ROLE);
  localStorage.removeItem(STORAGE_KEYS.USERNAME);
  localStorage.removeItem(STORAGE_KEYS.INITIALS);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState(() => {
    const stored = loadStoredAuth();
    return {
      user: stored.user,
      token: stored.token,
      isLoading: false,
    };
  });

  // Location state with sessionStorage persistence
  const [location, setLocationState] = useState<string>(() => {
    return sessionStorage.getItem(SESSION_KEYS.LOCATION) || 'All';
  });

  const setLocation = useCallback((newLocation: string) => {
    sessionStorage.setItem(SESSION_KEYS.LOCATION, newLocation);
    setLocationState(newLocation);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<{ requiresTwoFactor: boolean; username?: string }> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const res = await axios.post<LoginResponse & { requiresTwoFactor?: boolean }>('/api/auth/login', {
        username,
        password,
      });

      // Check if 2FA is required
      if (res.data.requiresTwoFactor) {
        setState(prev => ({ ...prev, isLoading: false }));
        return { requiresTwoFactor: true, username: res.data.username || username };
      }

      // Normal login success
      const storedUsername = res.data.username || username;
      const initials = res.data.initials || storedUsername.substring(0, 3).toUpperCase();
      const role = (res.data.role as UserRole) || 'User';

      const user: AuthUser = {
        username: storedUsername,
        initials,
        role,
      };

      saveAuthToStorage(res.data.token, user);

      // Set default location from user preferences
      const defaultLoc = res.data.defaultLocation || 'All';
      sessionStorage.setItem(SESSION_KEYS.LOCATION, defaultLoc);
      setLocationState(defaultLoc);

      setState({
        user,
        token: res.data.token,
        isLoading: false,
      });

      return { requiresTwoFactor: false };
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw err;
    }
  }, []);

  const verify2FA = useCallback(async (username: string, code: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const res = await axios.post<LoginResponse>('/api/auth/2fa/verify', {
        username,
        code,
      });

      const storedUsername = res.data.username || username;
      const initials = res.data.initials || storedUsername.substring(0, 3).toUpperCase();
      const role = (res.data.role as UserRole) || 'User';

      const user: AuthUser = {
        username: storedUsername,
        initials,
        role,
      };

      saveAuthToStorage(res.data.token, user);

      // Set default location from user preferences
      const defaultLoc = res.data.defaultLocation || 'All';
      sessionStorage.setItem(SESSION_KEYS.LOCATION, defaultLoc);
      setLocationState(defaultLoc);

      setState({
        user,
        token: res.data.token,
        isLoading: false,
      });
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthFromStorage();
    setState({
      user: null,
      token: null,
      isLoading: false,
    });
  }, []);

  const updateInitials = useCallback((initials: string) => {
    setState(prev => {
      if (!prev.user) return prev;

      const updatedUser = { ...prev.user, initials };
      localStorage.setItem(STORAGE_KEYS.INITIALS, initials);

      return { ...prev, user: updatedUser };
    });
  }, []);

  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.TOKEN) {
        if (!e.newValue) {
          // Token was removed - log out
          setState({ user: null, token: null, isLoading: false });
        } else {
          // Token changed - reload auth state
          const stored = loadStoredAuth();
          setState({ user: stored.user, token: stored.token, isLoading: false });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value: AuthContextType = {
    user: state.user,
    token: state.token,
    isAuthenticated: !!state.token && !!state.user,
    isLoading: state.isLoading,
    location,
    setLocation,
    login,
    verify2FA,
    logout,
    updateInitials,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Main hook for components to use
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Convenience hooks (replaces old individual hooks)
export const useCurrentUser = (): string | null => {
  const { user } = useAuth();
  return user?.username || null;
};

export const useCurrentInitials = (): string | null => {
  const { user } = useAuth();
  return user?.initials || null;
};

export const useUserRole = (): UserRole => {
  const { user } = useAuth();
  return user?.role || 'User';
};

export const useLocation = (): { location: string; setLocation: (loc: string) => void } => {
  const { location, setLocation } = useAuth();
  return { location, setLocation };
};

// Role helpers
export const isAdmin = (role: UserRole): boolean => role === 'Admin';
export const isManager = (role: UserRole): boolean => role === 'Manager';
export const isCustomer = (role: UserRole): boolean => role === 'Customer';
export const canEdit = (role: UserRole): boolean => role === 'Admin' || role === 'Manager';
export const canDelete = (role: UserRole): boolean => role === 'Admin';
export const canCreate = (role: UserRole): boolean => role === 'Admin' || role === 'Manager';
