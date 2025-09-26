import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopBar } from '@/components/TopBar';
import { GeneralSettings } from '@/components/GeneralSettings';
import { DepartmentManagement } from '@/components/DepartmentManagement';
import UserManagement from '@/components/UserManagement';
import { EnterpriseAdminSettings } from '@/components/EnterpriseAdminSettings';
import { ServiceFlowManagement } from '@/components/ServiceFlowManagement';
import { QueueDisplaySettings } from '@/components/QueueDisplaySettings';
import { EnhancedAnnouncementSettings } from '@/components/EnhancedAnnouncementSettings';
import { EnhancedTicketTemplateSettings } from '@/components/EnhancedTicketTemplateSettings';
import { EnhancedPrintSettings } from '@/components/EnhancedPrintSettings';
import { ReportsAnalytics } from '@/components/ReportsAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { useQueueMonitor } from '@/hooks/useQueueMonitor';
import { Settings } from 'lucide-react';

const SettingsPage = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('general');
  const { entries } = useQueueMonitor();

  // Handle URL tab parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              {/* Main Tabs Row */}
              <TabsList className="grid w-full grid-cols-5 bg-white/10 backdrop-blur-sm border-white/20 rounded-2xl p-2 h-14">
                <TabsTrigger value="general" className="text-white font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl">
                  General
                </TabsTrigger>
                <TabsTrigger value="enterprise" className="text-white font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl">
                  Enterprise
                </TabsTrigger>
                <TabsTrigger value="departments" className="text-white font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl">
                  Departments
                </TabsTrigger>
                <TabsTrigger value="users" className="text-white font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl">
                  Users
                </TabsTrigger>
                <TabsTrigger value="flows" className="text-white font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl">
                  Workflows
                </TabsTrigger>
              </TabsList>

              {/* Secondary Tabs Row */}
              <TabsList className="grid w-full grid-cols-5 bg-white/10 backdrop-blur-sm border-white/20 rounded-2xl p-2 h-14">
                <TabsTrigger value="display" className="text-white font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl">
                  Display
                </TabsTrigger>
                <TabsTrigger value="announcements" className="text-white font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl">
                  Announcements
                </TabsTrigger>
                <TabsTrigger value="tickets" className="text-white font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl">
                  Tickets
                </TabsTrigger>
                <TabsTrigger value="print" className="text-white font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl">
                  Printing
                </TabsTrigger>
                <TabsTrigger value="reports" className="text-white font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl">
                  Reports
                </TabsTrigger>
              </TabsList>
            
              {/* Tab Content */}
              <TabsContent value="general" className="bg-white/5 rounded-xl border border-white/20 p-6">
                <GeneralSettings />
              </TabsContent>

              <TabsContent value="enterprise" className="bg-white/5 rounded-xl border border-white/20 p-6">
                <EnterpriseAdminSettings />
              </TabsContent>
              
              <TabsContent value="departments" className="bg-white/5 rounded-xl border border-white/20 p-6">
                <DepartmentManagement />
              </TabsContent>

              <TabsContent value="users" className="bg-white/5 rounded-xl border border-white/20 p-6">
                <UserManagement />
              </TabsContent>

              <TabsContent value="flows" className="bg-white/5 rounded-xl border border-white/20 p-6">
                <ServiceFlowManagement />
              </TabsContent>

              <TabsContent value="display" className="bg-white/5 rounded-xl border border-white/20 p-6">
                <QueueDisplaySettings />
              </TabsContent>

              <TabsContent value="announcements" className="bg-white/5 rounded-xl border border-white/20 p-6">
                <EnhancedAnnouncementSettings />
              </TabsContent>

              <TabsContent value="tickets" className="bg-white/5 rounded-xl border border-white/20 p-6">
                <EnhancedTicketTemplateSettings />
              </TabsContent>

              <TabsContent value="print" className="bg-white/5 rounded-xl border border-white/20 p-6">
                <EnhancedPrintSettings />
              </TabsContent>

              <TabsContent value="reports" className="bg-white/5 rounded-xl border border-white/20 p-6">
                <ReportsAnalytics entries={entries || []} />
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
                <h1 className="text-3xl font-black text-white mb-1 tracking-tight">Access Restricted</h1>
                <p className="text-lg text-blue-100 font-medium">Admin privileges required for system settings</p>
              </div>
            </div>
            <div className="text-right text-white/90">
              <div className="text-sm font-medium mb-1">ACCESS DENIED</div>
              <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="glass-card shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
          <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-8 text-center">
            <Settings className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-100 mb-4">Admin Access Required</h2>
            <p className="text-red-200 text-lg mb-6">You need administrator privileges to access system settings and configuration options.</p>
            <div className="bg-red-400/20 rounded-lg p-4 mb-6">
              <p className="text-red-100 font-medium">Current Role: {profile?.role || 'Unknown'}</p>
              <p className="text-red-200 text-sm mt-1">Required Role: admin</p>
            </div>
            <p className="text-red-300">Please contact your system administrator to request access or upgrade your account permissions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;