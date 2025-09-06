import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertCircle } from 'lucide-react';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
  fallback?: React.ReactNode;
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  requiredRole = [],
  fallback
}) => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/auth" replace />;
  }

  const hasAccess = requiredRole.length === 0 || requiredRole.includes(profile.role);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access this section. Contact your administrator if you believe this is an error.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Current role: {profile.role}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};