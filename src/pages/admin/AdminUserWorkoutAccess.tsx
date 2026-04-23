import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, UserCheck, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface UserWorkoutAccess {
  id: string;
  user_id: string;
  package_id: string;
  created_at: string;
  workout_packages: {
    name: string;
  } | null;
}

interface WorkoutPackage {
  id: string;
  name: string;
}

const AdminUserWorkoutAccess = () => {
  const [accessList, setAccessList] = useState<UserWorkoutAccess[]>([]);
  const [packages, setPackages] = useState<WorkoutPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "",
    package_id: "",
  });

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch current access list
    const { data: accessData, error: accessError } = await supabase
      .from("user_workout_access")
      .select(`
        *,
        workout_packages (name)
      `)
      .order("created_at", { ascending: false });
    
    if (!accessError) setAccessList(accessData as any[] || []);

    // Fetch available packages
    const { data: pkgData } = await supabase
      .from("workout_packages")
      .select("id, name")
      .order("name");
    
    if (pkgData) setPackages(pkgData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      user_id: "",
      package_id: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.user_id || !formData.package_id) {
      toast.error("Please provide both User ID and Package");
      return;
    }

    const { error } = await supabase.from("user_workout_access").upsert({
      user_id: formData.user_id,
      package_id: formData.package_id,
    }, { onConflict: "user_id" });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Workout access granted successfully");
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleRemoveAccess = async (id: string) => {
    if (!confirm("Remove workout access for this user?")) return;

    const { error } = await supabase.from("user_workout_access").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove access");
      return;
    }
    toast.success("Access removed successfully");
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-outfit font-bold flex items-center gap-2">
              <UserCheck className="w-8 h-8 text-primary" />
              User Workout Access
            </h1>
            <p className="text-muted-foreground">Assign workout packages to specific users</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Grant Access
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Grant Wolf Workout Access</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="user_id">User ID (UUID) *</Label>
                  <Input 
                    id="user_id" 
                    value={formData.user_id} 
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })} 
                    placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="package">Select Package *</Label>
                  <Select value={formData.package_id} onValueChange={(value) => setFormData({ ...formData, package_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a package" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>{pkg.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Grant Access</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Subscriptions</CardTitle>
            <CardDescription>Users currently having access to workout sections</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading access list...</div>
            ) : accessList.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active subscriptions found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Granted On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessList.map((access) => (
                    <TableRow key={access.id}>
                      <TableCell className="font-mono text-xs">{access.user_id}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                          {access.workout_packages?.name || "Unknown Package"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(access.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveAccess(access.id)}>
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

export default AdminUserWorkoutAccess;
