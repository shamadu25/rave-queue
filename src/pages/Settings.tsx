import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralSettings } from '@/components/GeneralSettings';
import { DepartmentManagement } from '@/components/DepartmentManagement';
import UserManagement from '@/components/UserManagement';
import { EnterpriseAdminSettings } from '@/components/EnterpriseAdminSettings';
import { ServiceFlowManagement } from '@/components/ServiceFlowManagement';
import { useAuth } from '@/hooks/useAuth';

const Settings = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  
  // Show enterprise settings for admins, limited for others
  if (isAdmin) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
          <Tabs defaultValue="enterprise" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="enterprise">Enterprise Settings</TabsTrigger>
              <TabsTrigger value="general">General Settings</TabsTrigger>
              <TabsTrigger value="departments">Department Management</TabsTrigger>
              <TabsTrigger value="flows">Service Flows</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
            </TabsList>
          
          <TabsContent value="enterprise">
            <EnterpriseAdminSettings />
          </TabsContent>
          
          <TabsContent value="general">
            <GeneralSettings />
          </TabsContent>
          
            <TabsContent value="departments">
              <DepartmentManagement />
            </TabsContent>

            <TabsContent value="flows">
              <ServiceFlowManagement />
            </TabsContent>

            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Limited access for non-admin users
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">Limited Access</h2>
        <p className="text-yellow-700">
          You have restricted access to settings. Contact your administrator for full system configuration.
        </p>
      </div>
      
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">Basic Settings</TabsTrigger>
          <TabsTrigger value="departments">Department Info</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>
        
        <TabsContent value="departments">
          <DepartmentManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;