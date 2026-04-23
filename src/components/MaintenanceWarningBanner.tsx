import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const MaintenanceWarningBanner = () => {
  const [timeLeft, setTimeLeft] = useState("");
  const [shutdownAt, setShutdownAt] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkUpcoming = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("is_site_active, reopen_at, shutdown_message")
        .limit(1)
        .maybeSingle();

      // We need a scheduled shutdown time. If site is active but has a reopen_at set,
      // that means admin has scheduled a future maintenance. But our current schema
      // doesn't have a "scheduled_shutdown_at" field. Instead, we check if site is
      // still active and reopen_at is in the future — meaning admin pre-set the times.
      // For now, we won't show banner if site is already locked (SiteLockdown handles that).
      // This banner is shown when site IS active but will go down soon.
      // Since we don't have a separate scheduled_shutdown field, we skip this for now.
      // The banner will be useful once we add that field.
      if (data && data.is_site_active && data.reopen_at) {
        // If reopen_at is set while site is active, admin is pre-scheduling
        // We assume shutdown happens 30 min before reopen_at as a heuristic
        // But better: we'll use reopen_at as the shutdown indicator
        setShutdownAt(data.reopen_at);
      }
    };
    checkUpcoming();
  }, []);

  useEffect(() => {
    if (!shutdownAt || dismissed) return;

    const update = () => {
      const now = Date.now();
      const target = new Date(shutdownAt).getTime();
      const diff = target - now;

      // Only show if within 30 minutes
      if (diff <= 0 || diff > 30 * 60 * 1000) {
        setTimeLeft("");
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}m ${seconds}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [shutdownAt, dismissed]);

  if (!timeLeft || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] bg-destructive text-destructive-foreground px-4 py-3 animate-fade-in">
      <div className="container mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            ⚠️ Maintenance mode starting in <span className="font-bold">{timeLeft}</span>. Please complete your orders soon!
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-destructive-foreground/20 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default MaintenanceWarningBanner;
