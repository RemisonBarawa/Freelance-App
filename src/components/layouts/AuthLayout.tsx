
import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { Outlet } from 'react-router-dom';

/**
 * Layout component that wraps route content with the AuthProvider
 */
const AuthLayout = () => {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
};

export default AuthLayout;
