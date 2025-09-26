import { Navigate } from 'react-router-dom';
import { TopBar } from '@/components/TopBar';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from '@/components/AdminDashboard';

const AdminDashboardPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
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

  return (
    <>
      <TopBar title="Admin Dashboard" subtitle="Comprehensive hospital management overview" />
      <div className="p-6 max-w-7xl mx-auto">
        <AdminDashboard />
      </div>
    </>
  );
};

export default AdminDashboardPage;