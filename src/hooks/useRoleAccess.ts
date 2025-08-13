import { useAuth } from './useAuth';
import { useSystemSettings } from './useSystemSettings';

export interface Permission {
  canManageUsers: boolean;
  canManageDepartments: boolean;
  canManageSettings: boolean;
  canGenerateTokens: boolean;
  canCallTokens: boolean;
  canViewAllTokens: boolean;
  canViewReports: boolean;
  canTransferTokens: boolean;
  canDeleteTokens: boolean;
  canManageRoles: boolean;
  allowedDepartments: string[];
}

export const useRoleAccess = () => {
  const { profile } = useAuth();
  const { settings } = useSystemSettings();

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
          canTransferTokens: false,
          canDeleteTokens: false,
          canManageRoles: false,
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
          canTransferTokens: true,
          canDeleteTokens: true,
          canManageRoles: true,
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
          canTransferTokens: false,
          canDeleteTokens: false,
          canManageRoles: false,
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
          canTransferTokens: true, // Can transfer within their scope
          canDeleteTokens: false,
          canManageRoles: false,
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
          canTransferTokens: true, // Can transfer within their scope
          canDeleteTokens: false,
          canManageRoles: false,
          allowedDepartments: [profile.department]
        };

      case 'viewer':
        return {
          canManageUsers: false,
          canManageDepartments: false,
          canManageSettings: false,
          canGenerateTokens: false,
          canCallTokens: false,
          canViewAllTokens: true, // Read-only access
          canViewReports: true, // Read-only access
          canTransferTokens: false,
          canDeleteTokens: false,
          canManageRoles: false,
          allowedDepartments: ['all'] // Can view all departments
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
          canTransferTokens: false,
          canDeleteTokens: false,
          canManageRoles: false,
          allowedDepartments: []
        };
    }
  };

  const permissions = getPermissions();

  const hasPermission = (permission: keyof Omit<Permission, 'allowedDepartments'>) => {
    // Admin always has all permissions
    if (profile?.role === 'admin') return true;
    return permissions[permission];
  };

  const canAccessDepartment = (departmentName: string) => {
    // Admin can access all departments
    if (profile?.role === 'admin') return true;
    
    // Check if allow all users setting is enabled
    const allowAllUsers = settings.allow_all_users_call_tokens === 'true' || settings.allow_all_users_call_tokens === true;
    if (allowAllUsers) return true;
    
    return permissions.allowedDepartments.includes('all') || 
           permissions.allowedDepartments.includes(departmentName);
  };

  const canCallTokensFromAnyDepartment = () => {
    // Admin always can
    if (profile?.role === 'admin') return true;
    
    // Check if allow all users setting is enabled
    const allowAllUsers = settings.allow_all_users_call_tokens === 'true' || settings.allow_all_users_call_tokens === true;
    return allowAllUsers;
  };

  const isAdmin = () => profile?.role === 'admin';
  const isReceptionist = () => profile?.role === 'receptionist';
  const isDepartmentStaff = () => ['doctor', 'nurse', 'staff'].includes(profile?.role || '');

  return {
    permissions,
    hasPermission,
    canAccessDepartment,
    canCallTokensFromAnyDepartment,
    isAdmin,
    isReceptionist,
    isDepartmentStaff,
    currentRole: profile?.role || 'guest'
  };
};