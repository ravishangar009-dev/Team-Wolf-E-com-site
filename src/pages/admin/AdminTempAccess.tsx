import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, UserCheck, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TempAdmin {
  id: string;
  user_id: string;
  store_id: string;
  created_at: string;
  stores: {
    id: string;
    name: string;
  } | null;
}

const AdminTempAccess = () => {
  const [tempAdmins, setTempAdmins] = useState<TempAdmin[]>([]);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    const { data: storesData } = await supabase.from("stores").select("id, name").order("name");
    setStores(storesData || []);

    const { data: adminsData, error } = await supabase
      .from("store_admins")
      .select("id, user_id, store_id, created_at, stores(id, name)")
      .order("created_at", { ascending: false });

    if (!error && adminsData) {
      setTempAdmins(adminsData as TempAdmin[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      toast.error("Please enter a valid User ID (UUID format). The user can find it on their profile page.");
      setSubmitting(false);
      return;
    }

    // Use the first store (single shop model)
    const storeId = stores[0]?.id;
    if (!storeId) {
      toast.error("No store found. Please create a store first in the database.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("store_admins").insert({
      user_id: userId,
      store_id: storeId,
    });

    if (error) {
      console.error("Error adding temp admin:", error);
      toast.error("Failed to add temp admin. The User ID might already have access or is invalid.");
      setSubmitting(false);
      return;
    }

    toast.success("Temp admin access granted!");
    setDialogOpen(false);
    setUserId("");
    fetchData();
    setSubmitting(false);
  };

  const handleRemove = async (id: string, userIdShort: string) => {
    if (!confirm(`Remove temp admin access for user ${userIdShort}...?`)) return;

    const { error } = await supabase.from("store_admins").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove temp admin");
      return;
    }
    toast.success("Temp admin access revoked");
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-outfit font-bold">Shop Maintainer Access</h1>
            <p className="text-muted-foreground">Grant offline billing and stock management access to users</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setUserId(""); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Grant Access
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
              <DialogTitle>Grant Shop Maintainer Access</DialogTitle>
              <DialogDescription>
                This user will be able to manage products, track stock, and generate offline bills for in-store customers.
              </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="user_id">User ID *</Label>
                  <Input
                    id="user_id"
                    placeholder="e.g., a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The user can find their ID on their profile page after logging in.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Granting..." : "Grant Temp Access"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>How Temp Admin Access Works</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p><strong>1. User Creates Account:</strong> They sign up using the login page.</p>
            <p><strong>2. Get User ID:</strong> After logging in, they find their User ID on the profile page.</p>
            <p><strong>3. Grant Access:</strong> Enter their User ID here to give them product management access.</p>
            <p><strong>4. Tracked Changes:</strong> Every product they add, edit, or delete is logged in the Activity Log — like a blockchain record.</p>
            <p><strong>5. Revoke Anytime:</strong> Remove their access instantly when needed.</p>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Active Shop Maintainers</CardTitle>
            <CardDescription>Users with offline billing and stock management access</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : tempAdmins.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No temp admins assigned yet.</p>
                <p className="text-sm mt-1">Grant access to let trusted users manage products.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Granted On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tempAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-mono text-sm">
                        {admin.user_id.slice(0, 8)}...{admin.user_id.slice(-4)}
                      </TableCell>
                      <TableCell>
                        {new Date(admin.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(admin.id, admin.user_id.slice(0, 8))}
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

        <Card>
          <CardHeader>
            <CardTitle>Shop Maintainer Permissions</CardTitle>
            <CardDescription>What shop maintainers can do</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Generate offline bills with UPI QR codes for customers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Manage product stock and inventory</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Add new products or edit existing ones</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Update order status for online orders</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <span>✗</span>
                <span>Cannot access main admin dashboard or revenue analytics</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <span>✗</span>
                <span>All actions are logged for security and audits</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminTempAccess;
