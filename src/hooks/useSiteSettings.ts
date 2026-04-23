import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SiteSettings {
  is_site_active: boolean;
  reopen_at: string | null;
  shutdown_message: string | null;
}

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndCheck = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("id, is_site_active, reopen_at, shutdown_message")
        .limit(1)
        .maybeSingle();

      if (data) {
        // Auto-reactivate if reopen_at has passed
        if (!data.is_site_active && data.reopen_at) {
          const reopenTime = new Date(data.reopen_at).getTime();
          if (Date.now() >= reopenTime) {
            // Update DB to reactivate
            await supabase
              .from("site_settings")
              .update({
                is_site_active: true,
                reopen_at: null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", data.id);

            setSettings({
              is_site_active: true,
              reopen_at: null,
              shutdown_message: null,
            });
            setLoading(false);
            return;
          }
        }
        setSettings({
          is_site_active: data.is_site_active,
          reopen_at: data.reopen_at,
          shutdown_message: data.shutdown_message,
        });
      }
      setLoading(false);
    };
    fetchAndCheck();
  }, []);

  return { settings, loading };
};
