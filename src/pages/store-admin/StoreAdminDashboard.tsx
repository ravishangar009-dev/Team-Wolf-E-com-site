import { useEffect, useState } from "react";
import { StoreAdminSidebar } from "@/components/store-admin/StoreAdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

export default function StoreAdminDashboard() {
  const [store, setStore] = useState<{ id: string; name: string } | null>(null);
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorDialog, setErrorDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStoreAndStats();
  }, []);

  const fetchStoreAndStats = async () => {
    setLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get assigned store
    const { data: adminData } = await supabase
      .from("store_admins")
      .select("store_id, stores(name)")
      .eq("user_id", session.user.id)
      .single();

    if (!adminData) {
      setErrorDialog(true);
      setLoading(false);
      return;
    }

    const currentStore = {
      id: adminData.store_id,
      name: adminData.stores?.name || "Store",
    };
    setStore(currentStore);

    // Get stats for this store
    const [productsRes, ordersRes] = await Promise.all([
      supabase.from("products").select("id", { count: "exact" }).eq("store_id", currentStore.id),
      supabase.from("orders").select("total_amount").eq("store_id", currentStore.id),
    ]);

    setStats({
      products: productsRes.count || 0,
      orders: ordersRes.data?.length || 0,
      revenue: ordersRes.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
    });

    setLoading(false);
  };

  const handleNoAccess = () => {
    setErrorDialog(false);
    navigate('/');
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Dialog open={errorDialog} onOpenChange={(open) => { if (!open) handleNoAccess(); }}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} closable={false}>
          <DialogHeader>
            <DialogTitle>Access Denied</DialogTitle>
            <DialogDescription>
              You do not have temp admin access. Please ask the main administrator to grant you access via your User ID.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
             <button onClick={handleNoAccess} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors">
               Return to Home
             </button>
          </div>
        </DialogContent>
      </Dialog>

      <StoreAdminSidebar storeName={store?.name || "Temp Admin"} />
      
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-outfit font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Managing products for: <span className="font-semibold text-primary">{store?.name}</span></p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.products}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.orders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.revenue}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 font-outfit">Temp Admin Guidelines</h2>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            <li>You can manage products (Add, Edit, Delete).</li>
            <li>You can manage orders (Update Status).</li>
            <li><strong className="text-foreground">Important:</strong> Every product change you make is recorded in the main Activity Log.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}