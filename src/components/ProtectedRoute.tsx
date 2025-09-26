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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="mt-2 text-white/80">Loading...</p>
        </div>
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