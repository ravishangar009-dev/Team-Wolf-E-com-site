import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Package, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  brand: string | null;
  image_url: string | null;
  in_stock: boolean | null;
  stock_count?: number | null;
  alert_count?: number | null;
  flavors?: any[] | null;
  store_id: string;
  offer_percentage: number | null;
  offer_price: number | null;
  offer_active: boolean | null;
  vip_discount_percentage: number | null;
  usage_guide?: string | null;
  stores?: { name: string };
}

interface StoreOption {
  id: string;
  name: string;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    brand: "",
    image_url: "",
    store_id: "",
    in_stock: true,
    stock_count: 0,
    alert_count: 5,
    flavors: [] as { name: string; image_url: string; stock: number; price?: number }[],
    offer_percentage: "",
    offer_active: false,
    selling_price: "",
    vip_discount_percentage: "",
    usage_guide: "",
  });

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, stores(name)")
      .order("created_at", { ascending: false });
    if (!error) {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const fetchStores = async () => {
    const { data } = await supabase.from("stores").select("id, name").order("name");
    setStores(data || []);
  };

  useEffect(() => {
    fetchProducts();
    fetchStores();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      brand: "",
      image_url: "",
      store_id: "",
      in_stock: true,
      stock_count: 0,
      alert_count: 5,
      flavors: [],
      offer_percentage: "",
      offer_active: false,
      selling_price: "",
      vip_discount_percentage: "",
      usage_guide: "",
    });
    setEditingProduct(null);
  };

  const logProductAction = async (action: string, productName: string, productId: string | null, details: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const detailsString = typeof details === 'object' ? JSON.stringify(details) : details;

    await supabase.from("product_audit_log").insert({
      changed_by: session.user.id,
      changed_by_email: session.user.email,
      action,
      product_name: productName,
      product_id: productId,
      details: detailsString,
    });
  };

  const handleEdit = (product: ProductData) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      category: product.category || "",
      brand: product.brand || "",
      image_url: product.image_url || "",
      store_id: product.store_id,
      in_stock: product.in_stock ?? true,
      stock_count: product.stock_count ?? 0,
      alert_count: product.alert_count ?? 5,
      flavors: (product.flavors || []).map((f: any) => {
        if (typeof f === 'string') return { name: f, image_url: "", stock: product.stock_count || 0 };
        return { 
          name: f.name || "", 
          image_url: f.image_url || "", 
          stock: f.stock ?? (product.stock_count || 0),
          price: f.price ?? (product.price || 0)
        };
      }),
      offer_percentage: product.offer_percentage?.toString() || "",
      offer_active: product.offer_active ?? false,
      selling_price: product.offer_price?.toString() || "",
      vip_discount_percentage: product.vip_discount_percentage?.toString() || "",
      usage_guide: product.usage_guide || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseFloat(formData.price);
    let offerPrice = formData.selling_price ? parseFloat(formData.selling_price) : null;
    let offerPercentage = null;
    let offerActive = false;

    if (offerPrice && offerPrice < price) {
      offerPercentage = Math.round(((price - offerPrice) / price) * 100);
      offerActive = true;
    } else if (offerPrice && offerPrice >= price) {
      offerPrice = null; // Ignore selling price if it's not less than MRP
    }

    const vipDiscount = formData.vip_discount_percentage ? parseFloat(formData.vip_discount_percentage) : 0;

    const productData = {
      name: formData.name,
      description: formData.description || null,
      price,
      category: formData.category || null,
      brand: formData.brand || null,
      image_url: formData.image_url || null,
      store_id: editingProduct ? editingProduct.store_id : (formData.store_id || stores[0]?.id),
      in_stock: formData.in_stock,
      stock_count: formData.stock_count,
      alert_count: formData.alert_count,
      flavors: formData.flavors.filter(f => f.name.trim() !== ""),
      offer_percentage: offerPercentage,
      offer_price: offerPrice,
      offer_active: offerActive,
      vip_discount_percentage: vipDiscount,
      usage_guide: formData.usage_guide || null,
    };

    if (editingProduct) {
      const { error } = await supabase.from("products").update(productData).eq("id", editingProduct.id);
      if (error) {
        console.error("Update error:", error);
        toast.error("Failed to update product: " + error.message);
      } else {
        toast.success("Product updated");
        try {
          await logProductAction("edited", formData.name, editingProduct.id, { changes: productData });
        } catch (logError) {
          console.error("Failed to log action:", logError);
        }
      }
    } else {
      const { data, error } = await supabase.from("products").insert(productData).select().single();
      if (error) {
        console.error("Insert error:", error);
        toast.error("Failed to add product: " + error.message);
      } else {
        toast.success("Product added");
        try {
          await logProductAction("added", formData.name, data?.id, productData);
        } catch (logError) {
          console.error("Failed to log action:", logError);
        }
      }
    }

    setDialogOpen(false);
    resetForm();
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const productToDelete = products.find(p => p.id === id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete product: " + error.message);
    } else {
      toast.success("Product deleted successfully");
      if (productToDelete) {
        await logProductAction("deleted", productToDelete.name, id, null);
      }
      fetchProducts();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-outfit font-bold">Products</h1>
            <p className="text-muted-foreground">Manage products across all stores</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="store">Assign to Store *</Label>
                  <Select 
                    value={formData.store_id} 
                    onValueChange={(value) => setFormData({ ...formData, store_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="usage_guide">How to Use (User Manual Guide)</Label>
                  <Textarea id="usage_guide" placeholder="Instructions on how to use this product..." value={formData.usage_guide} onChange={(e) => setFormData({ ...formData, usage_guide: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="price">MRP Price (₹) *</Label>
                  <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="selling_price">Selling Price (₹)</Label>
                  <Input id="selling_price" type="number" step="0.01" value={formData.selling_price} onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })} placeholder="Leave empty if no discount" />
                </div>
                <div>
                  <Label htmlFor="vip_discount">VIP Customer Discount (%)</Label>
                  <Input id="vip_discount" type="number" step="0.01" value={formData.vip_discount_percentage} onChange={(e) => setFormData({ ...formData, vip_discount_percentage: e.target.value })} placeholder="e.g. 10" />
                  <p className="text-xs text-muted-foreground mt-1">This discount will apply automatically to VIP users.</p>
                </div>
                <div>
                  <Label htmlFor="stock">Stock Count</Label>
                  <Input id="stock" type="number" min="0" value={formData.stock_count} onChange={(e) => setFormData({ ...formData, stock_count: Number(e.target.value) })} />
                </div>
                <div>
                  <Label htmlFor="alert_count">Alert Count Threshold</Label>
                  <Input id="alert_count" type="number" min="0" value={formData.alert_count} onChange={(e) => setFormData({ ...formData, alert_count: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Flavors</Label>
                  <div className="space-y-2 mt-2">
                    {formData.flavors.map((flavor, index) => (
                      <div key={index} className="flex flex-col gap-2 border p-3 rounded bg-muted/20 relative">
                        <div className="flex gap-2 items-start">
                          <div className="flex-1 space-y-2">
                            <Input 
                              value={flavor.name} 
                              onChange={(e) => {
                                const newFlavors = [...formData.flavors];
                                newFlavors[index].name = e.target.value;
                                setFormData({ ...formData, flavors: newFlavors });
                              }} 
                              placeholder="Flavor name (e.g. Chocolate)" 
                            />
                            <Input 
                              value={flavor.image_url} 
                              onChange={(e) => {
                                const newFlavors = [...formData.flavors];
                                newFlavors[index].image_url = e.target.value;
                                setFormData({ ...formData, flavors: newFlavors });
                              }} 
                              placeholder="Flavor Image URL (Optional)" 
                            />
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Stock:</Label>
                                <Input 
                                  type="number"
                                  value={flavor.stock} 
                                  onChange={(e) => {
                                    const newFlavors = [...formData.flavors];
                                    newFlavors[index].stock = Number(e.target.value);
                                    setFormData({ ...formData, flavors: newFlavors });
                                  }} 
                                  min="0"
                                  className="h-8"
                                />
                              </div>
                              <div className="flex-1">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Price (₹):</Label>
                                <Input 
                                  type="number"
                                  value={flavor.price} 
                                  onChange={(e) => {
                                    const newFlavors = [...formData.flavors];
                                    newFlavors[index].price = Number(e.target.value);
                                    setFormData({ ...formData, flavors: newFlavors });
                                  }} 
                                  min="0"
                                  className="h-8"
                                  placeholder={formData.price.toString()}
                                />
                              </div>
                            </div>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              const newFlavors = formData.flavors.filter((_, i) => i !== index);
                              setFormData({ ...formData, flavors: newFlavors });
                            }}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setFormData({ ...formData, flavors: [...formData.flavors, { name: "", image_url: "", stock: 0, price: Number(formData.price) || 0 }] })}>
                      <Plus className="w-4 h-4 mr-2" /> Add Flavor
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" placeholder="e.g., Protein, Pre-workout" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="brand">Brand Name</Label>
                  <Input id="brand" placeholder="e.g., MuscleBlaze, ON" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input id="image_url" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="in_stock"
                    checked={formData.in_stock}
                    onChange={(e) => setFormData({ ...formData, in_stock: e.target.checked })}
                    className="rounded border-input"
                  />
                  <Label htmlFor="in_stock">In Stock</Label>
                </div>

                <Button type="submit" className="w-full">{editingProduct ? "Update Product" : "Create Product"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No products yet. Add your first product!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>MRP Price</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>VIP Discount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.stores?.name || "-"}</TableCell>
                      <TableCell>
                        {product.brand ? (
                          <span className="font-semibold text-xs">{product.brand}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>{product.category || "-"}</TableCell>
                      <TableCell>
                        <span className="line-through text-muted-foreground">₹{product.price}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">₹{product.offer_price || product.price}</span>
                        {product.offer_active && product.offer_percentage && (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                            {product.offer_percentage}% OFF
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.vip_discount_percentage ? (
                          <span className="text-blue-600 font-medium">{product.vip_discount_percentage}% OFF</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${product.in_stock ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {product.in_stock ? "In Stock" : "Out of Stock"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
