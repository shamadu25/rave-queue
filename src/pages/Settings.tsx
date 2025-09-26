import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopBar } from '@/components/TopBar';
import { GeneralSettings } from '@/components/GeneralSettings';
import { DepartmentManagement } from '@/components/DepartmentManagement';
import UserManagement from '@/components/UserManagement';
import { EnterpriseAdminSettings } from '@/components/EnterpriseAdminSettings';
import { ServiceFlowManagement } from '@/components/ServiceFlowManagement';
import { useAuth } from '@/hooks/useAuth';
import { Settings } from 'lucide-react';

const SettingsPage = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  
  // Show enterprise settings for admins, limited for others
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
        {/* Premium Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.3),transparent_50%)]"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.2),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KPGcgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjA1Ij4KPHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+CjwvZz4KPC9nPgo8L3N2Zz4=')] opacity-30"></div>
        </div>

        {/* Premium Header */}
        <div className="relative z-10 bg-gradient-to-r from-blue-600/95 via-indigo-600/95 to-blue-700/95 backdrop-blur-lg border-b border-white/20 shadow-2xl">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1 tracking-tight">
                    System Settings
                  </h1>
                  <p className="text-lg text-blue-100 font-medium">
                    Comprehensive hospital system configuration
                  </p>
                </div>
              </div>
              <div className="text-right text-white/90">
                <div className="text-sm font-medium mb-1">SETTINGS PANEL</div>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">
          <div className="glass-card shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
            <Tabs defaultValue="enterprise" className="space-y-8">
              <TabsList className="grid w-full grid-cols-5 bg-white/10 backdrop-blur-sm border-white/20 rounded-2xl p-2 h-14">
                <TabsTrigger value="enterprise" className="text-white font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl">
                  Enterprise Settings
                </TabsTrigger>
                <TabsTrigger value="general" className="text-white font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl">
                  General Settings
                </TabsTrigger>
                <TabsTrigger value="departments" className="text-white font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl">
                  Department Management
                </TabsTrigger>
                <TabsTrigger value="flows" className="text-white font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl">
                  Service Flows
                </TabsTrigger>
                <TabsTrigger value="users" className="text-white font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl">
                  User Management
                </TabsTrigger>
              </TabsList>
            
              <TabsContent value="enterprise" className="bg-white/5 rounded-xl border border-white/20 p-6">
                <EnterpriseAdminSettings />
              </TabsContent>
              
              <TabsContent value="general" className="bg-white/5 rounded-xl border border-white/20 p-6">
                <GeneralSettings />
              </TabsContent>
              
              <TabsContent value="departments" className="bg-white/5 rounded-xl border border-white/20 p-6">
                <DepartmentManagement />
              </TabsContent>

              <TabsContent value="flows" className="bg-white/5 rounded-xl border border-white/20 p-6">
                <ServiceFlowManagement />
              </TabsContent>

              <TabsContent value="users" className="bg-white/5 rounded-xl border border-white/20 p-6">
                <UserManagement />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  // Limited access for non-admin users
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
      {/* Premium Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.3),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.2),transparent_50%)]"></div>
      </div>

      {/* Premium Header */}
      <div className="relative z-10 bg-gradient-to-r from-blue-600/95 via-indigo-600/95 to-blue-700/95 backdrop-blur-lg border-b border-white/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white mb-1 tracking-tight">Settings</h1>
                <p className="text-lg text-blue-100 font-medium">Basic system settings</p>
              </div>
            </div>
            <div className="text-right text-white/90">
              <div className="text-sm font-medium mb-1">LIMITED ACCESS</div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="glass-card shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
          <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-yellow-100 mb-2">Limited Access</h2>
            <p className="text-yellow-200">You have restricted access to settings. Contact your administrator for full system configuration.</p>
          </div>
        
          <Tabs defaultValue="general" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm border-white/20 rounded-2xl p-2 h-14">
              <TabsTrigger value="general" className="text-white font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl">
                Basic Settings
              </TabsTrigger>
              <TabsTrigger value="departments" className="text-white font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl">
                Department Info
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="bg-white/5 rounded-xl border border-white/20 p-6">
              <GeneralSettings />
            </TabsContent>
            
            <TabsContent value="departments" className="bg-white/5 rounded-xl border border-white/20 p-6">
              <DepartmentManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;