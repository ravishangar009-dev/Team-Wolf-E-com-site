import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Power, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const SiteControlCard = () => {
  const [isActive, setIsActive] = useState(true);
  const [reopenAt, setReopenAt] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (data) {
        setSettingsId(data.id);
        setIsActive(data.is_site_active);
        setMessage(data.shutdown_message || "");
        if (data.reopen_at) {
          // Convert to local datetime-local format
          const d = new Date(data.reopen_at);
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setReopenAt(local);
        }
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    if (!settingsId) return;
    setSaving(true);

    const updates: Record<string, unknown> = {
      is_site_active: isActive,
      shutdown_message: message || null,
      reopen_at: reopenAt ? new Date(reopenAt).toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("site_settings")
      .update(updates)
      .eq("id", settingsId);

    if (error) {
      toast.error("Failed to update site settings");
    } else {
      toast.success(isActive ? "Site is now LIVE" : "Site is now in maintenance mode");
    }
    setSaving(false);
  };

  if (loading) return null;

  return (
    <Card className={`border-2 ${isActive ? "border-emerald-500/30" : "border-destructive/30"}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Power className={`w-5 h-5 ${isActive ? "text-emerald-500" : "text-destructive"}`} />
          Site Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
          <div>
            <p className="font-semibold">Site Status</p>
            <p className="text-sm text-muted-foreground">
              {isActive ? "Site is live and accepting orders" : "Site is in maintenance mode"}
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>

        {!isActive && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <Label htmlFor="reopen" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Reopen Date & Time
              </Label>
              <Input
                id="reopen"
                type="datetime-local"
                value={reopenAt}
                onChange={(e) => setReopenAt(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="message">Shutdown Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="We are currently on a break..."
                className="mt-1"
              />
            </div>
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
};
