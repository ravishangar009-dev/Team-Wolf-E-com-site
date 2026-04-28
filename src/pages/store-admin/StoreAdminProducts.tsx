import { useState, useEffect } from "react";
import { StoreAdminSidebar } from "@/components/store-admin/StoreAdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
    brand: "",
    in_stock: true,
    image_url: "",
    stock_count: 0,
    alert_count: 5,
    flavors: [] as { name: string; image_url: string; stock: number; price?: number }[],
    selling_price: "",
    vip_discount_percentage: "",
    usage_guide: "",
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
      brand: "",
      in_stock: true,
      image_url: "",
      stock_count: 0,
      alert_count: 5,
      flavors: [],
      selling_price: "",
      vip_discount_percentage: "",
      usage_guide: "",
    });
    setIsDialogOpen(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    setSaving(true);

    try {
      const price = Number(formData.price);
      let offerPrice = formData.selling_price ? Number(formData.selling_price) : null;
      let offerPercentage = null;
      let offerActive = false;

      if (offerPrice && offerPrice < price) {
        offerPercentage = Math.round(((price - offerPrice) / price) * 100);
        offerActive = true;
      } else if (offerPrice && offerPrice >= price) {
        offerPrice = null;
      }

      const vipDiscount = formData.vip_discount_percentage ? Number(formData.vip_discount_percentage) : 0;

      const productData = {
        name: formData.name,
        description: formData.description,
        price,
        category: formData.category,
        brand: formData.brand || null,
        in_stock: formData.in_stock,
        image_url: formData.image_url,
        stock_count: Number(formData.stock_count),
        alert_count: Number(formData.alert_count),
        flavors: formData.flavors.filter(f => f.name.trim() !== ""),
        offer_percentage: offerPercentage,
        offer_price: offerPrice,
        offer_active: offerActive,
        vip_discount_percentage: vipDiscount,
        store_id: store.id,
        usage_guide: formData.usage_guide || null,
      };

      if (formData.id) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", formData.id);

        if (error) {
          console.error("Update error:", error);
          toast.error("Failed to update product: " + error.message);
        } else {
          toast.success("Product updated successfully");
          try {
            await logProductAction("edited", formData.name, formData.id, { changes: productData });
          } catch (logError) {
            console.error("Failed to log action:", logError);
          }
        }
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert([productData])
          .select()
          .single();

        if (error) {
          console.error("Insert error:", error);
          toast.error("Failed to add product: " + error.message);
        } else {
          toast.success("Product added successfully");
          try {
            await logProductAction("added", formData.name, data?.id, productData);
          } catch (logError) {
            console.error("Failed to log action:", logError);
          }
        }
      }
      setIsDialogOpen(false);
      fetchStoreAndProducts();
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete product: " + error.message);
    } else {
      toast.success("Product deleted successfully");
      await logProductAction("deleted", name, id, null);
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
                     setFormData({ 
                      ...p, 
                      price: p.price.toString(),
                      brand: p.brand || "",
                      flavors: (p.flavors || []).map((f: any) => 
                        typeof f === 'string' 
                          ? { name: f, image_url: "", stock: p.stock_count || 0, price: p.price } 
                          : { name: f.name || "", image_url: f.image_url || "", stock: f.stock ?? 0, price: f.price ?? p.price }
                      ),
                      selling_price: p.offer_price?.toString() || "",
                      vip_discount_percentage: p.vip_discount_percentage?.toString() || "",
                      usage_guide: p.usage_guide || "",
                    });
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
                  <label className="text-sm font-medium">MRP Price (₹) *</label>
                  <Input 
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Selling Price (₹)</label>
                  <Input 
                    type="number"
                    value={formData.selling_price}
                    onChange={e => setFormData({ ...formData, selling_price: e.target.value })}
                    placeholder="Leave empty if no discount"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">VIP Customer Discount (%)</label>
                  <Input 
                    type="number"
                    value={formData.vip_discount_percentage}
                    onChange={e => setFormData({ ...formData, vip_discount_percentage: e.target.value })}
                    placeholder="e.g. 10"
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
                  <label className="text-sm font-medium block mb-2">Flavors (Separate Stock per Flavor)</label>
                  <div className="space-y-3">
                    {formData.flavors.map((flavor, index) => (
                      <div key={index} className="flex flex-col gap-2 p-3 border rounded-md bg-muted/20">
                        <div className="flex items-center gap-2">
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
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            className="flex-shrink-0"
                            onClick={() => {
                              const newFlavors = formData.flavors.filter((_, i) => i !== index);
                              setFormData({ ...formData, flavors: newFlavors });
                            }}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Flavor Stock</label>
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
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Flavor Price (₹)</label>
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
                              placeholder={formData.price}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setFormData({ ...formData, flavors: [...formData.flavors, { name: "", image_url: "", stock: 0, price: Number(formData.price) || 0 }] })}>
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
                <div>
                  <label className="text-sm font-medium">Brand Name</label>
                  <Input 
                    value={formData.brand}
                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. MuscleBlaze, ON"
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
                  <label className="text-sm font-medium block mb-2">Product Image URL</label>
                  <div className="space-y-2">
                    <Input 
                      value={formData.image_url}
                      onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                    {formData.image_url && (
                      <div className="relative w-full aspect-square border rounded-md overflow-hidden bg-muted">
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                          onClick={() => setFormData({ ...formData, image_url: "" })}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Description</label>
                  <Textarea 
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="h-24"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">How to Use (User Manual Guide)</label>
                  <Textarea 
                    value={formData.usage_guide}
                    onChange={e => setFormData({ ...formData, usage_guide: e.target.value })}
                    className="h-24"
                    placeholder="Instructions on how to use this product..."
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
