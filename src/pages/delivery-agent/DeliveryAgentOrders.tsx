import { useEffect, useState } from "react";
import { DeliveryAgentLayout } from "@/components/delivery-agent/DeliveryAgentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Phone, MapPin, Truck, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDeliveryAgent } from "@/hooks/useDeliveryAgent";
import { format } from "date-fns";

interface OrderData {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  delivery_address: string;
  phone: string;
  stores?: { name: string };
}

const DeliveryAgentOrders = () => {
  const { agent } = useDeliveryAgent();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!agent) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select("id, created_at, total_amount, status, delivery_address, phone, stores(name)")
      .eq("delivery_agent_id", agent.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as OrderData[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (agent) fetchOrders();
  }, [agent]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order status");
      return;
    }

    toast.success(`Order marked as ${newStatus.replace(/_/g, " ")}`);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-orange-100 text-orange-700";
      case "accepted": return "bg-blue-100 text-blue-700";
      case "out_for_delivery": return "bg-purple-100 text-purple-700";
      case "delivered": return "bg-emerald-100 text-emerald-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const groupedOrders = {
    active: orders.filter((o) => ["pending", "accepted", "out_for_delivery"].includes(o.status)),
    delivered: orders.filter((o) => o.status === "delivered"),
    cancelled: orders.filter((o) => o.status === "cancelled"),
  };

  const renderOrderCard = (order: OrderData) => (
    <Card key={order.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-muted-foreground">#{order.id.slice(0, 8)}</span>
          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
            {order.status.replace(/_/g, " ")}
          </span>
        </div>

        <div className="space-y-1 text-sm">
          <p className="font-semibold">{order.stores?.name || "Store"}</p>
          <p className="text-muted-foreground flex items-center gap-1">
            <Phone className="w-3 h-3" /> {order.phone}
          </p>
          <p className="text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {order.delivery_address}
          </p>
          <p className="text-muted-foreground text-xs">
            {format(new Date(order.created_at), "dd MMM, hh:mm a")}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <p className="text-lg font-bold text-primary">₹{order.total_amount}</p>
          <div className="flex gap-2">
            <a href={`tel:${order.phone}`}>
              <Button size="sm" variant="outline" className="gap-1">
                <Phone className="w-3 h-3" /> Call Customer
              </Button>
            </a>
            {order.status === "accepted" && (
              <Button size="sm" className="gap-1" onClick={() => updateStatus(order.id, "out_for_delivery")}>
                <Truck className="w-3 h-3" /> Out for Delivery
              </Button>
            )}
            {order.status === "out_for_delivery" && (
              <Button size="sm" className="gap-1" onClick={() => updateStatus(order.id, "delivered")}>
                <CheckCircle2 className="w-3 h-3" /> Mark Delivered
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DeliveryAgentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-outfit font-bold">My Orders</h1>
          <p className="text-muted-foreground">Orders assigned to you</p>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading...</div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-outfit font-semibold text-xl mb-2">No orders assigned</h3>
              <p className="text-muted-foreground">New orders will appear here once assigned to you.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {groupedOrders.active.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-outfit font-semibold text-lg">Active Orders</h2>
                {groupedOrders.active.map(renderOrderCard)}
              </div>
            )}

            {groupedOrders.delivered.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-outfit font-semibold text-lg text-muted-foreground">Delivered</h2>
                {groupedOrders.delivered.map(renderOrderCard)}
              </div>
            )}

            {groupedOrders.cancelled.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-outfit font-semibold text-lg text-muted-foreground">Cancelled</h2>
                {groupedOrders.cancelled.map(renderOrderCard)}
              </div>
            )}
          </>
        )}
      </div>
    </DeliveryAgentLayout>
  );
};

export default DeliveryAgentOrders;
