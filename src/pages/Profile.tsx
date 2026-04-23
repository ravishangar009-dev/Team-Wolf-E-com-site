import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User, Save } from "lucide-react";
import Navbar from "@/components/Navbar";
import AvatarUpload from "@/components/AvatarUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import teamWolfLogo from "@/assets/teamwolf-logo.png";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
      }

      if (profile) {
        setFullName(profile.full_name || "");
        setPhone(profile.phone || "");
        setAddress(profile.address || "");
        setAvatarUrl(profile.avatar_url || null);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            full_name: fullName || null,
            phone,
            address,
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      // Emit profile update event for navbar
      window.dispatchEvent(new CustomEvent("profileUpdate"));
      toast.success("Profile saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background">
      <Navbar />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <img
              src={teamWolfLogo}
              alt="Team Wolf"
              className="w-20 h-20 mx-auto mb-4 rounded-full"
            />
            <h1 className="text-3xl font-outfit font-bold mb-2">
              My Profile
            </h1>
            <p className="text-muted-foreground">
              Manage your account information
            </p>
          </div>

          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle className="font-outfit flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Details
              </CardTitle>
              <CardDescription>
                Your information will be used for deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Avatar Upload */}
              <div className="mb-6">
                <AvatarUpload
                  userId={user.id}
                  avatarUrl={avatarUrl}
                  fullName={fullName}
                  onUpload={setAvatarUrl}
                />
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    type="text"
                    value={user?.id || ""}
                    disabled
                    className="mt-1 bg-muted font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Share this ID with the main admin if you need store admin access
                  </p>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="mt-1 bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Delivery Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Your full delivery address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Profile
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
