import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingCart, MapPin, Phone, ExternalLink, CheckCircle2, Clock, Truck, Package, Bell, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import OrderTimeline from "@/components/OrderTimeline";
import DeliveryLocationMap from "@/components/DeliveryLocationMap";
import { useOrderSound } from "@/hooks/useOrderSound";

interface OrderData {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  delivery_address: string;
  phone: string;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  delivery_updated_at: string | null;
  delivery_agent_id: string | null;
  stores?: { name: string };
  order_items?: Array<{
    id: string;
    quantity: number;
    price: number;
    products?: { name: string };
  }>;
  delivery_agents?: { id: string; full_name: string } | null;
}

interface AgentOption {
  id: string;
  full_name: string;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const { playNotificationSound } = useOrderSound();

  const fetchOrders = async () => {
    let query = supabase
      .from("orders")
      .select("*, stores(name), order_items(id, quantity, price, products(name)), delivery_agents(id, full_name)")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (!error) {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const fetchAgents = async () => {
    const { data } = await supabase
      .from("delivery_agents")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name");
    setAgents(data || []);
  };

  const reassignAgent = async (orderId: string, agentId: string | null) => {
    const { error } = await supabase
      .from("orders")
      .update({ delivery_agent_id: agentId, assigned_at: agentId ? new Date().toISOString() : null })
      .eq("id", orderId);
    if (error) {
      toast.error("Failed to reassign agent");
    } else {
      toast.success("Delivery agent updated");
      fetchOrders();
    }
  };

  // Real-time subscription for orders
  useEffect(() => {
    fetchOrders();
    fetchAgents();

    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Order change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Play sound alert for new orders
            if (soundEnabled) {
              playNotificationSound();
            }
            
            toast.success("🔔 New order received!", {
              description: `Order #${(payload.new as OrderData).id.slice(0, 8)}`,
              icon: <Bell className="w-4 h-4" />,
              duration: 8000,
            });
          }
          
          // Refetch to get complete order data with relations
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter, soundEnabled, playNotificationSound]);

  const sendStatusNotification = async (order: OrderData, newStatus: string) => {
    try {
      // Use edge function to handle notification - it will fetch user email server-side
      const { error } = await supabase.functions.invoke('send-order-status-notification', {
        body: {
          orderId: order.id,
          userId: order.user_id,
          customerPhone: order.phone,
          storeName: order.stores?.name || "Store",
          newStatus,
          totalAmount: order.total_amount,
        },
      });

      if (error) {
        console.error("Failed to send notification:", error);
      } else {
        console.log("Status notification sent successfully");
      }
    } catch (err) {
      console.error("Error sending notification:", err);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    
    if (error) {
      toast.error("Failed to update order status");
      setUpdatingStatus(false);
      return;
    }

    // Send email notification to customer
    const order = orders.find(o => o.id === orderId);
    if (order) {
      sendStatusNotification(order, newStatus);
    }

    toast.success(`Order marked as ${newStatus.replace(/_/g, " ")}`);
    setUpdatingStatus(false);
    setSelectedOrder(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-700";
      case "accepted":
        return "bg-blue-100 text-blue-700";
      case "out_for_delivery":
        return "bg-purple-100 text-purple-700";
      case "delivered":
        return "bg-emerald-100 text-emerald-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "pending":
        return "accepted";
      case "accepted":
        return "out_for_delivery";
      case "out_for_delivery":
        return "delivered";
      default:
        return null;
    }
  };

  const getNextStatusLabel = (currentStatus: string) => {
    switch (currentStatus) {
      case "pending":
        return "Accept Order";
      case "accepted":
        return "Mark Out for Delivery";
      case "out_for_delivery":
        return "Mark Delivered";
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-outfit font-bold">Orders</h1>
            <p className="text-muted-foreground">Manage and track all orders</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center gap-2"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Sound On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span className="hidden sm:inline">Sound Off</span>
                </>
              )}
            </Button>

            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No orders found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Phone</TableHead>
                     <TableHead>Amount</TableHead>
                     <TableHead>Agent</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">#{order.id.slice(0, 8)}</TableCell>
                      <TableCell>{format(new Date(order.created_at), "dd MMM, hh:mm a")}</TableCell>
                      <TableCell>{order.stores?.name || "-"}</TableCell>
                      <TableCell>{order.phone}</TableCell>
                      <TableCell className="font-bold text-primary">₹{order.total_amount}</TableCell>
                      <TableCell>
                        <Select
                          value={order.delivery_agent_id || "unassigned"}
                          onValueChange={(val) => reassignAgent(order.id, val === "unassigned" ? null : val)}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {agents.map((a) => (
                              <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status || "pending")}`}>
                          {order.status?.replace(/_/g, " ") || "pending"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order #{selectedOrder?.id.slice(0, 8)}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Store</p>
                    <p className="font-medium">{selectedOrder.stores?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">{format(new Date(selectedOrder.created_at), "dd MMM yyyy, hh:mm a")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
                    <p className="font-medium">{selectedOrder.phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedOrder.status || "pending")}`}>
                      {selectedOrder.status?.replace(/_/g, " ") || "pending"}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" /> Delivery Address</p>
                  <p className="font-medium">{selectedOrder.delivery_address}</p>
                  {selectedOrder.latitude && selectedOrder.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${selectedOrder.latitude},${selectedOrder.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-sm flex items-center gap-1 mt-1 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View on Map
                    </a>
                  )}
                </div>

                <div>
                  <p className="text-muted-foreground mb-2">Order Items</p>
                  <div className="space-y-2">
                    {selectedOrder.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center bg-secondary/50 p-3 rounded-lg">
                        <div>
                          <p className="font-medium">{item.products?.name}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-bold">₹{item.price * item.quantity}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <p className="font-semibold">Total Amount</p>
                    <p className="text-xl font-bold text-primary">₹{selectedOrder.total_amount}</p>
                  </div>
                </div>

                {/* Order Timeline */}
                <div>
                  <p className="text-muted-foreground mb-3">Order Progress</p>
                  <OrderTimeline status={selectedOrder.status || "pending"} />
                </div>

                {/* Delivery Location Update (for out_for_delivery orders) */}
                {(selectedOrder.status === "out_for_delivery" || selectedOrder.status === "accepted") && (
                  <div className="pt-4 border-t">
                    <DeliveryLocationMap
                      orderId={selectedOrder.id}
                      deliveryLat={selectedOrder.delivery_lat}
                      deliveryLng={selectedOrder.delivery_lng}
                      customerLat={selectedOrder.latitude}
                      customerLng={selectedOrder.longitude}
                      isAdmin={true}
                      onLocationUpdated={fetchOrders}
                    />
                  </div>
                )}

                {/* Status Update Actions */}
                {selectedOrder.status !== "delivered" && selectedOrder.status !== "cancelled" && (
                  <div className="space-y-3 pt-4 border-t">
                    <p className="text-muted-foreground text-sm font-medium">Update Status</p>
                    <div className="flex flex-col gap-2">
                      {getNextStatus(selectedOrder.status || "pending") && (
                        <Button 
                          size="sm" 
                          className="w-full bg-primary hover:bg-primary/90"
                          disabled={updatingStatus}
                          onClick={() => updateOrderStatus(selectedOrder.id, getNextStatus(selectedOrder.status || "pending")!)}
                        >
                          {updatingStatus ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Updating...
                            </span>
                          ) : (
                            <>
                              {selectedOrder.status === "pending" && <CheckCircle2 className="w-4 h-4 mr-2" />}
                              {selectedOrder.status === "accepted" && <Truck className="w-4 h-4 mr-2" />}
                              {selectedOrder.status === "out_for_delivery" && <Package className="w-4 h-4 mr-2" />}
                              {getNextStatusLabel(selectedOrder.status || "pending")}
                            </>
                          )}
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="w-full"
                        disabled={updatingStatus}
                        onClick={() => updateOrderStatus(selectedOrder.id, "cancelled")}
                      >
                        Cancel Order
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
