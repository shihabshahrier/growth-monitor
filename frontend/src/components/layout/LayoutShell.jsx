import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

export function LayoutShell({
  children,
  onNavigate,
  activeView,
  onUpload,
  status,
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen gap-6 bg-[hsl(var(--background))] px-4 py-6 text-[hsl(var(--foreground))] lg:px-10">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        activeView={activeView}
        onNavigate={onNavigate}
      />
      <div className="flex flex-1 flex-col gap-6">
        <Navbar onUpload={onUpload} status={status} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
