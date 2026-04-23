import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Truck, Copy, Pencil, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DeliveryAgent {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  is_active: boolean;
  is_available: boolean;
  current_lat: number | null;
  current_lng: number | null;
  location_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

const AdminDeliveryAgents = () => {
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<DeliveryAgent | null>(null);
  const [formData, setFormData] = useState({
    user_id: "",
    full_name: "",
    phone: "",
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAgents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("delivery_agents")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAgents(data as DeliveryAgent[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const resetForm = () => {
    setFormData({ user_id: "", full_name: "", phone: "", is_active: true });
    setEditingAgent(null);
  };

  const handleEdit = (agent: DeliveryAgent) => {
    setEditingAgent(agent);
    setFormData({
      user_id: agent.user_id,
      full_name: agent.full_name,
      phone: agent.phone,
      is_active: agent.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingAgent) {
        const { error } = await supabase
          .from("delivery_agents")
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingAgent.id);

        if (error) {
          toast.error("Failed to update delivery agent");
          setSubmitting(false);
          return;
        }
        toast.success("Delivery agent updated successfully!");
      } else {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(formData.user_id)) {
          toast.error("Please enter a valid User ID (UUID format).");
          setSubmitting(false);
          return;
        }

        const { error } = await supabase
          .from("delivery_agents")
          .insert({
            user_id: formData.user_id,
            full_name: formData.full_name,
            phone: formData.phone,
            is_active: formData.is_active,
          });

        if (error) {
          console.error("Error adding delivery agent:", error);
          if (error.code === "23505") {
            toast.error("This user is already a delivery agent.");
          } else {
            toast.error("Failed to add delivery agent.");
          }
          setSubmitting(false);
          return;
        }
        toast.success("Delivery agent added successfully!");
      }

      setDialogOpen(false);
      resetForm();
      fetchAgents();
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove delivery agent "${name}"?`)) return;

    const { error } = await supabase
      .from("delivery_agents")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to remove delivery agent");
      return;
    }

    toast.success("Delivery agent removed successfully");
    fetchAgents();
  };

  const copyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId);
    toast.success("User ID copied!");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-outfit font-bold">Delivery Agents</h1>
            <p className="text-muted-foreground">Manage delivery agents for order fulfillment</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Delivery Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingAgent ? "Edit Delivery Agent" : "Add Delivery Agent"}</DialogTitle>
                <DialogDescription>
                  {editingAgent
                    ? "Update delivery agent details."
                    : "Add a new delivery agent. They must first create an account and share their User ID."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingAgent && (
                  <div>
                    <Label htmlFor="user_id">User ID *</Label>
                    <Input
                      id="user_id"
                      placeholder="e.g., a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                      value={formData.user_id}
                      onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The agent can find their ID on their profile page
                    </p>
                  </div>
                )}
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    placeholder="Agent's full name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="e.g., 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Active</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Saving..." : editingAgent ? "Update Agent" : "Add Agent"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>How Delivery Agents Work</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p><strong>1. Create Account:</strong> The delivery agent must first create an account on the app.</p>
            <p><strong>2. Get User ID:</strong> After logging in, they can find their User ID on their profile page.</p>
            <p><strong>3. Add Here:</strong> Enter their User ID, name, and phone number to register them as an agent.</p>
            <p><strong>4. Auto-Assignment:</strong> When new orders are placed, the nearest available agent is automatically assigned.</p>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>All Delivery Agents</CardTitle>
            <CardDescription>Agents registered to deliver orders</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : agents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No delivery agents yet.</p>
                <p className="text-sm mt-1">Add your first delivery agent to enable auto-assignment.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Last Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">{agent.full_name}</TableCell>
                      <TableCell>{agent.phone}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-sm">{agent.user_id.slice(0, 8)}...</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyUserId(agent.user_id)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={agent.is_active ? "default" : "destructive"}>
                          {agent.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={agent.is_available ? "default" : "secondary"}>
                          {agent.is_available ? "Available" : "Busy"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {agent.location_updated_at
                          ? new Date(agent.location_updated_at).toLocaleString()
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(agent)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleRemove(agent.id, agent.full_name)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
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

export default AdminDeliveryAgents;
