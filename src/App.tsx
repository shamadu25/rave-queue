import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from '@/components/AppSidebar';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import QueueMonitor from "./pages/QueueMonitor";
import QueueDisplayPage from "./pages/QueueDisplayPage";
import TokenGeneration from "./pages/TokenGeneration";
import TokenGenerationPage from "./pages/TokenGenerationPage";
import Settings from "./pages/Settings";
import PrintTicketPage from "./pages/PrintTicket";
import AdminDashboardPage from "./pages/AdminDashboard";
import QueueManagementPage from "./pages/QueueManagementPage";
import NotFound from "./pages/NotFound";
import { RoleBasedRoute } from './components/RoleBasedRoute';
import ReceptionDisplay from './components/ReceptionDisplay';

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Routes that should be displayed without sidebar/topbar (fullscreen)
  const fullscreenRoutes = ['/auth', '/token-kiosk', '/print', '/display'];
  const isFullscreenRoute = fullscreenRoutes.some(route => 
    location.pathname === route || location.pathname.startsWith(route + '/')
  );

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

  // Fullscreen layout for kiosk and display pages
  if (isFullscreenRoute) {
    return (
      <div className="min-h-screen w-full">
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/token-kiosk" element={<TokenGenerationPage />} />
          <Route path="/display" element={<QueueDisplayPage />} />
          <Route path="/display/universal" element={<QueueDisplayPage />} />
          <Route path="/display/reception" element={<ReceptionDisplay />} />
          <Route path="/display/department/:departmentName" element={<QueueDisplayPage />} />
          <Route path="/print/:tokenId" element={<PrintTicketPage />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </div>
    );
  }

  // Main layout with sidebar for authenticated users
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {user && <AppSidebar />}
        <div className="flex-1 flex flex-col overflow-hidden">
          {user && (
            <header className="h-12 flex items-center border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <SidebarTrigger className="ml-4" />
              <div className="flex-1 px-4">
                <h1 className="text-sm font-medium text-foreground">Queue Management System</h1>
              </div>
            </header>
          )}
          <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/token" 
              element={
                <RoleBasedRoute requiredRole={['admin', 'receptionist']}>
                  <TokenGeneration />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/monitor" 
              element={
                <RoleBasedRoute requiredRole={['admin', 'receptionist', 'doctor', 'nurse', 'staff']}>
                  <QueueMonitor />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/queue-management" 
              element={
                <RoleBasedRoute requiredRole={['admin', 'receptionist', 'doctor', 'nurse', 'staff']}>
                  <QueueManagementPage />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/admin-dashboard" 
              element={
                <RoleBasedRoute requiredRole={['admin']}>
                  <AdminDashboardPage />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <RoleBasedRoute requiredRole={['admin']}>
                  <Settings />
                </RoleBasedRoute>
              } 
            />
            <Route path="*" element={user ? <NotFound /> : <Navigate to="/auth" replace />} />
          </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;