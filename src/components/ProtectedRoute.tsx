import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoleAccess } from '@/hooks/useRoleAccess';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: keyof Omit<import('@/hooks/useRoleAccess').Permission, 'allowedDepartments'>;
  allowedRoles?: string[];
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  allowedRoles,
  fallbackPath = '/'
}) => {
  const { user, loading } = useAuth();
  const { hasPermission, currentRole, isAdmin } = useRoleAccess();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admin bypasses all role and permission checks
  if (isAdmin()) {
    return <>{children}</>;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};