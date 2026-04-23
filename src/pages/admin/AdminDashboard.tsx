import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Store, Package, ShoppingCart, TrendingUp, Clock, CheckCircle, Trash2 } from "lucide-react";
import { SiteControlCard } from "@/components/admin/SiteControlCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
}

interface RecentOrder {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  delivery_address: string;
  phone: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          supabase.from("products").select("id", { count: "exact" }),
          supabase.from("orders").select("*"),
        ]);

        const orders = ordersRes.data || [];
        const pendingOrders = orders.filter((o) => o.status === "pending").length;
        const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
        const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);

        setStats({
          totalProducts: productsRes.count || 0,
          totalOrders: orders.length,
          pendingOrders,
          deliveredOrders,
          totalRevenue,
        });

        // Get recent orders
        const { data: recent } = await supabase
          .from("orders")
          .select("id, created_at, total_amount, status, delivery_address, phone")
          .order("created_at", { ascending: false })
          .limit(5);

        setRecentOrders((recent as any[]) || []);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleClearOrders = async (status: string) => {
    const { error } = await supabase.from("orders").delete().eq("status", status);
    if (error) {
      toast.error(`Failed to clear ${status} orders`);
    } else {
      toast.success(`${status} orders cleared`);
      // Re-fetch
      window.location.reload();
    }
  };

  const handleClearAllOrders = async () => {
    // Delete order_items first, then orders
    const { data: orders } = await supabase.from("orders").select("id");
    if (orders && orders.length > 0) {
      const ids = orders.map((o) => o.id);
      await supabase.from("order_items").delete().in("order_id", ids);
      const { error } = await supabase.from("orders").delete().in("id", ids);
      if (error) {
        toast.error("Failed to clear all orders");
      } else {
        toast.success("All orders cleared");
        window.location.reload();
      }
    }
  };

  const statCards = [
    { title: "Total Products", value: stats.totalProducts, icon: Package, color: "text-green-500" },
    { title: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "text-purple-500" },
    { title: "Pending Orders", value: stats.pendingOrders, icon: Clock, color: "text-orange-500" },
    { title: "Delivered", value: stats.deliveredOrders, icon: CheckCircle, color: "text-emerald-500" },
    { title: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-outfit font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your delivery platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-secondary ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Site Control */}
        <SiteControlCard />

        {/* Clear Data Section */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Clear Data
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30">
                  Clear Delivered Orders
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear delivered orders?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete all delivered orders and their items.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleClearOrders("delivered")}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30">
                  Clear Cancelled Orders
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear cancelled orders?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete all cancelled orders and their items.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleClearOrders("cancelled")}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Clear All Orders
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear ALL orders?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete all orders and order items. This cannot be undone!</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllOrders} className="bg-destructive text-destructive-foreground">Delete All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : recentOrders.length === 0 ? (
              <p className="text-muted-foreground">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">#{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">{order.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">₹{order.total_amount}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          order.status === "delivered"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
