import { useAuth } from './useAuth';

export interface Permission {
  canManageUsers: boolean;
  canManageDepartments: boolean;
  canManageSettings: boolean;
  canGenerateTokens: boolean;
  canCallTokens: boolean;
  canViewAllTokens: boolean;
  canViewReports: boolean;
  allowedDepartments: string[];
}

export const useRoleAccess = () => {
  const { profile } = useAuth();

  const getPermissions = (): Permission => {
    if (!profile) {
      return {
        canManageUsers: false,
        canManageDepartments: false,
        canManageSettings: false,
        canGenerateTokens: false,
        canCallTokens: false,
        canViewAllTokens: false,
        canViewReports: false,
        allowedDepartments: []
      };
    }

    const role = profile.role;

    switch (role) {
      case 'admin':
        return {
          canManageUsers: true,
          canManageDepartments: true,
          canManageSettings: true,
          canGenerateTokens: true,
          canCallTokens: true,
          canViewAllTokens: true,
          canViewReports: true,
          allowedDepartments: ['all'] // Admin can access all departments
        };

      case 'receptionist':
        return {
          canManageUsers: false,
          canManageDepartments: false,
          canManageSettings: false,
          canGenerateTokens: true,
          canCallTokens: false,
          canViewAllTokens: true,
          canViewReports: false,
          allowedDepartments: ['all'] // Receptionist can generate tokens for all departments
        };

      case 'doctor':
      case 'nurse':
        return {
          canManageUsers: false,
          canManageDepartments: false,
          canManageSettings: false,
          canGenerateTokens: false,
          canCallTokens: true,
          canViewAllTokens: false,
          canViewReports: false,
          allowedDepartments: [profile.department] // Can only access their assigned department
        };

      case 'staff':
        return {
          canManageUsers: false,
          canManageDepartments: false,
          canManageSettings: false,
          canGenerateTokens: false,
          canCallTokens: true,
          canViewAllTokens: false,
          canViewReports: false,
          allowedDepartments: [profile.department]
        };

      default:
        return {
          canManageUsers: false,
          canManageDepartments: false,
          canManageSettings: false,
          canGenerateTokens: false,
          canCallTokens: false,
          canViewAllTokens: false,
          canViewReports: false,
          allowedDepartments: []
        };
    }
  };

  const permissions = getPermissions();

  const hasPermission = (permission: keyof Omit<Permission, 'allowedDepartments'>) => {
    return permissions[permission];
  };

  const canAccessDepartment = (departmentName: string) => {
    return permissions.allowedDepartments.includes('all') || 
           permissions.allowedDepartments.includes(departmentName);
  };

  const isAdmin = () => profile?.role === 'admin';
  const isReceptionist = () => profile?.role === 'receptionist';
  const isDepartmentStaff = () => ['doctor', 'nurse', 'staff'].includes(profile?.role || '');

  return {
    permissions,
    hasPermission,
    canAccessDepartment,
    isAdmin,
    isReceptionist,
    isDepartmentStaff,
    currentRole: profile?.role || 'guest'
  };
};