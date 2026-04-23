import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Minus, Trash2, ArrowLeft, ShoppingBag, MapPin, Loader2, QrCode, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isStoreOpenNow } from "@/utils/storeHours";
import { useVIPStatus } from "@/hooks/useVIPStatus";
import { Crown } from "lucide-react";

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const { isVIP } = useVIPStatus();

  useEffect(() => {
    let savedCart: any[] = [];
    try {
      savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
      if (Array.isArray(savedCart)) {
        setCart(savedCart);
      } else {
        localStorage.removeItem("cart");
        savedCart = [];
        setCart([]);
      }
    } catch {
      localStorage.removeItem("cart");
      savedCart = [];
      setCart([]);
    }

    const fetchUserAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      // Auto-fill from saved profile
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("phone, address")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching profile:", error);
        }

        if (profile) {
          if (profile.phone && !phone) setPhone(profile.phone);
          if (profile.address && !address) setAddress(profile.address);
        }
      }
    };

    fetchUserAndProfile();
  }, []);

  const updateQuantity = (productId: string, selectedFlavor: string | undefined, change: number) => {
    const newCart = cart.map((item) => {
      if (item.id === productId && item.selectedFlavor === selectedFlavor) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean);

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdate"));
  };

  const removeItem = (productId: string, selectedFlavor: string | undefined) => {
    const newCart = cart.filter((item) => !(item.id === productId && item.selectedFlavor === selectedFlavor));
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdate"));
    toast.success("Item removed from cart");
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getSavings = () => {
    return cart.reduce((total, item) => {
      const originalPrice = item.originalPrice || item.price;
      return total + (originalPrice - item.price) * item.quantity;
    }, 0);
  };

  const handleProceedToPayment = () => {
    // Prevent orders when a store is closed
    const ensureStoresOpen = async () => {
      const storeIds = Array.from(new Set(cart.map((i) => i.storeId).filter(Boolean)));
      if (storeIds.length === 0) return { ok: true as const };

      const { data, error } = await supabase
        .from("stores")
        .select("id,name,opening_time,closing_time,is_open")
        .in("id", storeIds);

      if (error || !data) return { ok: true as const }; // fail-open (don’t block due to fetch issues)

      const storesData = data as any[];
      const closed = storesData.filter((s) => !isStoreOpenNow(s));
      if (closed.length === 0) return { ok: true as const };

      return {
        ok: false as const,
        names: closed.map((s) => s.name).slice(0, 3),
      };
    };

    // Wrap the existing sync handler flow
    const run = async () => {
      const res = await ensureStoresOpen();
      if (!res.ok) {
        toast.error(`Store closed: ${res.names.join(", ")}. Please try again later.`);
        return;
      }

      if (!user) {
        toast.error("Please login to place an order");
        navigate("/auth");
        return;
      }

      if (!address || !phone) {
        toast.error("Please fill in all delivery details");
        return;
      }

      if (cart.length === 0) {
        toast.error("Your cart is empty");
        return;
      }

      // Open UPI payment link with amount
      const totalAmount = getTotalAmount();
      const upiId = "9787141556-1@okbizaxis";
      const payeeName = "TeamWolf";
      const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${totalAmount}&cu=INR`;

      // Try to open UPI app, then show modal
      window.open(upiLink, "_blank");
      setShowPaymentModal(true);
    };

    void run();
  };

  const handleConfirmPayment = async () => {
    setPaymentConfirmed(true);
    setShowPaymentModal(false);
    await handlePlaceOrder();
  };

  const handlePlaceOrder = async () => {
    setLoading(true);

    try {
      // Group items by store
      const storeGroups: Record<string, any[]> = cart.reduce((acc, item) => {
        if (!acc[item.storeId]) {
          acc[item.storeId] = [];
        }
        acc[item.storeId].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      // Create an order for each store
      for (const [storeId, items] of Object.entries(storeGroups)) {
        const storeTotal = (items as any[]).reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        const totalWithDelivery = storeTotal;

        const orderPayload: any = {
            user_id: user.id,
            store_id: storeId,
            total_amount: totalWithDelivery,
            delivery_address: address,
            phone: phone,
            status: "pending",
        };

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert(orderPayload)
          .select()
          .single();

        if (orderError) throw orderError;

        try {
          const { data: availableAgents } = await supabase
            .from("delivery_agents")
            .select("id")
            .eq("is_active", true)
            .eq("is_available", true);

          if (availableAgents && availableAgents.length > 0) {
            const randomAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
            await supabase
              .from("orders")
              .update({ delivery_agent_id: randomAgent.id, assigned_at: new Date().toISOString() })
              .eq("id", order.id);
          }
        } catch (assignErr) {
          console.error("Agent assignment failed:", assignErr);
        }

        // Create order items
        const orderItems: any[] = (items as any[]).map((item) => ({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          selected_flavor: item.selectedFlavor || null,
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Auto-decrement inventory stock count
        for (const item of (items as any[])) {
          try {
            // Get current stock
            const { data: prodData } = await supabase
              .from("products")
              .select("stock_count")
              .eq("id", item.id)
              .single();

            if (prodData && prodData.stock_count !== null) {
              const newCount = Math.max(0, prodData.stock_count - item.quantity);
              await supabase
                .from("products")
                .update({ 
                  stock_count: newCount,
                  in_stock: newCount > 0
                })
                .eq("id", item.id);
            }
          } catch (e) {
            console.error("Failed to decrement inventory:", e);
          }
        }

        // Send email notification
        try {
          await supabase.functions.invoke("send-order-email", {
            body: {
              customerEmail: user.email,
              customerPhone: phone,
              deliveryAddress: address,
              storeName: storeData?.name || "Store",
              totalAmount: totalWithDelivery,
              deliveryFee: 0,
              distance: "N/A",
              latitude: null,
              longitude: null,
              orderItems: (items as any[]).map((item) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price * item.quantity,
              })),
              orderId: order.id,
            },
          });
          console.log("Order email sent successfully");
        } catch (emailError) {
          console.error("Failed to send order email:", emailError);
        }

        // Send push notification to store admin
        try {
          await supabase.functions.invoke("notify-store-admin", {
            body: {
              storeId: storeId,
              orderId: order.id,
              totalAmount: totalWithDelivery,
            },
          });
          console.log("Store admin notification sent");
        } catch (notifyError) {
          console.error("Failed to notify store admin:", notifyError);
        }
      }

      // Clear cart
      setCart([]);
      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("cartUpdate"));

      toast.success("Order placed successfully!");
      navigate("/orders");
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast.error(`Order Error: ${error?.message || JSON.stringify(error)}`, { duration: 10000 });
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-6 animate-fade-in">
            <ShoppingBag className="w-24 h-24 mx-auto text-muted-foreground" />
            <h2 className="text-3xl font-outfit font-bold">Your cart is empty</h2>
            <p className="text-muted-foreground">
              Add some items from local stores to get started
            </p>
            <Link to="/stores">
              <Button size="lg">Browse Stores</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Link to="/stores">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <h1 className="text-3xl font-outfit font-bold mb-6">Your Cart</h1>

            {cart.map((item) => (
              <Card key={item.id} className="animate-fade-in">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={item.flavors?.find((f: any) => f.name === item.selectedFlavor)?.image_url || item.image_url || '/placeholder.svg'}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />

                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-outfit font-semibold text-lg">
                            {item.name} {item.selectedFlavor && <span className="text-sm font-normal text-muted-foreground">({item.selectedFlavor})</span>}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.storeName}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id, item.selectedFlavor)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`text-lg font-bold ${isVIP ? 'text-yellow-500' : 'text-primary'}`}>
                          ₹{item.price * item.quantity}
                        </span>

                        <div className="flex items-center gap-2 bg-secondary rounded-lg px-2 py-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.selectedFlavor, -1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-semibold min-w-[30px] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.selectedFlavor, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-xl font-outfit font-bold">Order Summary</h2>

                <div className="space-y-3">
                  {getSavings() > 0 && (
                    <div className="flex justify-between text-sm text-yellow-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Crown className="w-4 h-4" /> VIP Savings
                      </span>
                      <span>-₹{getSavings()}</span>
                    </div>
                  )}
                  <div className="border-b pb-3 flex justify-between">
                    <span className="font-semibold text-xl">Total Amount</span>
                    <span className={`font-outfit font-black text-2xl ${isVIP ? 'text-yellow-500' : 'text-primary'}`}>
                      ₹{getTotalAmount()}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-6">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    {phone ? (
                      <div className="mt-1 flex items-center justify-between p-3 bg-muted rounded-md">
                        <span className="font-medium">{phone}</span>
                        <Link to="/profile" className="text-xs text-primary hover:underline">
                          Edit in Profile
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-1 p-3 bg-muted/50 rounded-md text-center">
                        <p className="text-sm text-muted-foreground mb-2">No phone number saved</p>
                        <Link to="/profile">
                          <Button variant="outline" size="sm">Add in Profile</Button>
                        </Link>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address">Delivery Address</Label>
                    {address ? (
                      <div className="mt-1 space-y-2">
                        <Textarea
                          id="address"
                          value={address}
                          disabled
                          className="bg-muted"
                          rows={3}
                        />
                        <Link to="/profile" className="text-xs text-primary hover:underline inline-block">
                          Edit in Profile
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-1 p-3 bg-muted/50 rounded-md text-center">
                        <p className="text-sm text-muted-foreground mb-2">No address saved</p>
                        <Link to="/profile">
                          <Button variant="outline" size="sm">Add in Profile</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleProceedToPayment}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      Proceed to Payment
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment QR Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-outfit">
              Scan & Pay ₹{getTotalAmount()}
            </DialogTitle>
            <DialogDescription className="text-center">
              Scan the QR code below using any UPI app to complete payment
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center space-y-1 mt-6">
              <p className="text-sm text-muted-foreground">UPI ID</p>
              <p className="font-mono font-semibold">9787141556-1@okbizaxis</p>
            </div>

            <div className="w-full space-y-3 pt-4">
              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={handleConfirmPayment}
              >
                <Check className="w-4 h-4" />
                I have completed the payment
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cart;