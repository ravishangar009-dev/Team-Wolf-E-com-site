import { useEffect, useState, useRef, useCallback } from "react";
import { DeliveryAgentLayout } from "@/components/delivery-agent/DeliveryAgentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MapPin, MapPinOff, Package, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDeliveryAgent } from "@/hooks/useDeliveryAgent";

const DeliveryAgentDashboard = () => {
  const { agent, user } = useDeliveryAgent();
  const [isAvailable, setIsAvailable] = useState(true);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [todayAssigned, setTodayAssigned] = useState(0);
  const [todayDelivered, setTodayDelivered] = useState(0);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (agent) {
      setIsAvailable(agent.is_available);
      fetchTodayStats();
    }
  }, [agent]);

  const fetchTodayStats = async () => {
    if (!agent) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: assignedData } = await supabase
      .from("orders")
      .select("id", { count: "exact" })
      .eq("delivery_agent_id", agent.id)
      .gte("created_at", today.toISOString());

    const { data: deliveredData } = await supabase
      .from("orders")
      .select("id", { count: "exact" })
      .eq("delivery_agent_id", agent.id)
      .eq("status", "delivered")
      .gte("created_at", today.toISOString());

    setTodayAssigned(assignedData?.length || 0);
    setTodayDelivered(deliveredData?.length || 0);
  };

  const toggleAvailability = async (checked: boolean) => {
    setIsAvailable(checked);
    const { error } = await supabase
      .from("delivery_agents")
      .update({ is_available: checked, updated_at: new Date().toISOString() })
      .eq("user_id", user!.id);

    if (error) {
      toast.error("Failed to update availability");
      setIsAvailable(!checked);
    } else {
      toast.success(checked ? "You are now available" : "You are now offline");
    }
  };

  const updateLocation = useCallback(async (lat: number, lng: number) => {
    if (!user) return;
    await supabase
      .from("delivery_agents")
      .update({
        current_lat: lat,
        current_lng: lng,
        location_updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  }, [user]);

  const startSharingLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude);
        toast.success("Location sharing started");
      },
      (err) => {
        toast.error("Failed to get location: " + err.message);
        return;
      },
      { enableHighAccuracy: true }
    );

    // Update every 5 seconds for real-time tracking
    const id = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude),
        () => {},
        { enableHighAccuracy: true }
      );
    }, 30000);

    intervalRef.current = id;
    setSharingLocation(true);
  };

  const stopSharingLocation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSharingLocation(false);
    toast.success("Location sharing stopped");
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <DeliveryAgentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-outfit font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {agent?.full_name || "Agent"}</p>
        </div>

        {/* Availability Toggle */}
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant={isAvailable ? "default" : "secondary"} className="text-sm px-3 py-1">
                {isAvailable ? "Available" : "Offline"}
              </Badge>
              <span className="text-sm text-muted-foreground">Toggle your availability</span>
            </div>
            <Switch checked={isAvailable} onCheckedChange={toggleAvailability} />
          </CardContent>
        </Card>

        {/* Today's Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Assigned Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <span className="text-3xl font-bold">{todayAssigned}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Delivered Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-3xl font-bold">{todayDelivered}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location Sharing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Live Location Sharing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share your live location so customers can track their delivery in real-time. Location updates every 30 seconds.
            </p>
            {sharingLocation ? (
              <Button variant="destructive" className="w-full gap-2" onClick={stopSharingLocation}>
                <MapPinOff className="w-4 h-4" />
                Stop Sharing Location
              </Button>
            ) : (
              <Button className="w-full gap-2" onClick={startSharingLocation}>
                <MapPin className="w-4 h-4" />
                Share My Location
              </Button>
            )}
            {agent?.location_updated_at && (
              <p className="text-xs text-muted-foreground text-center">
                Last updated: {new Date(agent.location_updated_at).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DeliveryAgentLayout>
  );
};

export default DeliveryAgentDashboard;
