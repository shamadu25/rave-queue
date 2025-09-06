import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { RoleBasedRoute } from '@/components/RoleBasedRoute';
import Settings from '@/pages/Settings';
import UserManagement from '@/components/UserManagement';
import { DepartmentManagement } from '@/components/DepartmentManagement';
import { ReportsAnalytics } from '@/components/ReportsAnalytics';

// Enterprise role-based routing configuration
export const EnterpriseRoutes = () => {
  return (
    <Routes>
      {/* Admin-only routes */}
      <Route
        path="/settings"
        element={
          <RoleBasedRoute requiredRole={['admin']}>
            <Settings />
          </RoleBasedRoute>
        }
      />
      
      <Route
        path="/users"
        element={
          <RoleBasedRoute requiredRole={['admin']}>
            <UserManagement />
          </RoleBasedRoute>
        }
      />
      
      <Route
        path="/departments"
        element={
          <RoleBasedRoute requiredRole={['admin', 'receptionist']}>
            <DepartmentManagement />
          </RoleBasedRoute>
        }
      />
      
      <Route
        path="/reports"
        element={
          <RoleBasedRoute requiredRole={['admin', 'doctor', 'receptionist']}>
            <ReportsAnalytics entries={[]} />
          </RoleBasedRoute>
        }
      />
    </Routes>
  );
};

// Enhanced role permissions for enterprise features
export const useEnterpriseRoleAccess = () => {
  const checkAccess = (userRole: string, requiredRoles: string[]) => {
    return requiredRoles.includes(userRole);
  };

  const getAccessLevel = (userRole: string) => {
    switch (userRole) {
      case 'admin':
        return {
          canManageUsers: true,
          canManageDepartments: true,
          canManageSettings: true,
          canViewReports: true,
          canManageQueue: true,
          canCallTokens: true,
          canTransferTokens: true,
          canDeleteTokens: true,
          fullAccess: true
        };
      case 'doctor':
        return {
          canManageUsers: false,
          canManageDepartments: false,
          canManageSettings: false,
          canViewReports: true,
          canManageQueue: true,
          canCallTokens: true,
          canTransferTokens: true,
          canDeleteTokens: false,
          fullAccess: false
        };
      case 'nurse':
        return {
          canManageUsers: false,
          canManageDepartments: false,
          canManageSettings: false,
          canViewReports: false,
          canManageQueue: true,
          canCallTokens: true,
          canTransferTokens: true,
          canDeleteTokens: false,
          fullAccess: false
        };
      case 'receptionist':
        return {
          canManageUsers: false,
          canManageDepartments: true,
          canManageSettings: false,
          canViewReports: true,
          canManageQueue: true,
          canCallTokens: true,
          canTransferTokens: true,
          canDeleteTokens: false,
          fullAccess: false
        };
      case 'staff':
        return {
          canManageUsers: false,
          canManageDepartments: false,
          canManageSettings: false,
          canViewReports: false,
          canManageQueue: true,
          canCallTokens: true,
          canTransferTokens: false,
          canDeleteTokens: false,
          fullAccess: false
        };
      default:
        return {
          canManageUsers: false,
          canManageDepartments: false,
          canManageSettings: false,
          canViewReports: false,
          canManageQueue: false,
          canCallTokens: false,
          canTransferTokens: false,
          canDeleteTokens: false,
          fullAccess: false
        };
    }
  };

  return { checkAccess, getAccessLevel };
};