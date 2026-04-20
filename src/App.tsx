import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import Index from "./pages/Index.tsx";
import ShareView from "./pages/ShareView.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import MarketingLandingPage from "./pages/MarketingLandingPage.tsx";
import ProductDemoPage from "./pages/ProductDemoPage.tsx";
import AdminLayout from "./components/admin/AdminLayout.tsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.tsx";
import AdminPlaceholderPage from "./pages/admin/AdminPlaceholderPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";
import UploadRequestPage from "./pages/UploadRequestPage.tsx";
import MediaSharePage from "./pages/MediaSharePage.tsx";
import NotFound from "./pages/NotFound.tsx";
import PrivacyPage from "./pages/PrivacyPage.tsx";
import TermsPage from "./pages/TermsPage.tsx";
import UnsubscribePage from "./pages/UnsubscribePage.tsx";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <h1 className="font-heading text-2xl font-light tracking-[0.15em] gold-gradient-text">RinVita</h1>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
};

const HomeRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/app" replace />;
  return <MarketingLandingPage />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminAccess();

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <h1 className="font-heading text-2xl font-light tracking-[0.15em] gold-gradient-text">RinVita</h1>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/app" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
            <Route path="/" element={<HomeRoute />} />
            <Route path="/demo" element={<ProductDemoPage />} />
            <Route path="/app" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/app/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/app/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminPlaceholderPage title="Users" description="Member operations, filters, and actions are next in the build order." />} />
              <Route path="subscriptions" element={<AdminPlaceholderPage title="Subscriptions" description="Revenue, trial conversion, and Stripe-linked subscription visibility are queued for the next milestone." />} />
              <Route path="documents" element={<AdminPlaceholderPage title="Documents" description="Processing monitoring, storage insights, and failure diagnostics are scaffolded next." />} />
              <Route path="activity" element={<AdminPlaceholderPage title="Activity log" description="Audit trails, admin actions, and security events will land in the following milestone." />} />
              <Route path="settings" element={<AdminPlaceholderPage title="Settings" description="Admin invites, trial defaults, exports, and platform controls are planned for the final launch admin milestone." />} />
            </Route>
            <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
            <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
            <Route path="/share/:token" element={<ShareView />} />
            <Route path="/upload-request/:token" element={<UploadRequestPage />} />
            <Route path="/media-share/:token" element={<MediaSharePage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/unsubscribe" element={<UnsubscribePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
