import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  TrendingUp,
  MessageCircle,
  BarChart3,
  UploadCloud,
  UsersIcon,
  Settings,
  Lightbulb
} from "lucide-react";

// Define navigation items with role-based access
// Roles: OWNER, ADMIN, MEMBER, VIEWER
const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["OWNER", "ADMIN", "MEMBER", "VIEWER"] // All roles
  },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
    roles: ["OWNER", "ADMIN", "MEMBER"] // Not VIEWER
  },
  {
    id: "sales",
    label: "Sales",
    icon: DollarSign,
    roles: ["OWNER", "ADMIN", "MEMBER"] // Not VIEWER
  },
  {
    id: "campaigns",
    label: "Campaigns",
    icon: TrendingUp,
    roles: ["OWNER", "ADMIN", "MEMBER"] // Not VIEWER
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    roles: ["OWNER", "ADMIN", "MEMBER", "VIEWER"] // All roles
  },
  {
    id: "insights",
    label: "Insights",
    icon: Lightbulb,
    roles: ["OWNER", "ADMIN", "MEMBER", "VIEWER"] // All roles
  },
  {
    id: "conversations",
    label: "Conversations",
    icon: MessageCircle,
    roles: ["OWNER", "ADMIN", "MEMBER"] // Not VIEWER
  },
  {
    id: "chat",
    label: "New Chat",
    icon: MessageCircle,
    roles: ["OWNER", "ADMIN", "MEMBER"] // Not VIEWER
  },
  {
    id: "imports",
    label: "Imports",
    icon: UploadCloud,
    roles: ["OWNER", "ADMIN"] // Only OWNER and ADMIN
  },
  {
    id: "team",
    label: "Team",
    icon: UsersIcon,
    roles: ["OWNER", "ADMIN"] // Only OWNER and ADMIN
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    roles: ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
    disabled: true
  },
];

export function Sidebar({ collapsed, onToggle, activeView, onNavigate }) {
  const { user } = useAuth();

  // Filter navigation items based on user role
  const userRole = user?.role?.toUpperCase() || "VIEWER";
  const visibleNavItems = navItems.filter(item =>
    item.roles.includes(userRole)
  );
  return (
    <aside
      className={cn(
        "relative flex h-full flex-col gap-4 rounded-3xl border border-[hsla(var(--border)_/_0.6)] bg-white/70 p-4 text-[hsl(var(--foreground))] shadow-[0_24px_60px_-40px_rgba(202,138,148,0.6)] backdrop-blur-xl transition-all dark:bg-[hsla(var(--secondary)_/_0.35)]",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] font-display text-lg font-semibold text-white shadow-glow">
            GM
          </span>
          {!collapsed && (
            <div>
              <p className="font-display text-lg font-semibold leading-tight">
                GrowthMonitor
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-full border border-[hsla(var(--border)_/_0.7)] bg-white/70 px-3 py-1 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsla(var(--secondary)_/_0.45)]"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-2 pt-4">
        {visibleNavItems.map(({ id, label, icon: Icon, disabled }) => (
          <button
            key={id}
            type="button"
            onClick={() => !disabled && onNavigate?.(id)}
            className={cn(
              "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
              disabled
                ? "cursor-not-allowed opacity-40"
                : activeView === id
                  ? "bg-[hsla(var(--primary)_/_0.16)] text-[hsl(var(--primary))] shadow-inner"
                  : "text-[hsl(var(--muted-foreground))] hover:bg-[hsla(var(--secondary)_/_0.4)] hover:text-[hsl(var(--foreground))]",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
