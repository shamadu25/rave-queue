import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { TopBar } from '@/components/TopBar';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import QueueMonitor from "./pages/QueueMonitor";
import QueueDisplay from "./pages/QueueDisplay";
import QueueDisplayPage from "./pages/QueueDisplayPage";
import TokenGeneration from "./pages/TokenGeneration";
import TokenGenerationPage from "./pages/TokenGenerationPage";
import Settings from "./pages/Settings";
import PrintTicketPage from "./pages/PrintTicket";
import AdminDashboardPage from "./pages/AdminDashboard";
import QueueManagementPage from "./pages/QueueManagementPage";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from './components/ProtectedRoute';
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

  // Fullscreen layout for token generation and print pages
  if (isFullscreenRoute) {
    return (
      <div className="min-h-screen w-full">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/token" element={<TokenGeneration />} />
          <Route path="/token-kiosk" element={<TokenGenerationPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/display" element={<QueueDisplayPage />} />
          <Route path="/display/universal" element={<QueueDisplayPage />} />
          <Route path="/display/reception" element={<ReceptionDisplay />} />
          <Route path="/display/department/:departmentName" element={<QueueDisplayPage />} />
          <Route path="/print/:tokenId" element={<PrintTicketPage />} />
           <Route 
             path="/settings" 
             element={
               <ProtectedRoute allowedRoles={['admin']} fallbackPath="/">
                 <Settings />
               </ProtectedRoute>
             } 
           />
            <Route 
              path="/monitor" 
              element={user ? <QueueMonitor /> : <Navigate to="/auth" replace />} 
            />
           <Route 
             path="/admin" 
             element={
               <ProtectedRoute allowedRoles={['admin']} fallbackPath="/">
                 <AdminDashboardPage />
               </ProtectedRoute>
             } 
           />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    );
  }

  // Standard layout with topbar only (no sidebar)
  return (
    <div className="min-h-screen w-full bg-background">
      <TopBar />
      <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/token" element={
                <ProtectedRoute requiredPermission="canGenerateTokens">
                  <TokenGeneration />
                </ProtectedRoute>
              } />
              <Route path="/auth" element={<Auth />} />
              <Route path="/queue-display" element={<QueueDisplay />} />
               <Route path="/queue-monitor" element={user ? <QueueMonitor /> : <Navigate to="/auth" replace />} />
               <Route path="/monitor" element={user ? <QueueMonitor /> : <Navigate to="/auth" replace />} />
               <Route path="/queue-management" element={user ? <QueueManagementPage /> : <Navigate to="/auth" replace />} />
              <Route path="/print/:tokenId" element={<PrintTicketPage />} />
               <Route 
                 path="/settings" 
                 element={
                   <ProtectedRoute allowedRoles={['admin']} fallbackPath="/">
                     <Settings />
                   </ProtectedRoute>
                 } 
               />
               <Route 
                 path="/admin-dashboard" 
                 element={
                   <ProtectedRoute allowedRoles={['admin']} fallbackPath="/">
                     <AdminDashboardPage />
                   </ProtectedRoute>
                 } 
               />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
    </div>
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
