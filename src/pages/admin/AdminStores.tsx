import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StoreData {
  id: string;
  name: string;
  category: string;
  address: string | null;
  phone: string | null;
  delivery_time: string | null;
  rating: number | null;
  is_open: boolean | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_time: string | null;
  closing_time: string | null;
}

const AdminStores = () => {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    address: "",
    phone: "",
    delivery_time: "30-40 mins",
    image_url: "",
    latitude: "",
    longitude: "",
    opening_time: "07:00",
    closing_time: "22:00",
  });

  const fetchStores = async () => {
    const { data, error } = await supabase.from("stores").select("*").order("created_at", { ascending: false });
    if (!error) {
      setStores(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      address: "",
      phone: "",
      delivery_time: "30-40 mins",
      image_url: "",
      latitude: "",
      longitude: "",
      opening_time: "07:00",
      closing_time: "22:00",
    });
    setEditingStore(null);
  };

  const handleEdit = (store: StoreData) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      category: store.category,
      address: store.address || "",
      phone: store.phone || "",
      delivery_time: store.delivery_time || "30-40 mins",
      image_url: store.image_url || "",
      latitude: store.latitude?.toString() || "",
      longitude: store.longitude?.toString() || "",
      opening_time: store.opening_time || "07:00",
      closing_time: store.closing_time || "22:00",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const storeData = {
      name: formData.name,
      category: formData.category,
      address: formData.address || null,
      phone: formData.phone || null,
      delivery_time: formData.delivery_time || null,
      image_url: formData.image_url || null,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      opening_time: formData.opening_time || "07:00",
      closing_time: formData.closing_time || "22:00",
    };

    if (editingStore) {
      const { error } = await supabase.from("stores").update(storeData).eq("id", editingStore.id);
      if (error) {
        toast.error("Failed to update store");
        return;
      }
      toast.success("Store updated successfully");
    } else {
      const { error } = await supabase.from("stores").insert(storeData);
      if (error) {
        toast.error("Failed to create store");
        return;
      }
      toast.success("Store created successfully");
    }

    setDialogOpen(false);
    resetForm();
    fetchStores();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this store?")) return;

    const { error } = await supabase.from("stores").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete store");
      return;
    }
    toast.success("Store deleted successfully");
    fetchStores();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-outfit font-bold">Stores</h1>
            <p className="text-muted-foreground">Manage your partner stores</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Store
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingStore ? "Edit Store" : "Add New Store"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Store Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Input id="category" placeholder="e.g., Grocery, Restaurant" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="delivery_time">Delivery Time</Label>
                  <Input id="delivery_time" placeholder="e.g., 30-40 mins" value={formData.delivery_time} onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input id="image_url" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input id="latitude" type="number" step="any" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input id="longitude" type="number" step="any" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="opening_time">Opening Time</Label>
                    <Input id="opening_time" type="time" value={formData.opening_time} onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="closing_time">Closing Time</Label>
                    <Input id="closing_time" type="time" value={formData.closing_time} onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })} />
                  </div>
                </div>
                <Button type="submit" className="w-full">{editingStore ? "Update Store" : "Create Store"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : stores.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No stores yet. Add your first store!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell className="font-medium">{store.name}</TableCell>
                      <TableCell>{store.category}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{store.address || "-"}</TableCell>
                      <TableCell>{store.phone || "-"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${store.is_open ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {store.is_open ? "Open" : "Closed"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(store)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(store.id)}>
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

export default AdminStores;
