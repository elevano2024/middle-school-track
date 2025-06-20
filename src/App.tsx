
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useRealtimeSubscriptions } from "@/hooks/useRealtimeSubscriptions";
import ProtectedLayout from "@/components/ProtectedLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import UserManagement from "./pages/UserManagement";
import AddContent from "./pages/AddContent";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to initialize real-time subscriptions at app level
const AppWithRealtime = () => {
  useRealtimeSubscriptions();
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/*" element={
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <ProtectedLayout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/add-content" element={<AddContent />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </ProtectedLayout>
            </div>
          </SidebarProvider>
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
