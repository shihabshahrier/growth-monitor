import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

export function LayoutShell({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active view from pathname
  const getActiveView = () => {
    const path = location.pathname;
    if (path === "/" || path.startsWith("/dashboard")) return "dashboard";
    if (path.startsWith("/customers")) return "customers";
    if (path.startsWith("/sales")) return "sales";
    if (path.startsWith("/campaigns")) return "campaigns";
    if (path.startsWith("/analytics")) return "analytics";
    if (path.startsWith("/insights")) return "insights";
    if (path.startsWith("/conversations")) return "conversations";
    if (path.startsWith("/chat")) return "chat";
    if (path.startsWith("/import")) return "imports";
    if (path.startsWith("/team") || path.startsWith("/company-settings")) return "team";
    if (path.startsWith("/settings")) return "settings";
    return "dashboard";
  };

  return (
    <div className="flex min-h-screen gap-6 bg-[hsl(var(--background))] px-4 py-6 text-[hsl(var(--foreground))] lg:px-10">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        activeView={getActiveView()}
        onNavigate={(view) => {
          if (view === "uploads") {
            // TODO: Implement upload modal
            return;
          }
          navigate(`/${view === "dashboard" ? "" : view}`);
        }}
      />
      <div className="flex flex-1 flex-col gap-6">
        <Navbar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
