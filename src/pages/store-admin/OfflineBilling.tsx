import { useState, useEffect, useRef } from "react";
import { StoreAdminSidebar } from "@/components/store-admin/StoreAdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ShoppingCart, Trash2, Printer, Plus, Minus, ReceiptText, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock_count: number | null;
  image_url: string | null;
  category: string | null;
}

interface CartItem extends Product {
  quantity: number;
}

export default function OfflineBilling() {
  const [store, setStore] = useState<{ id: string; name: string; upi_id: string | null } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [lastBill, setLastBill] = useState<{ id: string; customer_name: string; total_amount: number; items: any[] } | null>(null);
  const billRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStoreAndProducts();
  }, []);

  const fetchStoreAndProducts = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get assigned store
    const { data: adminData } = await supabase
      .from("store_admins")
      .select("store_id, stores(name, upi_id)")
      .eq("user_id", session.user.id)
      .single();

    if (!adminData) {
      toast.error("No store access found");
      setLoading(false);
      return;
    }

    const currentStore = {
      id: adminData.store_id,
      name: adminData.stores?.name || "Store",
      upi_id: adminData.stores?.upi_id || null,
    };
    setStore(currentStore);

    // Get products for this store
    const { data: productsData } = await supabase
      .from("products")
      .select("id, name, price, stock_count, image_url, category")
      .eq("store_id", currentStore.id)
      .order("name");

    setProducts(productsData || []);
    setLoading(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const generateBill = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (!store) return;

    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 1. Insert offline bill
      const { data: bill, error: billError } = await supabase
        .from("offline_bills")
        .insert({
          store_id: store.id,
          created_by: session?.user.id,
          customer_name: customerName,
          customer_phone: customerPhone,
          total_amount: totalAmount,
          payment_method: "upi"
        })
        .select()
        .single();

      if (billError) throw billError;

      // 2. Insert bill items and decrement stock
      const itemsToInsert = cart.map(item => ({
        bill_id: bill.id,
        product_id: item.id,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase.from("offline_bill_items").insert(itemsToInsert);
      if (itemsError) throw itemsError;

      // 3. Decrement stock
      for (const item of cart) {
        if (item.stock_count !== null) {
          const newStock = Math.max(0, item.stock_count - item.quantity);
          await supabase.from("products").update({ stock_count: newStock }).eq("id", item.id);
        }
      }

      setLastBill({
        id: bill.id,
        customer_name: customerName || "In-Store Customer",
        total_amount: totalAmount,
        items: itemsToInsert
      });
      setShowBill(true);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      toast.success("Bill generated successfully!");
      fetchStoreAndProducts(); // Refresh stock counts
    } catch (error) {
      console.error("Error generating bill:", error);
      toast.error("Failed to generate bill");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    const printContent = billRef.current;
    if (!printContent) return;
    
    const win = window.open('', '', 'height=700,width=900');
    if (!win) return;
    
    win.document.write('<html><head><title>Print Bill</title>');
    win.document.write('<style>');
    win.document.write('body { font-family: sans-serif; padding: 20px; }');
    win.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; }');
    win.document.write('th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }');
    win.document.write('.header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; }');
    win.document.write('.footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px; text-align: center; font-size: 14px; }');
    win.document.write('.total { text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; }');
    win.document.write('.qr-section { display: flex; flex-direction: column; align-items: center; margin-top: 30px; }');
    win.document.write('</style></head><body>');
    win.document.write(printContent.innerHTML);
    win.document.write('</body></html>');
    
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
  };

  // UPI Deep link: upi://pay?pa=<upi_id>&pn=<store_name>&am=<total>&cu=INR
  const upiLink = store?.upi_id 
    ? `upi://pay?pa=${store.upi_id}&pn=${encodeURIComponent(store.name)}&am=${totalAmount}&cu=INR`
    : "";

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading Billing System...</div>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <StoreAdminSidebar storeName={store?.name || "Temp Admin"} />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-outfit font-bold flex items-center gap-2">
              <ReceiptText className="w-8 h-8 text-primary" />
              Offline Billing
            </h1>
            <p className="text-muted-foreground text-sm">Create bills for hospital/offline customers</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Selection */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProducts.map(product => (
                    <div 
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="group cursor-pointer border border-border rounded-lg p-3 hover:border-primary hover:shadow-md transition-all bg-card"
                    >
                      {product.image_url && (
                        <div className="aspect-square rounded-md overflow-hidden mb-2 bg-secondary">
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                      )}
                      <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-primary font-bold">₹{product.price}</p>
                        <p className={`text-xs ${product.stock_count && product.stock_count < 10 ? "text-orange-500" : "text-muted-foreground"}`}>
                          {product.stock_count !== null ? `${product.stock_count} in stock` : "Infinite"}
                        </p>
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                      No products found.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart & Checkout */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Cart ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 bg-secondary/30 p-2 rounded-lg border border-border/50">
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                        <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive"
                          onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
                      Cart is empty.
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="space-y-2">
                    <Label htmlFor="customer_name">Customer Name</Label>
                    <Input 
                      id="customer_name" 
                      placeholder="Optional" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer_phone">Customer Phone</Label>
                    <Input 
                      id="customer_phone" 
                      placeholder="Optional" 
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Amount</span>
                    <span className="text-primary text-2xl">₹{totalAmount.toLocaleString()}</span>
                  </div>
                  
                  <Button 
                    className="w-full gap-2 text-lg h-12" 
                    disabled={cart.length === 0 || generating}
                    onClick={generateBill}
                  >
                    {generating ? "Generating..." : (
                      <>
                        <QrCode className="w-5 h-5" />
                        Generate & Print Bill
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Bill Preview & QR Dialog */}
      <Dialog open={showBill} onOpenChange={setShowBill}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Bill Generated</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <div ref={billRef} className="bg-white text-black p-6 rounded-lg border shadow-sm">
              <div className="header">
                <h2 className="text-center font-bold text-xl uppercase tracking-wider">{store?.name}</h2>
                <p className="text-center text-xs opacity-80 mt-1">Certified Supplement Store</p>
                <div className="flex justify-between mt-4 text-[10px] font-mono">
                  <span>Bill ID: #{lastBill?.id.slice(0, 8)}</span>
                  <span>Date: {new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs"><strong>Customer:</strong> {lastBill?.customer_name}</p>
              </div>

              <table>
                <thead>
                  <tr className="text-[10px]">
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {lastBill?.items.map((item, i) => (
                    <tr key={i} className="text-[10px]">
                      <td>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.price}</td>
                      <td>₹{item.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="total">
                Grand Total: ₹{lastBill?.total_amount.toLocaleString()}
              </div>

              <div className="qr-section">
                {upiLink ? (
                  <>
                    <QRCodeSVG value={upiLink} size={150} level="H" />
                    <p className="text-[10px] mt-2 font-bold uppercase tracking-widest">Scan to Pay via UPI</p>
                  </>
                ) : (
                  <div className="h-20 w-20 bg-gray-100 flex items-center justify-center border-2 border-dashed rounded text-[10px] text-center text-gray-400 p-2">
                    UPI ID Not Set by Admin
                  </div>
                )}
              </div>

              <div className="footer">
                <p>Thank you for your visit!</p>
                <p className="text-[8px] opacity-60 mt-1 italic">Wolf Pack Dynamics - Stock Management System</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" />
                Print Confirmation
              </Button>
              <Button variant="outline" onClick={() => setShowBill(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
