import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { TopBar } from '@/components/TopBar';
import QueueManagement from '@/components/QueueManagement';
import { Navigate } from 'react-router-dom';
import MarqueeHeader from '@/components/MarqueeHeader';

const QueueManagementPage: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
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

  return (
    <>
      <TopBar title="Queue Management" subtitle="Manage hospital queue operations" />
      <MarqueeHeader />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 pt-20">
        <div className="max-w-7xl mx-auto">
          <QueueManagement />
        </div>
      </div>
    </>
  );
};

export default QueueManagementPage;