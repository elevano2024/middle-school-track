import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useRealtimeSubscriptions } from "@/hooks/useRealtimeSubscriptions";
import ProtectedLayout from "@/components/ProtectedLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import UserManagement from "./pages/UserManagement";
import AddContent from "./pages/AddContent";
import Settings from "./pages/Settings";
import AttendanceManagement from "./pages/AttendanceManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper component to avoid code duplication
const ProtectedPageWrapper = ({ children }: { children: React.ReactNode }) => (
  <LoadingProvider>
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ProtectedLayout>
          {children}
        </ProtectedLayout>
      </div>
    </SidebarProvider>
  </LoadingProvider>
);

// Component to initialize real-time subscriptions at app level
const AppWithRealtime = () => {
  useRealtimeSubscriptions();
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={
          <ProtectedPageWrapper>
            <Index />
          </ProtectedPageWrapper>
        } />
        <Route path="/users" element={
          <ProtectedPageWrapper>
            <UserManagement />
          </ProtectedPageWrapper>
        } />
        <Route path="/attendance" element={
          <ProtectedPageWrapper>
            <AttendanceManagement />
          </ProtectedPageWrapper>
        } />
        <Route path="/add-content" element={
          <ProtectedPageWrapper>
            <AddContent />
          </ProtectedPageWrapper>
        } />
        <Route path="/settings" element={
          <ProtectedPageWrapper>
            <Settings />
          </ProtectedPageWrapper>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppWithRealtime />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
