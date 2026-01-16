import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CustomerAuthProvider } from "@/contexts/CustomerAuthContext";
import { PwaUpdatePrompt } from "@/components/PwaUpdatePrompt";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CustomerAuth from "./pages/CustomerAuth";
import Order from "./pages/Order";
import OrderHistory from "./pages/OrderHistory";
import TrackOrder from "./pages/TrackOrder";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center gap-4">
          <img 
            src="/eidikos-logo.jpeg" 
            alt="Eidikos Kouzina" 
            className="w-16 h-16 rounded-2xl shadow-lg object-cover"
          />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/customer-auth" element={<CustomerAuth />} />
      <Route path="/order" element={<Order />} />
      <Route path="/order-history" element={<OrderHistory />} />
      <Route path="/orders" element={<Navigate to="/order" replace />} />
      <Route path="/track" element={<TrackOrder />} />
      <Route path="/install" element={<Install />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PwaUpdatePrompt />
      <BrowserRouter>
        <AuthProvider>
          <CustomerAuthProvider>
            <AppRoutes />
          </CustomerAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
