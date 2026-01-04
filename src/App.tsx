import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelpModal } from "@/components/help/HelpModal";
import { KeyboardShortcutsModal } from "@/components/help/KeyboardShortcutsModal";
import { OnboardingTour } from "@/components/help/OnboardingTour";
import { AdminLogin } from "@/components/views/AdminLogin";
import { AdminDashboard } from "@/components/views/AdminDashboard";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AdminRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('adminAuthenticated') === 'true';
    setIsAuthenticated(auth);
  }, []);

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return <AdminDashboard onLogout={() => setIsAuthenticated(false)} />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HelpModal />
      <KeyboardShortcutsModal />
      <OnboardingTour />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
