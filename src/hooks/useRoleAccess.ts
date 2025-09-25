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

    // ALL logged-in users can now perform queue management actions
    const canDoQueueActions = true;
    const canViewAllTokens = true;
    const canAccessAllDepartments = true;

    switch (role) {
      case 'admin':
        return {
          canManageUsers: true,
          canManageDepartments: true,
          canManageSettings: true,
          canGenerateTokens: true,
          canCallTokens: canDoQueueActions,
          canViewAllTokens: canViewAllTokens,
          canViewReports: true,
          canTransferTokens: canDoQueueActions,
          canDeleteTokens: true, // Only admins can delete
          canManageRoles: true,
          allowedDepartments: ['all']
        };

      case 'receptionist':
        return {
          canManageUsers: false,
          canManageDepartments: false,
          canManageSettings: false,
          canGenerateTokens: true,
          canCallTokens: canDoQueueActions,
          canViewAllTokens: canViewAllTokens,
          canViewReports: false,
          canTransferTokens: canDoQueueActions,
          canDeleteTokens: false,
          canManageRoles: false,
          allowedDepartments: ['all']
        };

      case 'doctor':
      case 'nurse':
      case 'staff':
        return {
          canManageUsers: false,
          canManageDepartments: false,
          canManageSettings: false,
          canGenerateTokens: false,
          canCallTokens: canDoQueueActions,
          canViewAllTokens: canViewAllTokens,
          canViewReports: false,
          canTransferTokens: canDoQueueActions,
          canDeleteTokens: false,
          canManageRoles: false,
          allowedDepartments: canAccessAllDepartments ? ['all'] : [profile.department]
        };

      case 'viewer':
        return {
          canManageUsers: false,
          canManageDepartments: false,
          canManageSettings: false,
          canGenerateTokens: false,
          canCallTokens: canDoQueueActions,
          canViewAllTokens: canViewAllTokens,
          canViewReports: true,
          canTransferTokens: canDoQueueActions,
          canDeleteTokens: false,
          canManageRoles: false,
          allowedDepartments: ['all']
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

  const canTransferToAnyDepartment = () => {
    // Admin and Reception can transfer to any department
    if (profile?.role === 'admin' || profile?.role === 'receptionist') return true;
    
    // Department staff can transfer tokens to any department (but can only view/call in their own)
    if (['doctor', 'nurse', 'staff'].includes(profile?.role || '')) return true;
    
    return false;
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
    canTransferToAnyDepartment,
    isAdmin,
    isReceptionist,
    isDepartmentStaff,
    currentRole: profile?.role || 'guest'
  };
};