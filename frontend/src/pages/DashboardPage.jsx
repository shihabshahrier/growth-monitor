import { useEffect, useState } from "react";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { ChatView } from "@/components/chat/ChatView";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { UploadDialog } from "@/components/layout/UploadDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/contexts/LocaleContext";
import { motion } from "framer-motion";

export function DashboardPage() {
  const { t } = useLocale();
  const [activeView, setActiveView] = useState("chat");
  const [showUpload, setShowUpload] = useState(false);
  const [status, setStatus] = useState({
    headline: t("ready"),
    subcopy: t("welcomeBack"),
  });

  useEffect(() => {
    setStatus({
      headline: t("ready"),
      subcopy: t("welcomeBack"),
    });
  }, [t]);

  return (
    <>
      <LayoutShell
        activeView={activeView}
        onNavigate={(view) => {
          if (view === "uploads") {
            setShowUpload(true);
            return;
          }
          setActiveView(view);
        }}
        onUpload={() => setShowUpload(true)}
        status={status}
      >
        {activeView === "chat" ? (
          <ChatView onStatusChange={setStatus} />
        ) : (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-6"
          >
            <AnalyticsView />
          </motion.div>
        )}
        {activeView === "settings" && (
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure workspace preferences.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Advanced settings coming soon.
              </p>
            </CardContent>
          </Card>
        )}
      </LayoutShell>
      <UploadDialog open={showUpload} onClose={() => setShowUpload(false)} />
    </>
  );
}
