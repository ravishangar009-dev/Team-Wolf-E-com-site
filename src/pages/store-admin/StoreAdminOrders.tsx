import { useEffect, useState } from "react";
import { StoreAdminLayout } from "@/components/store-admin/StoreAdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Bell, Volume2, VolumeX, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfDay, endOfDay, subDays, startOfWeek } from "date-fns";
import { useStoreAdmin } from "@/hooks/useStoreAdmin";
import { useOrderSound } from "@/hooks/useOrderSound";
import { StoreAdminOrderCard } from "@/components/store-admin/StoreAdminOrderCard";
import { StoreAdminOrderDialog } from "@/components/store-admin/StoreAdminOrderDialog";

export interface OrderData {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  delivery_address: string;
  phone: string;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  order_items?: Array<{
    id: string;
    quantity: number;
    price: number;
    products?: { name: string };
  }>;
}

const StoreAdminOrders = () => {
  const { storeAdminInfo } = useStoreAdmin();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("today");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { playNotificationSound } = useOrderSound();

  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "yesterday":
        return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
      case "this_week":
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfDay(now) };
      case "last_7_days":
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case "all_time":
        return null;
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
    }
  };

  const fetchOrders = async () => {
    if (!storeAdminInfo?.store_id) return;

    let query = supabase
      .from("orders")
      .select("*, order_items(id, quantity, price, products(name))")
      .eq("store_id", storeAdminInfo.store_id)
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const dateRange = getDateRange();
    if (dateRange) {
      query = query.gte("created_at", dateRange.start.toISOString()).lte("created_at", dateRange.end.toISOString());
    }

    const { data, error } = await query;
    if (!error) {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!storeAdminInfo?.store_id) return;

    fetchOrders();

    const channel = supabase
      .channel('store-admin-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeAdminInfo.store_id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            if (soundEnabled) {
              playNotificationSound();
            }
            toast.success("🔔 New order received!", {
              description: `Order #${(payload.new as OrderData).id.slice(0, 8)}`,
              icon: <Bell className="w-4 h-4" />,
              duration: 8000,
            });
          }
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeAdminInfo?.store_id, filter, dateFilter, soundEnabled, playNotificationSound]);

  return (
    <StoreAdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-outfit font-bold">Orders</h1>
            <p className="text-sm text-muted-foreground">Manage your store orders</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center gap-1.5"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? "Sound On" : "Sound Off"}</span>
            </Button>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                <SelectItem value="all_time">All Time</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No orders found for {dateFilter === "today" ? "today" : dateFilter.replace(/_/g, " ")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{orders.length} order(s)</p>
            {orders.map((order) => (
              <StoreAdminOrderCard
                key={order.id}
                order={order}
                onViewDetails={() => setSelectedOrder(order)}
              />
            ))}
          </div>
        )}

        <StoreAdminOrderDialog
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={() => fetchOrders()}
        />
      </div>
    </StoreAdminLayout>
  );
};

export default StoreAdminOrders;
