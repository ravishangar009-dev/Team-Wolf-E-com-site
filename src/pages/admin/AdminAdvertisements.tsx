import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Image, Loader2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  shop_name: string | null;
  shop_phone: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const AdminAdvertisements = () => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState("0");

  useEffect(() => { fetchAds(); }, []);

  const fetchAds = async () => {
    const { data, error } = await supabase
      .from("advertisements")
      .select("*")
      .order("display_order", { ascending: true });
    if (data && !error) setAds(data as Advertisement[]);
    setLoading(false);
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setImageUrl("");
    setShopName(""); setShopPhone(""); setIsActive(true);
    setDisplayOrder("0"); setEditingAd(null);
  };

  const openEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setTitle(ad.title);
    setDescription(ad.description || "");
    setImageUrl(ad.image_url || "");
    setShopName(ad.shop_name || "");
    setShopPhone(ad.shop_phone || "");
    setIsActive(ad.is_active);
    setDisplayOrder(ad.display_order.toString());
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("advertisements").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("advertisements").getPublicUrl(path);
    setImageUrl(urlData.publicUrl);
    setUploading(false);
    toast.success("Image uploaded");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      shop_name: shopName.trim() || null,
      shop_phone: shopPhone.trim() || null,
      is_active: isActive,
      display_order: parseInt(displayOrder) || 0,
    };
    try {
      if (editingAd) {
        const { error } = await supabase.from("advertisements").update(payload).eq("id", editingAd.id);
        if (error) throw error;
        toast.success("Advertisement updated");
      } else {
        const { error } = await supabase.from("advertisements").insert(payload);
        if (error) throw error;
        toast.success("Advertisement created");
      }
      fetchAds(); setDialogOpen(false); resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this advertisement?")) return;
    const { error } = await supabase.from("advertisements").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchAds(); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-outfit font-bold flex items-center gap-2">
              <Image className="w-8 h-8 text-primary" />
              Shop Advertisements
            </h1>
            <p className="text-muted-foreground mt-1">Manage the advertisement gallery on the home page</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Add Ad</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAd ? "Edit Advertisement" : "Add New Advertisement"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="ad-title">Title *</Label>
                  <Input id="ad-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Grand Opening Sale" />
                </div>
                <div>
                  <Label htmlFor="ad-desc">Description</Label>
                  <Textarea id="ad-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." />
                </div>
                <div>
                  <Label>Image</Label>
                  <div className="flex gap-2">
                    <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL or upload" className="flex-1" />
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload"}
                    </Button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 rounded-lg h-32 w-full object-cover" />}
                </div>
                <div>
                  <Label htmlFor="ad-shop">Shop Name</Label>
                  <Input id="ad-shop" value={shopName} onChange={e => setShopName(e.target.value)} placeholder="e.g., Fresh Bakery" />
                </div>
                <div>
                  <Label htmlFor="ad-phone">Shop Phone Number</Label>
                  <Input id="ad-phone" value={shopPhone} onChange={e => setShopPhone(e.target.value)} placeholder="e.g., 9876543210" />
                </div>
                <div>
                  <Label htmlFor="ad-order">Display Order</Label>
                  <Input id="ad-order" type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="ad-active" checked={isActive} onCheckedChange={setIsActive} />
                  <Label htmlFor="ad-active">Active</Label>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingAd ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle>All Advertisements</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
            ) : ads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No advertisements yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Shop</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ads.map(ad => (
                    <TableRow key={ad.id}>
                      <TableCell>
                        {ad.image_url ? <img src={ad.image_url} alt={ad.title} className="w-16 h-10 object-cover rounded" /> : "-"}
                      </TableCell>
                      <TableCell className="font-medium">{ad.title}</TableCell>
                      <TableCell>{ad.shop_name || "-"}</TableCell>
                      <TableCell>{ad.shop_phone ? <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{ad.shop_phone}</span> : "-"}</TableCell>
                      <TableCell>{ad.display_order}</TableCell>
                      <TableCell>
                        <Switch checked={ad.is_active} onCheckedChange={async () => {
                          await supabase.from("advertisements").update({ is_active: !ad.is_active }).eq("id", ad.id);
                          fetchAds();
                        }} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(ad)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(ad.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
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

export default AdminAdvertisements;
