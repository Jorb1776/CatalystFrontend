// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  component: React.FC;
  roles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component, roles }) => {
  const userRole = localStorage.getItem('role');
  return roles.includes(userRole!) ? <Component /> : <Navigate to="/products" />;
};

export default ProtectedRoute;