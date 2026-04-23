import { useState, useEffect } from "react";
import { StoreAdminSidebar } from "@/components/store-admin/StoreAdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ProductImageUpload } from "@/components/admin/ProductImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const StoreAdminProducts = () => {
  const [store, setStore] = useState<{ id: string; name: string } | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    category: "",
    in_stock: true,
    image_url: "",
    stock_count: 0,
    alert_count: 5,
    flavors: [] as string[],
  });

  const fetchStoreAndProducts = async () => {
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
      setLoading(false);
      return;
    }

    setStore({
      id: adminData.store_id,
      name: adminData.stores?.name || "Store",
    });

    // Get store's products
    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", adminData.store_id)
      .order("created_at", { ascending: false });

    if (productsData) setProducts(productsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchStoreAndProducts();
  }, []);

  const openNewProduct = () => {
    setFormData({
      id: "",
      name: "",
      description: "",
      price: "",
      category: "",
      in_stock: true,
      image_url: "",
      stock_count: 0,
      alert_count: 5,
      flavors: [],
    });
    setIsDialogOpen(true);
  };

  const logProductAction = async (action: string, productName: string, productId: string | null, details: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.from("product_audit_log").insert({
      user_id: session.user.id,
      action,
      product_name: productName,
      product_id: productId,
      details,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    setSaving(true);

    const productData = {
      name: formData.name,
      description: formData.description,
      price: Number(formData.price),
      category: formData.category,
      in_stock: formData.in_stock,
      image_url: formData.image_url,
      stock_count: Number(formData.stock_count),
      alert_count: Number(formData.alert_count),
      flavors: formData.flavors.filter(f => f.trim() !== ""),
      store_id: store.id,
    };

    if (formData.id) {
      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", formData.id);

      if (error) {
        toast.error("Failed to update product");
      } else {
        toast.success("Product updated");
        await logProductAction("EDIT", formData.name, formData.id, { changes: productData });
      }
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert([productData])
        .select()
        .single();

      if (error) {
        toast.error("Failed to default product");
      } else {
        toast.success("Product added");
        await logProductAction("ADD", formData.name, data?.id, productData);
      }
    }

    setSaving(false);
    setIsDialogOpen(false);
    fetchStoreAndProducts();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete product");
    } else {
      toast.success("Product deleted");
      await logProductAction("DELETE", name, id, null);
      fetchStoreAndProducts();
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-background">
      <StoreAdminSidebar storeName={store?.name || "Store"} />
      
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-outfit font-bold">Products</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              Manage inventory for your store
            </p>
          </div>
          <Button onClick={openNewProduct} className="gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        </div>

        <div className="grid gap-4 bg-card border border-border p-4 rounded-lg shadow-sm">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4 border rounded-md bg-background">
              <div className="flex items-center gap-4">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded" />
                )}
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                    <span>₹{p.price}</span>
                    <span className={p.in_stock ? "text-green-500" : "text-red-500"}>
                      {p.in_stock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    setFormData({ ...p, price: p.price.toString() });
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={() => handleDelete(p.id, p.name)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No products found. Click "Add Product" to create one.
            </div>
          )}
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formData.id ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <Input 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Price (₹) *</label>
                  <Input 
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Stock Count</label>
                  <Input 
                    type="number"
                    value={formData.stock_count}
                    onChange={e => setFormData({ ...formData, stock_count: Number(e.target.value) })}
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Alert Count Threshold</label>
                  <Input 
                    type="number"
                    value={formData.alert_count}
                    onChange={e => setFormData({ ...formData, alert_count: Number(e.target.value) })}
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Flavors</label>
                  <div className="space-y-2">
                    {formData.flavors.map((flavor, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input 
                          value={flavor} 
                          onChange={(e) => {
                            const newFlavors = [...formData.flavors];
                            newFlavors[index] = e.target.value;
                            setFormData({ ...formData, flavors: newFlavors });
                          }} 
                          placeholder="e.g. Chocolate" 
                        />
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
                    ))}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setFormData({ ...formData, flavors: [...formData.flavors, ""] })}>
                      <Plus className="w-4 h-4 mr-2" /> Add Flavor
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input 
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Protein, Pre-workout"
                  />
                </div>
                <div className="flex items-center justify-between border p-3 rounded-md">
                  <label className="text-sm font-medium cursor-pointer">In Stock</label>
                  <Switch 
                    checked={formData.in_stock}
                    onCheckedChange={checked => setFormData({ ...formData, in_stock: checked })}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Product Image</label>
                  <ProductImageUpload
                    productId={formData.id || "new"}
                    currentImage={formData.image_url}
                    onUploadComplete={(url) => setFormData({ ...formData, image_url: url })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Description</label>
                  <Textarea 
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="h-32"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving..." : "Save Product"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StoreAdminProducts;
