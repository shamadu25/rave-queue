import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Shield, 
  Users, 
  Lock, 
  Unlock,
  Settings,
  ArrowRightLeft,
  Save,
  UserCheck,
  UserX,
  Building2
} from 'lucide-react';

export const RoleBasedAccess = () => {
  const { settings, loading, updateMultipleSettings } = useSystemSettings();
  const { profile } = useAuth();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  // Only admin can access this component
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    setFormData({
      staff_access_own_department: settings?.staff_access_own_department === true || settings?.staff_access_own_department === 'true',
      allow_cross_department_transfer: settings?.allow_cross_department_transfer === true || settings?.allow_cross_department_transfer === 'true',
      admin_only_settings: settings?.admin_only_settings === true || settings?.admin_only_settings === 'true'
    });
  }, [settings]);

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const saveAccessSettings = async () => {
    try {
      setSaving(true);
      
      const settingsToUpdate = Object.entries(formData)
        .filter(([key, value]) => key && value !== undefined)
        .map(([key, value]) => ({
          key,
          value: value,
          category: 'access'
        }));

      const success = await updateMultipleSettings(settingsToUpdate);
      
      if (success) {
        toast.success('✅ Access control settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving access settings:', error);
      toast.error('❌ Failed to save access settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
          <p className="text-muted-foreground">
            Only administrators can configure role-based access controls.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role-Based Access Control
          </h3>
          <p className="text-muted-foreground">Configure permissions and access levels for different user roles</p>
        </div>
        
        <Button
          onClick={saveAccessSettings}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Access Settings'}
        </Button>
      </div>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Current Session Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <p className="font-medium">{profile?.full_name}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Shield className="h-3 w-3" />
              {profile?.role}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Building2 className="h-3 w-3" />
              {profile?.department}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Staff Token Access Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Token Access Control
          </CardTitle>
          <CardDescription>
            Configure how staff members can interact with queue tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4" />
                <Label className="font-medium">Restrict to Own Department</Label>
                {formData.staff_access_own_department ? (
                  <Badge variant="destructive" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Restricted
                  </Badge>
                ) : (
                  <Badge variant="default" className="text-xs">
                    <Unlock className="h-3 w-3 mr-1" />
                    Open Access
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {formData.staff_access_own_department 
                  ? 'Staff can only view and manage tokens from their assigned department'
                  : 'Staff can view and manage tokens from any department (current setting)'
                }
              </p>
              
              <div className="text-xs bg-muted p-3 rounded-md">
                <p className="font-medium mb-1">Impact:</p>
                {formData.staff_access_own_department ? (
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Enhanced security and data isolation</li>
                    <li>• Staff see only relevant tokens</li>
                    <li>• Reduced confusion and accidental actions</li>
                    <li>• Better compliance for large facilities</li>
                  </ul>
                ) : (
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Maximum flexibility for small teams</li>
                    <li>• Staff can help with any department</li>
                    <li>• Cross-training and backup coverage</li>
                    <li>• Faster response during busy periods</li>
                  </ul>
                )}
              </div>
            </div>
            
            <Switch
              checked={formData.staff_access_own_department}
              onCheckedChange={(checked) => handleInputChange('staff_access_own_department', checked)}
              className="ml-4"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRightLeft className="h-4 w-4" />
                <Label className="font-medium">Cross-Department Transfer</Label>
                {formData.allow_cross_department_transfer ? (
                  <Badge variant="default" className="text-xs">
                    <Unlock className="h-3 w-3 mr-1" />
                    Allowed
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Blocked
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {formData.allow_cross_department_transfer
                  ? 'Staff can transfer tokens between different departments'
                  : 'Token transfers between departments are disabled'
                }
              </p>
              
              <div className="text-xs bg-muted p-3 rounded-md">
                <p className="font-medium mb-1">Use Cases:</p>
                {formData.allow_cross_department_transfer ? (
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Patient needs multiple services</li>
                    <li>• Referrals between departments</li>
                    <li>• Workflow optimization</li>
                    <li>• Emergency redirections</li>
                  </ul>
                ) : (
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Strict departmental boundaries</li>
                    <li>• Simplified audit trails</li>
                    <li>• Reduced transfer errors</li>
                    <li>• Clear responsibility chains</li>
                  </ul>
                )}
              </div>
            </div>
            
            <Switch
              checked={formData.allow_cross_department_transfer}
              onCheckedChange={(checked) => handleInputChange('allow_cross_department_transfer', checked)}
              className="ml-4"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4" />
                <Label className="font-medium">Admin-Only Settings Access</Label>
                {formData.admin_only_settings ? (
                  <Badge variant="default" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Secured
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <Unlock className="h-3 w-3 mr-1" />
                    Open
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {formData.admin_only_settings
                  ? 'Only administrators can access system settings and configurations'
                  : 'All logged-in users can access basic settings (not recommended)'
                }
              </p>
              
              <div className="text-xs bg-muted p-3 rounded-md">
                <p className="font-medium mb-1 text-amber-700">⚠️ Security Recommendation:</p>
                <p className="text-muted-foreground">
                  Keep this enabled to prevent unauthorized changes to critical system settings.
                  Only administrators should configure announcements, display settings, and access controls.
                </p>
              </div>
            </div>
            
            <Switch
              checked={formData.admin_only_settings}
              onCheckedChange={(checked) => handleInputChange('admin_only_settings', checked)}
              className="ml-4"
            />
          </div>
        </CardContent>
      </Card>

      {/* Role Definitions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            System Role Definitions
          </CardTitle>
          <CardDescription>
            Overview of permissions for each user role in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="default" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              </div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✅ Full system access</li>
                <li>✅ All queue management</li>
                <li>✅ Settings configuration</li>
                <li>✅ User management</li>
                <li>✅ Reports & analytics</li>
                <li>✅ Department management</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  Doctor
                </Badge>
              </div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✅ Queue token management</li>
                <li>✅ Token status updates</li>
                <li>✅ Transfer tokens</li>
                <li>✅ View department queue</li>
                <li>❌ System settings</li>
                <li>❌ User management</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Staff/Nurse
                </Badge>
              </div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✅ Queue token management</li>
                <li>✅ Token status updates</li>
                <li>✅ Transfer tokens*</li>
                <li>✅ View assigned queue</li>
                <li>❌ System settings</li>
                <li>❌ Department management</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Permissions marked with * are subject to the access control settings above. 
              Admin role always has full access regardless of these settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};