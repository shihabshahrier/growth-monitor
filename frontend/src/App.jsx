import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { AuthPage } from "@/pages/AuthPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { Toaster } from "sonner";

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
        path="/*"
        element={
          <PrivateRoute>
            <DashboardPage />
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
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
