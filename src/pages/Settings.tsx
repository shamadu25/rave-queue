import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralSettings } from '@/components/GeneralSettings';
import { DepartmentManagement } from '@/components/DepartmentManagement';
import { useAuth } from '@/hooks/useAuth';

const Settings = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">General Settings</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="departments">Department Management</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>
        
        {isAdmin && (
          <TabsContent value="departments">
            <DepartmentManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;