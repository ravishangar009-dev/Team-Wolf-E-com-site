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
import { Phone, Chrome } from "lucide-react";
import teamWolfLogo from "@/assets/teamwolf-logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
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
                Login with your phone number or Google account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="phone" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="phone" className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Phone
                  </TabsTrigger>
                  <TabsTrigger value="google" className="flex items-center gap-1">
                    <Chrome className="h-3 w-3" />
                    Google
                  </TabsTrigger>
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

                <TabsContent value="google">
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-center text-muted-foreground">
                      Sign in instantly with your Google account. No password needed.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 text-base font-medium flex items-center justify-center gap-3 border-2 hover:bg-accent transition-colors"
                      disabled={loading}
                      onClick={handleGoogleSignIn}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      {loading ? "Redirecting..." : "Continue with Google"}
                    </Button>
                  </div>
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
