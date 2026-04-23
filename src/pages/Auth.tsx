import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Navbar from "@/components/Navbar";
import ProfileCompletion from "@/components/ProfileCompletion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { Phone, Mail } from "lucide-react";
import teamWolfLogo from "@/assets/teamwolf-logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    const handleSignedIn = async (signedInUser: User) => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, phone, address")
        .eq("user_id", signedInUser.id)
        .maybeSingle();

      // Ensure a profile row exists
      if (!profile && (error?.code === "PGRST116" || !error)) {
        const userPhone = signedInUser.phone || null;
        await supabase
          .from("profiles")
          .upsert(
            {
              user_id: signedInUser.id,
              full_name: signedInUser.user_metadata?.full_name ?? null,
              phone: userPhone,
            },
            { onConflict: "user_id" }
          );
      }

      // If logged in via phone and profile exists but phone not set, update it
      if (profile && !profile.phone && signedInUser.phone) {
        await supabase
          .from("profiles")
          .update({ phone: signedInUser.phone })
          .eq("user_id", signedInUser.id);
      }

      const updatedPhone = profile?.phone || signedInUser.phone;
      const isIncomplete = !profile || !updatedPhone || !profile.address;
      if (isIncomplete) {
        setCurrentUser(signedInUser);
        setShowProfileCompletion(true);
      } else {
        navigate("/");
      }
    };

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await handleSignedIn(session.user);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await handleSignedIn(session.user);
      }

      if (event === "SIGNED_OUT") {
        setShowProfileCompletion(false);
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const formatPhoneNumber = (input: string) => {
    // Ensure phone has country code
    let formatted = input.trim();
    if (!formatted.startsWith("+")) {
      formatted = "+91" + formatted; // Default to India country code
    }
    return formatted;
  };

  const sendOtp = async () => {
    if (sendingRef.current || cooldown > 0) return;
    sendingRef.current = true;
    setLoading(true);

    try {
      const response = await supabase.functions.invoke("send-otp", {
        body: { phone: phone },
      });

      if (response.error) throw new Error(response.error.message);
      const data = response.data;
      if (!data?.success) throw new Error(data?.error || "Failed to send OTP");

      setOtpSent(true);
      setCooldown(60);
      toast.success("OTP sent to your phone number!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    sendOtp();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await supabase.functions.invoke("verify-otp", {
        body: { phone: phone, otp: otp },
      });

      if (response.error) throw new Error(response.error.message);
      const data = response.data;
      if (!data?.success) throw new Error(data?.error || "Invalid OTP");

      // Sign in using the credentials returned by the edge function
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) throw signInError;

      toast.success("Welcome!");
    } catch (error: any) {
      toast.error(error.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) throw error;

      toast.success("Account created successfully! Please log in.");
      setEmail("");
      setPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Welcome back!");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  if (showProfileCompletion && currentUser) {
    return (
      <ProfileCompletion
        user={currentUser}
        onComplete={() => {
          setShowProfileCompletion(false);
          navigate("/");
        }}
      />
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
              className="w-24 h-24 mx-auto mb-4 rounded-full invert object-contain"
            />
            <h1 className="text-3xl font-outfit font-bold mb-2">
              Welcome to Team Wolf
            </h1>
            <p className="text-muted-foreground">
              Sign in to fuel your fitness journey
            </p>
          </div>

          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle className="font-outfit">Get Started</CardTitle>
              <CardDescription>
                Login with your phone number for quick access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="phone" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="phone" className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Phone
                  </TabsTrigger>
                  <TabsTrigger value="signin" className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="phone">
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <Label htmlFor="phone-number">Phone Number</Label>
                        <div className="flex gap-2">
                          <div className="flex items-center px-3 border rounded-md bg-muted text-sm text-muted-foreground">
                            +91
                          </div>
                          <Input
                            id="phone-number"
                            type="tel"
                            placeholder="9876543210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                            required
                            maxLength={10}
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          We'll send you a one-time verification code
                        </p>
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading || phone.length < 10 || cooldown > 0}
                      >
                        {loading ? "Sending OTP..." : cooldown > 0 ? `Send OTP (${cooldown}s)` : "Send OTP"}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div>
                        <Label>Enter OTP sent to +91{phone}</Label>
                        <div className="flex justify-center mt-3">
                          <InputOTP
                            maxLength={6}
                            value={otp}
                            onChange={(value) => setOtp(value)}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading || otp.length < 6}
                      >
                        {loading ? "Verifying..." : "Verify & Login"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                          setOtpSent(false);
                          setOtp("");
                        }}
                      >
                        Change phone number
                      </Button>
                      <Button
                        type="button"
                        variant="link"
                        className="w-full"
                        disabled={loading || cooldown > 0}
                        onClick={() => sendOtp()}
                      >
                        {cooldown > 0 ? `Resend OTP (${cooldown}s)` : "Resend OTP"}
                      </Button>
                    </form>
                  )}
                </TabsContent>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
