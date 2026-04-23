import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Package, ChevronDown, ChevronUp, Clock, Phone, Truck, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import OrderTimeline from "@/components/OrderTimeline";
import LiveTrackingMap from "@/components/LiveTrackingMap";
import { Button } from "@/components/ui/button";
import { getDeliveryEta } from "@/utils/deliveryEta";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface DeliveryAgentInfo {
  id: string;
  full_name: string;
  phone: string;
  current_lat: number | null;
  current_lng: number | null;
  location_updated_at: string | null;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  delivery_address: string;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  delivery_updated_at: string | null;
  delivery_agent_id: string | null;
  stores: {
    name: string;
  };
  delivery_agents: DeliveryAgentInfo | null;
}

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchOrders();

      // Subscribe to real-time order updates for the current user
      const channel = supabase
        .channel('user-orders-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Order update received:', payload);
            fetchOrders();
          }
        )
        .subscribe();

      // Auto-refresh agent locations every 5s for active deliveries
      const refreshInterval = setInterval(() => {
        fetchOrders();
      }, 30000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(refreshInterval);
      };
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        stores (name),
        delivery_agents (id, full_name, phone, current_lat, current_lng, location_updated_at)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to cancel order");
      return;
    }
    toast.success("Order cancelled successfully");
    fetchOrders();
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "pending": return "Your order has been placed and is waiting for the store to accept it.";
      case "accepted": return "The store has accepted your order and is preparing it.";
      case "out_for_delivery": return "Your order is on the way! Track your delivery agent below.";
      case "delivered": return "Your order has been delivered. Enjoy!";
      case "cancelled": return "This order has been cancelled.";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-outfit font-bold mb-2 animate-fade-in">
          My Orders
        </h1>
        <p className="text-muted-foreground mb-8">Track your order history</p>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-1/3 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card className="animate-fade-in">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-outfit font-semibold text-xl mb-2">
                No orders yet
              </h3>
              <p className="text-muted-foreground">
                Start shopping to place your first order
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <Card
                key={order.id}
                className="animate-scale-in hover:shadow-md transition-shadow"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground">
                          Order #{order.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <h3 className="font-outfit font-semibold text-lg">
                        {order.stores?.name || "Store"}
                      </h3>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      ₹{order.total_amount}
                    </p>
                  </div>

                  {/* Order Timeline */}
                  <div className="py-2">
                    <OrderTimeline status={order.status} />
                  </div>

                  {/* Status Message */}
                  <div className={`text-sm px-3 py-2 rounded-lg ${
                    order.status === "cancelled" 
                      ? "bg-destructive/10 text-destructive" 
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    {getStatusMessage(order.status)}
                  </div>

                  {/* Cancel Button - only before acceptance */}
                  {order.status === "pending" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-1 w-fit">
                          <XCircle className="w-4 h-4" /> Cancel Order
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. Your order will be cancelled.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Order</AlertDialogCancel>
                          <AlertDialogAction onClick={() => cancelOrder(order.id)}>
                            Yes, Cancel
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {/* Delivery Agent Info & Tracking */}
                  {order.status === "out_for_delivery" && order.delivery_agents && (
                    <div className="pt-2 space-y-3">
                      {/* Agent Info */}
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
                        <Truck className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{order.delivery_agents.full_name}</p>
                          <a href={`tel:${order.delivery_agents.phone}`} className="text-xs text-primary flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {order.delivery_agents.phone}
                          </a>
                        </div>
                      </div>

                      {/* ETA Display */}
                      {(() => {
                        const etaInfo = getDeliveryEta(
                          order.delivery_agents.current_lat,
                          order.delivery_agents.current_lng,
                          order.latitude,
                          order.longitude
                        );
                        if (etaInfo) {
                          return (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                              <Clock className="w-5 h-5 text-primary" />
                              <div>
                                <p className="font-semibold text-sm">Estimated Arrival: {etaInfo.eta}</p>
                                <p className="text-xs text-muted-foreground">
                                  Delivery agent is {etaInfo.distance} km away
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleOrderExpand(order.id)}
                        className="w-full flex items-center justify-between text-primary"
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Track Delivery Agent
                        </span>
                        {expandedOrder === order.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>

                      {expandedOrder === order.id && order.delivery_agents && (
                        <div className="mt-3 animate-fade-in">
                          <LiveTrackingMap
                            agentLat={order.delivery_agents.current_lat || 0}
                            agentLng={order.delivery_agents.current_lng || 0}
                            customerLat={order.latitude || 0}
                            customerLng={order.longitude || 0}
                            agentName={order.delivery_agents.full_name}
                            agentPhone={order.delivery_agents.phone}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fallback for out_for_delivery without agent */}
                  {order.status === "out_for_delivery" && !order.delivery_agents && (
                    <div className="pt-2">
                      {(() => {
                        const etaInfo = getDeliveryEta(
                          order.delivery_lat,
                          order.delivery_lng,
                          order.latitude,
                          order.longitude
                        );
                        if (etaInfo) {
                          return (
                            <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                              <Clock className="w-5 h-5 text-primary" />
                              <div>
                                <p className="font-semibold text-sm">Estimated Arrival: {etaInfo.eta}</p>
                                <p className="text-xs text-muted-foreground">
                                  Delivery partner is {etaInfo.distance} km away
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/50">
                    <p className="text-sm text-muted-foreground truncate max-w-xs">
                      {order.delivery_address}
                    </p>
                    {order.latitude && order.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                      >
                        <MapPin className="w-3 h-3" />
                        View Delivery Location
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
