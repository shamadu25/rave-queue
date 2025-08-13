import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralSettings } from '@/components/GeneralSettings';
import { DepartmentManagement } from '@/components/DepartmentManagement';
import UserManagement from '@/components/UserManagement';
import { useAuth } from '@/hooks/useAuth';

const Settings = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  
  // Show all tabs for all users (admins get full access anyway via RLS)
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="departments">Department Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>
        
        <TabsContent value="departments">
          <DepartmentManagement />
        </TabsContent>
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;