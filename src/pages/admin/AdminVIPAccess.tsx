import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Crown, Percent, Search, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface VIPCustomer {
  id: string;
  user_id: string;
  global_discount: number;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
}

interface ProductDiscount {
  id: string;
  vip_id: string;
  product_id: string;
  discount_percentage: number;
  products: { name: string } | null;
}

export default function AdminVIPAccess() {
  const [vips, setVips] = useState<VIPCustomer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedVipDiscounts, setSelectedVipDiscounts] = useState<ProductDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddVip, setShowAddVip] = useState(false);
  const [showProductDiscount, setShowProductDiscount] = useState(false);
  const [selectedVipId, setSelectedVipId] = useState<string | null>(null);
  
  // Form states
  const [newUserId, setNewUserId] = useState("");
  const [newGlobalDiscount, setNewGlobalDiscount] = useState("0");
  const [productId, setProductId] = useState("");
  const [specificDiscount, setSpecificDiscount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVips();
    fetchProducts();
  }, []);

  const fetchVips = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vip_customers")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error) setVips(data || []);
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("id, name").order("name");
    setProducts(data || []);
  };

  const fetchProductDiscounts = async (vipId: string) => {
    const { data } = await supabase
      .from("vip_product_discounts")
      .select(`
        id, vip_id, product_id, discount_percentage,
        products (name)
      `)
      .eq("vip_id", vipId);
    setSelectedVipDiscounts(data as any[] || []);
  };

  const handleAddVip = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from("vip_customers").insert({
      user_id: newUserId,
      global_discount: Number(newGlobalDiscount)
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("VIP access granted!");
      setShowAddVip(false);
      setNewUserId("");
      setNewGlobalDiscount("0");
      fetchVips();
    }
    setSubmitting(false);
  };

  const handleRemoveVip = async (id: string) => {
    if (!confirm("Remove VIP status for this user?")) return;
    const { error } = await supabase.from("vip_customers").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("VIP status revoked");
      fetchVips();
    }
  };

  const handleAddProductDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVipId) return;

    const { error } = await supabase.from("vip_product_discounts").upsert({
      vip_id: selectedVipId,
      product_id: productId,
      discount_percentage: Number(specificDiscount)
    }, { onConflict: "vip_id,product_id" });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Specific discount applied!");
      setProductId("");
      setSpecificDiscount("");
      fetchProductDiscounts(selectedVipId);
    }
  };

  const handleRemoveProductDiscount = async (id: string) => {
    const { error } = await supabase.from("vip_product_discounts").delete().eq("id", id);
    if (!error && selectedVipId) fetchProductDiscounts(selectedVipId);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-outfit font-bold flex items-center gap-3">
              <Crown className="w-8 h-8 text-yellow-500" />
              VIP Customer Access
            </h1>
            <p className="text-muted-foreground">Manage premium discounts and elite user themes</p>
          </div>

          <Dialog open={showAddVip} onOpenChange={setShowAddVip}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-yellow-600 hover:bg-yellow-700">
                <Plus className="w-4 h-4" />
                Add VIP Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Grant VIP Access</DialogTitle>
                <DialogDescription>
                  Enter the User ID and set a global discount for this customer.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddVip} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>User ID (UUID)</Label>
                  <Input 
                    placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" 
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Global Discount Percentage (%)</Label>
                  <Input 
                    type="number" 
                    value={newGlobalDiscount}
                    onChange={(e) => setNewGlobalDiscount(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">This applies to ALL products unless specific ones are set.</p>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Granting..." : "Grant VIP Access"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-yellow-900/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
          <CardHeader>
            <CardTitle>VIP Members</CardTitle>
            <CardDescription>Elite customers getting special pricing and theme</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Global Discount</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vips.map((vip) => (
                  <TableRow key={vip.id} className="group">
                    <TableCell className="font-mono text-xs">{vip.user_id}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                        <Percent className="w-3 h-3" />
                        {vip.global_discount}%
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(vip.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-1 border-yellow-900/30 hover:bg-yellow-500/10"
                        onClick={() => {
                          setSelectedVipId(vip.id);
                          fetchProductDiscounts(vip.id);
                          setShowProductDiscount(true);
                        }}
                      >
                        <Package className="w-3.5 h-3.5" />
                        Custom Offers
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveVip(vip.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {vips.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      No VIP customers assigned yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Product Specific Discounts Dialog */}
        <Dialog open={showProductDiscount} onOpenChange={setShowProductDiscount}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Product Specific Discounts</DialogTitle>
              <DialogDescription>
                Set unique discounts for specific products for this VIP customer.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAddProductDiscount} className="flex gap-4 items-end mb-6">
              <div className="flex-1 space-y-2">
                <Label>Select Product</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  required
                >
                  <option value="">Select a product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-32 space-y-2">
                <Label>Discount %</Label>
                <Input 
                  type="number" 
                  placeholder="e.g. 15" 
                  value={specificDiscount}
                  onChange={(e) => setSpecificDiscount(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700">Add</Button>
            </form>

            <div className="max-h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedVipDiscounts.map(pd => (
                    <TableRow key={pd.id}>
                      <TableCell>{pd.products?.name}</TableCell>
                      <TableCell className="font-bold text-yellow-600">{pd.discount_percentage}%</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveProductDiscount(pd.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {selectedVipDiscounts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No product specific discounts yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
