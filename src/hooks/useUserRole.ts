// src/hooks/useUserRole.ts
import { useState, useEffect } from 'react';

export type UserRole = 'Admin' | 'Customer' | 'User';

export const useUserRole = (): UserRole => {
  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem('role') as UserRole) || 'User';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setRole((localStorage.getItem('role') as UserRole) || 'User');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return role;
};

export const isAdmin = (role: UserRole): boolean => role === 'Admin';
export const isCustomer = (role: UserRole): boolean => role === 'Customer';
export const canEdit = (role: UserRole): boolean => role === 'Admin';
export const canDelete = (role: UserRole): boolean => role === 'Admin';
export const canCreate = (role: UserRole): boolean => role === 'Admin';
