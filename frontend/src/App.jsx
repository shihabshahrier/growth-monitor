import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { AuthPage } from "@/pages/AuthPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { Toaster } from "sonner";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { OverviewPage } from "@/pages/OverviewPage";
import { OverviewPage as OverviewPageEnhanced } from "@/pages/OverviewPageEnhanced";
import { CustomersPage } from "@/pages/CustomersPage";
import { CustomerFormPage } from "@/pages/CustomerFormPage";
import { CustomerDetailPage } from "@/pages/CustomerDetailPage";
import { SalesPage } from "@/pages/SalesPage";
import { SaleFormPage } from "@/pages/SaleFormPage";
import { CampaignsPage } from "@/pages/CampaignsPage";
import { CampaignFormPage } from "@/pages/CampaignFormPage";
import { CampaignDetailPage } from "@/pages/CampaignDetailPage";
import { AnalyticsPage } from "@/pages/AnalyticsPageEnhanced";
import { ConversationsPage } from "@/pages/ConversationsPage";
import { ChatPage } from "@/pages/ChatPage";
import { ImportWizardPage } from "@/pages/ImportWizardPage";
import { ImportsPage } from "@/pages/ImportsPage";
import { TeamPage } from "@/pages/TeamPage";
import { TeamInvitePage } from "@/pages/TeamInvitePage";
import { CompanySettingsPage } from "@/pages/CompanySettingsPage";
import { InsightsPage } from "@/pages/InsightsPage";
import { InsightDetailPage } from "@/pages/InsightDetailPage";

function PrivateRoute({ children }) {
  const { user, initializing } = useAuth();
  if (initializing) {
    return <LoadingScreen />;
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { user, initializing } = useAuth();
  if (initializing) {
    return <LoadingScreen />;
  }
  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function RoleRoute({ children, roles }) {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const userRole = user?.role?.toUpperCase() || "VIEWER";
  const allowedRoles = roles.map(r => r.toUpperCase());

  if (!allowedRoles.includes(userRole)) {
    // Redirect to dashboard if user doesn't have permission
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <LayoutShell>
              <OverviewPageEnhanced />
            </LayoutShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <RoleRoute roles={["OWNER", "ADMIN", "MEMBER"]}>
            <LayoutShell>
              <CustomersPage />
            </LayoutShell>
          </RoleRoute>
        }
      />
      <Route
        path="/customers/new"
        element={
          <RoleRoute roles={["OWNER", "ADMIN", "MEMBER"]}>
            <LayoutShell>
              <CustomerFormPage />
            </LayoutShell>
          </RoleRoute>
        }
      />
      <Route
        path="/customers/:id"
        element={
          <RoleRoute roles={["OWNER", "ADMIN", "MEMBER"]}>
            <LayoutShell>
              <CustomerDetailPage />
            </LayoutShell>
          </RoleRoute>
        }
      />
      <Route
        path="/customers/:id/edit"
        element={
          <RoleRoute roles={["OWNER", "ADMIN", "MEMBER"]}>
            <LayoutShell>
              <CustomerFormPage />
            </LayoutShell>
          </RoleRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <RoleRoute roles={["OWNER", "ADMIN", "MEMBER"]}>
            <LayoutShell>
              <SalesPage />
            </LayoutShell>
          </RoleRoute>
        }
      />
      <Route
        path="/sales/new"
        element={
          <RoleRoute roles={["OWNER", "ADMIN", "MEMBER"]}>
            <LayoutShell>
              <SaleFormPage />
            </LayoutShell>
          </RoleRoute>
        }
      />
      <Route
        path="/sales/:id/edit"
        element={
          <RoleRoute roles={["OWNER", "ADMIN", "MEMBER"]}>
            <LayoutShell>
              <SaleFormPage />
            </LayoutShell>
          </RoleRoute>
        }
      />
      <Route
        path="/campaigns"
        element={
          <RoleRoute roles={["OWNER", "ADMIN", "MEMBER"]}>
            <LayoutShell>
              <CampaignsPage />
            </LayoutShell>
          </RoleRoute>
        }
      />
      <Route
        path="/campaigns/new"
        element={
          <RoleRoute roles={["OWNER", "ADMIN", "MEMBER"]}>
            <LayoutShell>
              <CampaignFormPage />
            </LayoutShell>
          </RoleRoute>
        }
      />
      <Route
        path="/campaigns/:id/edit"
        element={
          <RoleRoute roles={["OWNER", "ADMIN", "MEMBER"]}>
            <LayoutShell>
              <CampaignFormPage />
            </LayoutShell>
          </RoleRoute>
        }
      />
      <Route
        path="/campaigns/:id"
        element={
          <RoleRoute roles={["OWNER", "ADMIN", "MEMBER"]}>
            <LayoutShell>
              <CampaignDetailPage />
            </LayoutShell>
          </RoleRoute>
        }
      />
      <Route
        path="/conversations"
        element={
          <RoleRoute roles={["OWNER", "ADMIN", "MEMBER"]}>
            <LayoutShell>
              <ConversationsPage />
            </LayoutShell>
          </RoleRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <RoleRoute roles={["OWNER", "ADMIN", "MEMBER"]}>
            <LayoutShell>
              <ChatPage />
            </LayoutShell>
          </RoleRoute>
        }
      />
      <Route
        path="/chat/:id"
        element={
          <RoleRoute roles={["OWNER", "ADMIN", "MEMBER"]}>
            <LayoutShell>
              <ChatPage />
            </LayoutShell>
          </RoleRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <PrivateRoute>
            <LayoutShell>
              <AnalyticsPage />
            </LayoutShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/imports"
        element={
          <RoleRoute roles={["OWNER", "ADMIN"]}>
            <LayoutShell>
              <ImportsPage />
            </LayoutShell>
          </RoleRoute>
        }
      />
      <Route
        path="/import-wizard"
        element={
          <RoleRoute roles={["OWNER", "ADMIN"]}>
            <LayoutShell>
              <ImportWizardPage />
            </LayoutShell>
          </RoleRoute>
        }
      />
      <Route
        path="/team"
        element={
          <RoleRoute roles={["OWNER", "ADMIN"]}>
            <LayoutShell>
              <TeamPage />
            </LayoutShell>
          </RoleRoute>
        }
      />
      <Route
        path="/team/invite"
        element={
          <RoleRoute roles={["OWNER", "ADMIN"]}>
            <LayoutShell>
              <TeamInvitePage />
            </LayoutShell>
          </RoleRoute>
        }
      />
      <Route
        path="/company-settings"
        element={
          <RoleRoute roles={["OWNER"]}>
            <LayoutShell>
              <CompanySettingsPage />
            </LayoutShell>
          </RoleRoute>
        }
      />
      <Route
        path="/insights"
        element={
          <PrivateRoute>
            <LayoutShell>
              <InsightsPage />
            </LayoutShell>
          </PrivateRoute>
        }
      />
      <Route
        path="/insights/:id"
        element={
          <PrivateRoute>
            <LayoutShell>
              <InsightDetailPage />
            </LayoutShell>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
          <Toaster
            richColors
            position="top-right"
            toastOptions={{
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
              className: 'toast-notification',
            }}
          />
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
