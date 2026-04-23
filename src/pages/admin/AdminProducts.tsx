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
  image_url: string | null;
  in_stock: boolean | null;
  stock_count?: number | null;
  alert_count?: number | null;
  flavors?: any[] | null;
  store_id: string;
  offer_percentage: number | null;
  offer_price: number | null;
  offer_active: boolean | null;
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
    image_url: "",
    store_id: "",
    in_stock: true,
    stock_count: 0,
    alert_count: 5,
    flavors: [] as { name: string; image_url: string }[],
    offer_percentage: "",
    offer_active: false,
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
      image_url: "",
      store_id: "",
      in_stock: true,
      stock_count: 0,
      alert_count: 5,
      flavors: [],
      offer_percentage: "",
      offer_active: false,
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: ProductData) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      category: product.category || "",
      image_url: product.image_url || "",
      store_id: product.store_id,
      in_stock: product.in_stock ?? true,
      stock_count: product.stock_count ?? 0,
      alert_count: product.alert_count ?? 5,
      flavors: (product.flavors || []).map((f: any) => 
        typeof f === 'string' ? { name: f, image_url: "" } : { name: f.name || "", image_url: f.image_url || "" }
      ),
      offer_percentage: product.offer_percentage?.toString() || "",
      offer_active: product.offer_active ?? false,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const offerPercentage = formData.offer_percentage ? parseInt(formData.offer_percentage) : null;
    const price = parseFloat(formData.price);
    const offerPrice = offerPercentage && formData.offer_active 
      ? Math.round(price * (1 - offerPercentage / 100) * 100) / 100 
      : null;

    const productData = {
      name: formData.name,
      description: formData.description || null,
      price,
      category: formData.category || null,
      image_url: formData.image_url || null,
      store_id: editingProduct ? editingProduct.store_id : (formData.store_id || stores[0]?.id),
      in_stock: formData.in_stock,
      stock_count: formData.stock_count,
      alert_count: formData.alert_count,
      flavors: formData.flavors.filter(f => f.name.trim() !== ""),
      offer_percentage: offerPercentage,
      offer_price: offerPrice,
      offer_active: formData.offer_active,
    };

    if (editingProduct) {
      const { error } = await supabase.from("products").update(productData).eq("id", editingProduct.id);
      if (error) {
        toast.error("Failed to update product");
        return;
      }
      toast.success("Product updated successfully");
    } else {
      const { error } = await supabase.from("products").insert(productData);
      if (error) {
        toast.error("Failed to create product");
        return;
      }
      toast.success("Product created successfully");
    }

    setDialogOpen(false);
    resetForm();
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete product");
      return;
    }
    toast.success("Product deleted successfully");
    fetchProducts();
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
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
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
                      <div key={index} className="flex gap-2 items-start border p-2 rounded relative">
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
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => {
                            const newFlavors = formData.flavors.filter((_, i) => i !== index);
                            setFormData({ ...formData, flavors: newFlavors });
                          }}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setFormData({ ...formData, flavors: [...formData.flavors, { name: "", image_url: "" }] })}>
                      <Plus className="w-4 h-4 mr-2" /> Add Flavor
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" placeholder="e.g., Vegetables, Snacks" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
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
                <div className="border-t pt-4 mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-primary" />
                      <Label>Product Offer</Label>
                    </div>
                    <Switch
                      checked={formData.offer_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, offer_active: checked })}
                    />
                  </div>
                  {formData.offer_active && (
                    <div>
                      <Label htmlFor="offer_percentage">Discount Percentage (%)</Label>
                      <Input
                        id="offer_percentage"
                        type="number"
                        min="1"
                        max="99"
                        placeholder="e.g., 10"
                        value={formData.offer_percentage}
                        onChange={(e) => setFormData({ ...formData, offer_percentage: e.target.value })}
                      />
                      {formData.offer_percentage && formData.price && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Offer price: ₹{(parseFloat(formData.price) * (1 - parseInt(formData.offer_percentage) / 100)).toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
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
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Offer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.stores?.name || "-"}</TableCell>
                      <TableCell>{product.category || "-"}</TableCell>
                      <TableCell>
                        {product.offer_active && product.offer_price ? (
                          <div>
                            <span className="line-through text-muted-foreground text-sm">₹{product.price}</span>
                            <span className="font-bold text-primary ml-2">₹{product.offer_price}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-primary">₹{product.price}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.offer_active && product.offer_percentage ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                            {product.offer_percentage}% OFF
                          </span>
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
