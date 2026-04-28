import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, ShoppingCart, Plus, Minus, BookOpen } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import ProductRequestForm from "@/components/ProductRequestForm";
import { useVIPStatus } from "@/hooks/useVIPStatus";
import { Crown, Sparkles } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  in_stock: boolean;
  offer_percentage: number | null;
  offer_price: number | null;
  offer_active: boolean | null;
  vip_discount_percentage: number | null;
  brand: string | null;
  store_id: string;
  flavors?: { name: string; image_url: string; stock?: number; price?: number }[] | null;
  usage_guide?: string | null;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<any[]>([]);
  const [selectedFlavors, setSelectedFlavors] = useState<Record<string, string>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { calculateVIPPrice, isVIP } = useVIPStatus();

  useEffect(() => {
    fetchProducts();
    loadCart();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("in_stock", true);
      
    if (!error && data) {
      const normalizedData = data.map((p) => ({
        ...p,
        flavors: (p.flavors || []).map((f: any) =>
          typeof f === "string" 
            ? { name: f, image_url: "", stock: p.stock_count || 0, price: p.price } 
            : { ...f, stock: f.stock ?? (p.stock_count || 0), price: f.price ?? p.price }
        ),
      }));
      setProducts(normalizedData as Product[]);
    }
    setLoading(false);
  };

  const loadCart = () => {
    try {
      const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
      // Prevent crash if user has old object-based cart format
      if (Array.isArray(savedCart)) {
        setCart(savedCart);
      } else {
        localStorage.removeItem("cart");
        setCart([]);
      }
    } catch {
      localStorage.removeItem("cart");
      setCart([]);
    }
  };

  const getSelectedFlavor = (p: Product) => selectedFlavors[p.id] || p.flavors?.[0]?.name;

  const getActiveImage = (product: Product) => {
    if (!product.flavors || product.flavors.length === 0) return product.image_url;
    const activeFlavorName = getSelectedFlavor(product);
    const activeFlavor = product.flavors.find(f => f.name === activeFlavorName);
    return activeFlavor?.image_url || product.image_url;
  };

  const isFlavorOutOfStock = (product: Product, flavorName?: string) => {
    if (!product.in_stock) return true;
    const name = flavorName || getSelectedFlavor(product);
    if (!product.flavors || product.flavors.length === 0) return (product.stock_count ?? 0) <= 0;
    const flavor = product.flavors.find(f => f.name === name);
    return flavor ? (flavor.stock ?? 0) <= 0 : (product.stock_count ?? 0) <= 0;
  };

  const getProductPrice = (product: Product) => {
    const flavor = getSelectedFlavor(product);
    if (product.flavors && product.flavors.length > 0 && flavor) {
      const flavorData = product.flavors.find(f => f.name === flavor);
      if (flavorData?.price) return flavorData.price;
    }
    return product.price;
  };

  const updateCart = (product: Product, change: number) => {
    const newCart = [...cart];
      const flavor = getSelectedFlavor(product);
      
      const existingIndex = newCart.findIndex(x => x.id === product.id && x.selectedFlavor === flavor);
  
      if (existingIndex > -1) {
        newCart[existingIndex].quantity += change;
        if (newCart[existingIndex].quantity <= 0) {
          newCart.splice(existingIndex, 1);
        }
      } else if (change > 0) {
        const price = getProductPrice(product);
        const effectivePrice = isVIP ? calculateVIPPrice({ ...product, price }) : (product.offer_active && product.offer_price ? product.offer_price : price);
        newCart.push({
          ...product,
          price: effectivePrice,
          originalPrice: price,
          quantity: 1,
          selectedFlavor: flavor,
        storeId: product.store_id,
        storeName: "Store",
      });
    }

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdate"));

    if (change > 0) {
      toast.success(`${product.name} ${flavor ? `(${flavor})` : ''} added to cart`);
    }
  };

  const getQuantity = (product: Product) => {
    const flavor = getSelectedFlavor(product);
    const item = cart.find(x => x.id === product.id && x.selectedFlavor === flavor);
    return item ? item.quantity : 0;
  };

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-outfit font-bold mb-2">Our Supplements</h1>
          <p className="text-muted-foreground">
            Premium protein, pre-workout, BCAAs, and more
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search supplements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category} className="capitalize">
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCategory !== "all" && (
            <Badge
              variant="secondary"
              className="cursor-pointer px-3 py-1.5 text-xs hover:bg-destructive/20 transition-colors"
              onClick={() => setSelectedCategory("all")}
            >
              Clear Filter ✕
            </Badge>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden border-border/50 rounded-xl">
                  <Skeleton className="w-full h-40" />
                  <CardContent className="p-3 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            : filteredProducts.map((product, index) => {
                const qty = getQuantity(product);

                return (
                  <Card
                    key={product.id}
                    className="overflow-hidden group hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] shadow-xl transition-all duration-500 hover:-translate-y-2 border-white/5 rounded-2xl animate-scale-in flex flex-col bg-card/40 backdrop-blur-xl ring-1 ring-white/10"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div 
                      className="relative w-full h-64 sm:h-72 overflow-hidden bg-black/40 cursor-pointer"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {getActiveImage(product) ? (
                        <>
                          <img
                            src={getActiveImage(product)!}
                            alt={product.name}
                            className={`absolute inset-0 w-full h-full object-cover mix-blend-normal group-hover:scale-110 group-hover:opacity-90 transition-all duration-700 ease-out ${isFlavorOutOfStock(product) ? 'grayscale opacity-60' : ''}`}
                          />
                          {isFlavorOutOfStock(product) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
                              <span className="text-white font-black text-lg uppercase tracking-widest rotate-12 border-4 border-white px-4 py-1">Out of Stock</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center relative">
                          <ShoppingCart className="w-12 h-12 text-muted-foreground/20" />
                          {isFlavorOutOfStock(product) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <span className="text-white font-black text-lg uppercase tracking-widest rotate-12 border-2 border-white px-2 py-0.5">Out of Stock</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Gradient overlay to make text pop if it was overlayed, adds mood */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>

                      {product.offer_active && product.offer_percentage && (
                        <Badge className="absolute top-3 left-3 bg-red-600 font-bold border-none shadow-lg text-white px-2.5 py-1 text-xs z-10 animate-pulse-soft">
                          {product.offer_percentage}% OFF
                        </Badge>
                      )}
                      {product.brand && (
                        <Badge variant="secondary" className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border-white/10 text-white/90 text-[10px] uppercase font-bold tracking-wider z-10">
                          {product.brand}
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-5 flex flex-col flex-1 relative z-20">
                      <div className="flex-1">
                        <h3 
                          className="font-outfit font-bold text-lg md:text-xl line-clamp-2 cursor-pointer hover:text-primary transition-colors tracking-tight leading-snug mb-2"
                          onClick={() => setSelectedProduct(product)}
                        >
                          {product.name}
                        </h3>
                        {product.usage_guide && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(product);
                            }}
                            title="View Usage Guide"
                          >
                            <BookOpen className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex items-end gap-2 mb-5 mt-2">
                        {isVIP ? (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-yellow-500 mb-0.5 tracking-wider">
                              <Crown className="w-3 h-3" /> VIP ELITE PRICE
                            </div>
                            <div className="flex items-end gap-2">
                              <span className="font-black text-2xl text-yellow-500 tracking-tight flex items-center gap-1">
                                ₹{calculateVIPPrice(product)}
                                <Sparkles className="w-3 h-3 animate-pulse" />
                              </span>
                              <span className="line-through text-muted-foreground/50 text-xs mb-1">₹{product.price}</span>
                            </div>
                          </div>
                        ) : product.offer_active && product.offer_price ? (
                          <>
                            <span className="font-black text-2xl text-primary tracking-tight">₹{product.offer_price}</span>
                            <span className="line-through text-muted-foreground/70 text-sm mb-1 font-medium">₹{product.price}</span>
                          </>
                        ) : (
                          <span className="font-black text-2xl text-primary tracking-tight">₹{product.price}</span>
                        )}
                      </div>

                      <div className="mt-auto pt-2 border-t border-border/40">
                        {isFlavorOutOfStock(product) ? (
                          <Button disabled variant="destructive" className="w-full font-bold uppercase tracking-tighter">
                            Sold Out
                          </Button>
                        ) : (!product.flavors || product.flavors.length === 0) ? (
                          qty === 0 ? (
                            <Button
                              size="sm"
                              className="w-full font-medium"
                              onClick={() => updateCart(product, 1)}
                            >
                              <Plus className="w-4 h-4 mr-1" /> Add to Cart
                            </Button>
                          ) : (
                            <div className="flex items-center justify-between gap-2 bg-secondary/50 p-1 rounded-lg">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-foreground" onClick={() => updateCart(product, -1)}>
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="font-bold text-base">{qty}</span>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-foreground" onClick={() => updateCart(product, 1)}>
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          )
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full font-medium"
                            onClick={() => setSelectedProduct(product)}
                          >
                            View Options
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
        </div>

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground text-lg">No products found.</p>
          </div>
        )}

        {/* Product Request */}
        <div className="mt-12">
          <ProductRequestForm />
        </div>
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-outfit text-xl">{selectedProduct.name}</DialogTitle>
              <DialogDescription>
                {selectedProduct.category && <Badge variant="secondary" className="mt-1 capitalize">{selectedProduct.category}</Badge>}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                {getActiveImage(selectedProduct) ? (
                  <>
                    <img src={getActiveImage(selectedProduct)!} alt={selectedProduct.name} className={`w-full h-full object-cover ${isFlavorOutOfStock(selectedProduct) ? 'grayscale opacity-60' : ''}`} />
                    {isFlavorOutOfStock(selectedProduct) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="text-white font-bold text-xl uppercase tracking-widest rotate-12 border-4 border-white px-4 py-2">Out of Stock</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center relative">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground/30" />
                    {isFlavorOutOfStock(selectedProduct) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <span className="text-white font-bold text-xl uppercase tracking-widest rotate-12 border-4 border-white px-4 py-2">Out of Stock</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isVIP ? (
                  <div className="flex flex-col w-full p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/20">
                    <div className="flex items-center gap-2 text-xs font-bold text-yellow-500 mb-1">
                      <Crown className="w-4 h-4" /> VIP ELITE DISCOUNT APPLIED
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-3xl text-yellow-500">₹{calculateVIPPrice({ ...selectedProduct, price: getProductPrice(selectedProduct) })}</span>
                      <span className="line-through text-muted-foreground text-sm">₹{getProductPrice(selectedProduct)}</span>
                    </div>
                  </div>
                ) : selectedProduct.offer_active && selectedProduct.offer_price ? (
                  <>
                    <span className="line-through text-muted-foreground">₹{selectedProduct.price}</span>
                    <span className="font-bold text-2xl text-primary">₹{selectedProduct.offer_price}</span>
                    <Badge className="bg-primary text-primary-foreground">{selectedProduct.offer_percentage}% OFF</Badge>
                  </>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-2xl text-primary">₹{getProductPrice(selectedProduct)}</span>
                    {getProductPrice(selectedProduct) !== selectedProduct.price && (
                      <span className="text-xs text-muted-foreground">(Base: ₹{selectedProduct.price})</span>
                    )}
                  </div>
                )}
              </div>
              
              {selectedProduct.description && (
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedProduct.description}
                </div>
              )}
              
              {selectedProduct.usage_guide && (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 shadow-inner">
                  <h4 className="font-outfit font-bold text-sm flex items-center gap-2 mb-2 text-primary">
                    <BookOpen className="w-4 h-4" /> Usage Guide
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed italic">
                    {selectedProduct.usage_guide}
                  </p>
                </div>
              )}

              {selectedProduct.flavors && selectedProduct.flavors.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold">Selected Flavor:</span>
                    <span className="text-sm text-primary font-bold">
                      {selectedFlavors[selectedProduct.id] || selectedProduct.flavors[0].name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.flavors.map((f: any) => {
                      const isSelected = (selectedFlavors[selectedProduct.id] || selectedProduct.flavors[0].name) === f.name;
                      return (
                        <button
                          key={f.name}
                          onClick={() => setSelectedFlavors({ ...selectedFlavors, [selectedProduct.id]: f.name })}
                          className={`relative overflow-hidden flex flex-col items-center justify-center rounded-md border-2 transition-all ${
                            isSelected 
                              ? 'border-primary ring-2 ring-primary ring-offset-1 ring-offset-background' 
                              : 'border-border hover:border-primary/50'
                          } ${isFlavorOutOfStock(selectedProduct, f.name) ? 'opacity-40 grayscale cursor-not-allowed' : 'opacity-100'} bg-card ${f.image_url ? 'w-20 h-24' : 'px-4 py-2 min-w-[80px]'}`}
                          title={`${f.name} ${isFlavorOutOfStock(selectedProduct, f.name) ? '(Out of Stock)' : ''}`}
                        >
                          {f.image_url ? (
                            <img src={f.image_url} alt={f.name} className="w-full h-16 object-cover" />
                          ) : (
                            <span className="text-xs font-semibold">{f.name}</span>
                          )}
                          {f.price && f.price !== selectedProduct.price && (
                            <span className="text-[10px] font-bold text-primary mt-1">₹{f.price}</span>
                          )}
                          {isFlavorOutOfStock(selectedProduct, f.name) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="w-full h-[2px] bg-red-500 rotate-45 absolute" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                {isFlavorOutOfStock(selectedProduct) ? (
                  <Button className="w-full font-bold py-6 cursor-not-allowed" disabled variant="destructive">
                    Currently Unavailable
                  </Button>
                ) : getQuantity(selectedProduct) === 0 ? (
                  <Button className="w-full" onClick={() => updateCart(selectedProduct, 1)}>
                    <Plus className="w-4 h-4 mr-2" /> Add to Cart
                  </Button>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <Button size="icon" variant="outline" onClick={() => updateCart(selectedProduct, -1)}>
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="font-bold text-lg">{getQuantity(selectedProduct)}</span>
                    <Button size="icon" variant="outline" onClick={() => updateCart(selectedProduct, 1)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Floating cart button */}
      {cartCount > 0 && (
        <Link to="/cart">
          <Button
            size="lg"
            className="fixed bottom-6 right-6 z-50 rounded-full shadow-xl px-6 py-6 gap-2 animate-scale-in"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="font-bold">{cartCount} items</span>
          </Button>
        </Link>
      )}
    </div>
  );
};

export default Products;
