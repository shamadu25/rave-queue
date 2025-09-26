import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopBar } from '@/components/TopBar';
import { useAuth } from '@/hooks/useAuth';
import { useQueueMonitor } from '@/hooks/useQueueMonitor';
import { TransferModal } from '@/components/TransferModal';
import { ModernQueueList } from '@/components/ModernQueueList';
import { ReportsAnalytics } from '@/components/ReportsAnalytics';
import { GeneralSettings } from '@/components/GeneralSettings';
import { Department, Status } from '@/types/queue';
import { toast } from 'sonner';

// Helper function to determine what department filter to apply based on role
const getUserDepartmentFilter = (role?: string, department?: string): string | undefined => {
  if (!role || !department) return undefined;
  
  switch (role) {
    case 'admin':
    case 'receptionist':
      return undefined; // See all departments
    default:
      return department; // Use user's actual assigned department
  }
};

export default function QueueMonitor() {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const [transferModal, setTransferModal] = useState<{
    isOpen: boolean;
    entryId: string;
    currentDepartment: Department;
    patientName: string;
    token: string;
  }>({
    isOpen: false,
    entryId: '',
    currentDepartment: 'Consultation',
    patientName: '',
    token: ''
  });

  // Get filtered entries based on user role and department
  const { entries, loading, updateStatus, transferEntry, deleteEntry } = useQueueMonitor(
    getUserDepartmentFilter(profile?.role, profile?.department)
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }


  const handleStatusUpdate = async (entryId: string, newStatus: Status) => {
    try {
      await updateStatus(entryId, newStatus, profile?.id);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleTransfer = async (toDepartment: Department, reason?: string) => {
    try {
      await transferEntry(transferModal.entryId, toDepartment, profile?.id || '', reason);
      toast.success(`Patient transferred to ${toDepartment}`);
      setTransferModal(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      toast.error('Failed to transfer patient');
    }
  };

  const handleOpenTransferModal = (entryId: string, currentDepartment: Department, patientName: string, token: string) => {
    setTransferModal({
      isOpen: true,
      entryId,
      currentDepartment,
      patientName,
      token
    });
  };

  const handleDelete = async (entryId: string) => {
    try {
      await deleteEntry(entryId);
      toast.success('Queue entry deleted successfully');
    } catch (error) {
      toast.error('Failed to delete queue entry');
    }
  };

  // Determine queue display configuration based on user role
  const getQueueConfig = () => {
    const role = profile?.role;
    const department = profile?.department;
    
    switch (role) {
      case 'admin':
        return {
          title: 'Admin Dashboard - All Queues',
          description: 'Monitor and manage all department queues with full access controls',
          canFilter: true,
          canPerformActions: true
        };
      case 'receptionist':
        return {
          title: 'Reception Desk - Queue Overview',
          description: 'View all patient queues across departments (view-only access)',
          canFilter: true,
          canPerformActions: false
        };
      default:
        return {
          title: `${department} Queue`,
          description: `Manage patients in the ${department} department`,
          canFilter: false,
          canPerformActions: true
        };
    }
  };

  const queueConfig = getQueueConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
      {/* Premium Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.3),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.2),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KPGcgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjA1Ij4KPHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+CjwvZz4KPC9nPgo8L3N2Zz4=')] opacity-30"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">

      {/* Main Content */}
      {profile?.role === 'admin' ? (
        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm border-white/20 rounded-2xl p-2 h-14">
            <TabsTrigger 
              value="queue" 
              className="text-white font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl transition-all duration-200"
            >
              Queue Management
            </TabsTrigger>
            <TabsTrigger 
              value="reports"
              className="text-white font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl transition-all duration-200"
            >
              Reports & Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="text-white font-semibold data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl transition-all duration-200"
            >
              General Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="queue" className="mt-8">
            <div className="glass-card shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
              <ModernQueueList
                entries={entries}
                title={queueConfig.title}
                description={queueConfig.description}
                canFilter={queueConfig.canFilter}
                canPerformActions={queueConfig.canPerformActions}
                userRole={profile?.role}
                userDepartment={profile?.department}
                onUpdateStatus={handleStatusUpdate}
                onTransfer={handleOpenTransferModal}
                onDelete={handleDelete}
                loading={loading}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="reports" className="mt-8">
            <div className="glass-card shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
              <ReportsAnalytics entries={entries} />
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-8">
            <div className="glass-card shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
              <GeneralSettings />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="glass-card shadow-2xl border-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
          <ModernQueueList
            entries={entries}
            title={queueConfig.title}
            description={queueConfig.description}
            canFilter={queueConfig.canFilter}
            canPerformActions={queueConfig.canPerformActions}
            userRole={profile?.role}
            userDepartment={profile?.department}
            onUpdateStatus={handleStatusUpdate}
            onTransfer={handleOpenTransferModal}
            onDelete={handleDelete}
            loading={loading}
          />
        </div>
      )}

      <TransferModal
        isOpen={transferModal.isOpen}
        onClose={() => setTransferModal(prev => ({ ...prev, isOpen: false }))}
        onTransfer={handleTransfer}
        currentDepartment={transferModal.currentDepartment}
        patientName={transferModal.patientName}
        token={transferModal.token}
      />
      </div>
    </div>
  );
}