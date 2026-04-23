import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, ShoppingBag, Receipt, ArrowUpRight, ArrowDownRight, Calendar, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfDay, subDays, startOfWeek, startOfMonth } from "date-fns";

interface RevenueStats {
  onlineRevenue: number;
  offlineRevenue: number;
  totalRevenue: number;
  onlineCount: number;
  offlineCount: number;
}

interface OfflineBill {
  id: string;
  customer_name: string;
  total_amount: number;
  created_at: string;
  payment_method: string;
}

export default function AdminRevenue() {
  const [stats, setStats] = useState<RevenueStats>({
    onlineRevenue: 0,
    offlineRevenue: 0,
    totalRevenue: 0,
    onlineCount: 0,
    offlineCount: 0
  });
  const [recentBills, setRecentBills] = useState<OfflineBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");

  useEffect(() => {
    fetchRevenueData();
  }, [timeRange]);

  const fetchRevenueData = async () => {
    setLoading(true);
    let startDate: Date | null = null;
    const now = new Date();

    if (timeRange === "today") startDate = startOfDay(now);
    else if (timeRange === "week") startDate = startOfWeek(now);
    else if (timeRange === "month") startDate = startOfMonth(now);
    else if (timeRange === "last7") startDate = subDays(now, 7);

    try {
      // 1. Fetch Online Orders
      let onlineQuery = supabase.from("orders").select("total_amount, status");
      if (startDate) onlineQuery = onlineQuery.gte("created_at", startDate.toISOString());
      
      const { data: onlineData } = await onlineQuery;
      const validOnline = onlineData?.filter(o => o.status !== "cancelled") || [];
      const onlineRevenue = validOnline.reduce((sum, o) => sum + Number(o.total_amount), 0);

      // 2. Fetch Offline Bills
      let offlineQuery = supabase.from("offline_bills").select("id, total_amount, customer_name, created_at, payment_method").order("created_at", { ascending: false });
      if (startDate) offlineQuery = offlineQuery.gte("created_at", startDate.toISOString());
      
      const { data: offlineData } = await offlineQuery;
      const offlineRevenue = offlineData?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

      setStats({
        onlineRevenue,
        offlineRevenue,
        totalRevenue: onlineRevenue + offlineRevenue,
        onlineCount: validOnline.length,
        offlineCount: offlineData?.length || 0
      });

      setRecentBills(offlineData?.slice(0, 5) || []);
    } catch (error) {
      console.error("Error fetching revenue:", error);
    } finally {
      setLoading(false);
    }
  };

  const offlineShare = stats.totalRevenue > 0 ? (stats.offlineRevenue / stats.totalRevenue) * 100 : 0;
  const onlineShare = stats.totalRevenue > 0 ? (stats.onlineRevenue / stats.totalRevenue) * 100 : 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-outfit font-bold">Revenue Analytics</h1>
            <p className="text-muted-foreground">Comprehensive view of online and offline sales</p>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="last7">Last 7 Days</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold mt-1">₹{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-full bg-primary/20 text-primary">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> 12%
                </span>
                <span className="text-muted-foreground">vs last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Online Revenue</p>
                  <p className="text-2xl font-bold mt-1">₹{stats.onlineRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats.onlineCount} orders</p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full" style={{ width: `${onlineShare}%` }}></div>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2 font-bold">{onlineShare.toFixed(1)}% OF TOTAL</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Offline Revenue</p>
                  <p className="text-2xl font-bold mt-1">₹{stats.offlineRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats.offlineCount} bills</p>
                </div>
                <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${offlineShare}%` }}></div>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2 font-bold">{offlineShare.toFixed(1)}% OF TOTAL</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Offline Bills */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Offline Bills</CardTitle>
                <CardDescription>Latest generated in-store receipts</CardDescription>
              </div>
              <Receipt className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBills.map(bill => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">{bill.customer_name || "Guest"}</TableCell>
                      <TableCell className="text-xs">{format(new Date(bill.created_at), "dd MMM, hh:mm a")}</TableCell>
                      <TableCell className="text-right font-bold text-primary">₹{bill.total_amount}</TableCell>
                    </TableRow>
                  ))}
                  {recentBills.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No offline bills yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Revenue Distribution */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>Comparison by channel</CardDescription>
              </div>
              <Filter className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex items-center justify-center gap-12 w-full">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full border-[8px] border-blue-500 flex items-center justify-center">
                    <span className="text-lg font-bold">{onlineShare.toFixed(0)}%</span>
                  </div>
                  <p className="mt-4 font-medium">Online</p>
                </div>
                
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full border-[8px] border-emerald-500 flex items-center justify-center">
                    <span className="text-lg font-bold">{offlineShare.toFixed(0)}%</span>
                  </div>
                  <p className="mt-4 font-medium">Offline</p>
                </div>
              </div>
              
              <div className="mt-12 grid grid-cols-2 gap-8 w-full max-w-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold px-3 border-l-2 border-blue-500">Online Sales</p>
                  <p className="text-xl font-bold px-3">₹{stats.onlineRevenue.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold px-3 border-l-2 border-emerald-500">Offline Sales</p>
                  <p className="text-xl font-bold px-3">₹{stats.offlineRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
