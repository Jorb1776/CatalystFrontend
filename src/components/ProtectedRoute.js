import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ component: Component, roles }) => {
  const userRole = localStorage.getItem('role');
  if (!roles.includes(userRole)) {
    return <Navigate to="/products" />;
  }
  return <Component />;
};

export default ProtectedRoute;