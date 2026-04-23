import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, UserCog, Store, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface StoreAdmin {
  id: string;
  user_id: string;
  store_id: string;
  created_at: string;
  stores: {
    id: string;
    name: string;
  } | null;
  user_email?: string;
}

interface StoreData {
  id: string;
  name: string;
}

const AdminStoreAdmins = () => {
  const [storeAdmins, setStoreAdmins] = useState<StoreAdmin[]>([]);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    store_id: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch stores
    const { data: storesData } = await supabase
      .from("stores")
      .select("id, name")
      .order("name");
    
    setStores(storesData || []);

    // Fetch store admins with store info
    const { data: adminsData, error } = await supabase
      .from("store_admins")
      .select("id, user_id, store_id, created_at, stores(id, name)")
      .order("created_at", { ascending: false });

    if (!error && adminsData) {
      // We'll display user_id for now since we can't directly query auth.users
      setStoreAdmins(adminsData as StoreAdmin[]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({ email: "", store_id: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // First, find the user by email using a workaround
      // We'll check if a profile exists with that email pattern or use direct insert
      // Since we can't query auth.users, we'll ask admin to input the user_id directly
      
      // For a better UX, we'll try to find the user via profiles table if they have one
      // But the most reliable way is to get the user ID from the user themselves
      
      // Check if store already has an admin
      const { data: existingAdmin } = await supabase
        .from("store_admins")
        .select("id")
        .eq("store_id", formData.store_id)
        .maybeSingle();

      if (existingAdmin) {
        toast.error("This store already has an admin assigned. Remove the existing admin first.");
        setSubmitting(false);
        return;
      }

      // For this implementation, we'll treat the email as user_id if it looks like a UUID
      // Otherwise, we'll show an error asking for the user ID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      let userId = formData.email;
      
      if (!uuidRegex.test(formData.email)) {
        toast.error("Please enter a valid User ID (UUID format). Ask the user to find their ID in their profile or browser console after login.");
        setSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from("store_admins")
        .insert({
          user_id: userId,
          store_id: formData.store_id,
        });

      if (error) {
        console.error("Error adding store admin:", error);
        toast.error("Failed to add store admin. Make sure the User ID is valid.");
        setSubmitting(false);
        return;
      }

      toast.success("Store admin added successfully!");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string, storeName: string) => {
    if (!confirm(`Are you sure you want to remove the admin for "${storeName}"?`)) return;

    const { error } = await supabase
      .from("store_admins")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to remove store admin");
      return;
    }

    toast.success("Store admin removed successfully");
    fetchData();
  };

  // Get stores that don't have admins yet
  const availableStores = stores.filter(
    (store) => !storeAdmins.some((admin) => admin.store_id === store.id)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-outfit font-bold">Store Admins</h1>
            <p className="text-muted-foreground">Assign users to manage individual stores</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={availableStores.length === 0}>
                <Plus className="w-4 h-4" />
                Add Store Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Store Admin</DialogTitle>
                <DialogDescription>
                  Assign a user to manage a specific store. They will be able to view and update orders for their store only.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="user_id">User ID *</Label>
                  <Input 
                    id="user_id" 
                    placeholder="e.g., a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    required 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The user can find their ID by logging in and checking their profile page
                  </p>
                </div>
                <div>
                  <Label htmlFor="store">Store *</Label>
                  <Select value={formData.store_id} onValueChange={(value) => setFormData({ ...formData, store_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a store" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={submitting || !formData.store_id}>
                  {submitting ? "Adding..." : "Add Store Admin"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* How it works explanation */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>How Store Admin Works</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p><strong>1. Create Account:</strong> The store owner/manager must first create an account using the "Create Account" option on the login page.</p>
            <p><strong>2. Get User ID:</strong> After logging in, they can find their User ID on their profile page.</p>
            <p><strong>3. Assign Store:</strong> Enter their User ID here and select which store they should manage.</p>
            <p><strong>4. Access Dashboard:</strong> They can now access <code className="bg-muted px-1 rounded">/store-admin</code> to view and manage orders for their assigned store.</p>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Store Admins</CardTitle>
            <CardDescription>Users who can manage individual store orders</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : storeAdmins.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <UserCog className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No store admins assigned yet.</p>
                <p className="text-sm mt-1">Add your first store admin to let them manage their store's orders.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Assigned On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storeAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-muted-foreground" />
                          {admin.stores?.name || "Unknown Store"}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {admin.user_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {new Date(admin.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemove(admin.id, admin.stores?.name || "this store")}
                        >
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

        {/* Store Admin Features */}
        <Card>
          <CardHeader>
            <CardTitle>Store Admin Features</CardTitle>
            <CardDescription>What store admins can do</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>View orders placed at their assigned store in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Update order status: Pending → Accepted → Out for Delivery → Delivered</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Receive sound alerts when new orders arrive</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>View store statistics and order history</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <span>✗</span>
                <span>Cannot view orders from other stores</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <span>✗</span>
                <span>Cannot access main admin dashboard or modify products/stores</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminStoreAdmins;
