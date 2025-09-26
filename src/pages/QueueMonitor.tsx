import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{queueConfig.title}</h1>
          <p className="text-muted-foreground">{queueConfig.description}</p>
        </div>
      </div>

      {/* Main Content */}
      {profile?.role === 'admin' ? (
        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="queue">Queue Management</TabsTrigger>
            <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
            <TabsTrigger value="settings">General Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="queue" className="mt-6">
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
          </TabsContent>
          
          <TabsContent value="reports" className="mt-6">
            <ReportsAnalytics entries={entries} />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <GeneralSettings />
          </TabsContent>
        </Tabs>
      ) : (
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
  );
}