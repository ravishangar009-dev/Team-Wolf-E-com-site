import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Clock, MapPin, Phone, Star, Search, Plus, Minus, ShoppingCart } from "lucide-react";
import Navbar from "@/components/Navbar";
import ProductRequestForm from "@/components/ProductRequestForm";
import StoreReviews from "@/components/StoreReviews";
import ProductReviews from "@/components/ProductReviews";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatStoreTime, isStoreOpenNow } from "@/utils/storeHours";
import { useVIPStatus } from "@/hooks/useVIPStatus";
import { Crown, Sparkles } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  in_stock: boolean;
  offer_percentage: number | null;
  offer_price: number | null;
  offer_active: boolean | null;
  flavors?: { name: string; image_url: string }[] | null;
  store_id?: string;
}

interface Store {
  id: string;
  name: string;
  category?: string | null;
  image_url?: string | null;
  address: string;
  phone: string;
  rating?: number | null;
  delivery_time?: string | null;
  is_open?: boolean | null;
  opening_time?: string | null;
  closing_time?: string | null;
}

const StoreDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<Record<string, string>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { calculateVIPPrice, isVIP } = useVIPStatus();

  useEffect(() => {
    // Pre-fill search from URL params
    const searchParam = searchParams.get("search");
    if (searchParam) setSearchQuery(searchParam);
    const highlightParam = searchParams.get("highlight");
    if (highlightParam) setHighlightedProductId(highlightParam);
  }, [searchParams]);

  useEffect(() => {
    if (id) {
      fetchStoreAndProducts();
    }
    
    try {
      const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
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
  }, [id]);

  // Scroll to highlighted product once products load
  useEffect(() => {
    if (highlightedProductId && products.length > 0) {
      const el = document.getElementById(`product-${highlightedProductId}`);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
        // Remove highlight after 3 seconds
        setTimeout(() => setHighlightedProductId(null), 4000);
      }
    }
  }, [highlightedProductId, products]);

  const fetchStoreAndProducts = async () => {
    setLoading(true);
    
    const { data: storeData } = await supabase
      .from("stores")
      .select("*")
      .eq("id", id)
      .single();

    if (storeData) {
      setStore(storeData);
    }

    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", id)
      .eq("in_stock", true);
      
    if (productsData) {
      const normalizedData = productsData.map((p) => ({
        ...p,
        flavors: (p.flavors || []).map((f: any) =>
          typeof f === "string" ? { name: f, image_url: "" } : f
        ),
      }));
      setProducts(normalizedData as Product[]);
    }
    setLoading(false);
  };

  const getSelectedFlavor = (p: Product) => selectedFlavors[p.id] || p.flavors?.[0]?.name;

  const getActiveImage = (product: Product) => {
    if (!product.flavors || product.flavors.length === 0) return product.image_url;
    const activeFlavorName = getSelectedFlavor(product);
    const activeFlavor = product.flavors.find(f => f.name === activeFlavorName);
    return activeFlavor?.image_url || product.image_url;
  };

  const getProductQuantity = (product: Product) => {
    const flavor = getSelectedFlavor(product);
    const item = cart.find((item) => item.id === product.id && item.selectedFlavor === flavor);
    return item ? item.quantity : 0;
  };

  const updateCart = (product: Product, change: number) => {
    if (!store || !isStoreOpenNow(store)) {
      toast.error("Store is currently closed. Ordering is paused.");
      return;
    }

    const newCart = [...cart];
    const flavor = getSelectedFlavor(product);
    const existingIndex = newCart.findIndex((item) => item.id === product.id && item.selectedFlavor === flavor);

    if (existingIndex > -1) {
      newCart[existingIndex].quantity += change;
      if (newCart[existingIndex].quantity <= 0) {
        newCart.splice(existingIndex, 1);
        toast.success(`${product.name} removed from cart`);
      }
    } else if (change > 0) {
      const effectivePrice = calculateVIPPrice(product);
      newCart.push({
        ...product,
        price: effectivePrice,
        originalPrice: product.price,
        quantity: 1,
        selectedFlavor: flavor,
        storeId: id,
        storeName: store?.name,
      });
      toast.success(`${product.name} ${flavor ? `(${flavor})` : ''} added to cart`);
    }

    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdate"));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-48 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Store not found</p>
          <Link to="/stores">
            <Button className="mt-4">Back to Stores</Button>
          </Link>
        </div>
      </div>
    );
  }

  const storeOpenNow = isStoreOpenNow(store);
  const opening = formatStoreTime(store.opening_time) ?? "—";
  const closing = formatStoreTime(store.closing_time) ?? "—";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Link to="/stores">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Stores
          </Button>
        </Link>

        {/* Store Header */}
        <Card className="mb-8 overflow-hidden animate-fade-in">
          <div className="relative h-48 md:h-64">
            <img
              src={store.image_url || ""}
              alt={store.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h1 className="text-3xl md:text-4xl font-outfit font-bold mb-2">
                {store.name}
              </h1>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span>{store.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{store.delivery_time}</span>
                </div>
                <Badge className="bg-primary text-primary-foreground capitalize">
                  {store.category}
                </Badge>
                <Badge
                  variant={storeOpenNow ? "secondary" : "destructive"}
                  className={storeOpenNow ? "bg-primary/20 text-primary" : undefined}
                >
                  {storeOpenNow ? "Open now" : "Closed"}
                </Badge>
              </div>
            </div>
          </div>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{store.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-foreground font-medium">Opening Hours: {opening} - {closing}</span>
            </div>
            {!storeOpenNow && (
              <p className="text-sm text-muted-foreground">
                This store is currently closed. You can browse items, but adding to cart is disabled.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Products */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-outfit font-bold">Menu</h2>
            <p className="text-muted-foreground">Available products</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {products
            .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.category?.toLowerCase().includes(searchQuery.toLowerCase())))
            .map((product, index) => {
            const quantity = getProductQuantity(product);
            return (
              <Card
                key={product.id}
                id={`product-${product.id}`}
                className={`overflow-hidden group hover:shadow-md transition-all animate-scale-in ${
                  highlightedProductId === product.id
                    ? "ring-2 ring-primary ring-offset-2 shadow-xl"
                    : ""
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div 
                  className={`flex flex-col md:flex-row gap-4 p-4 ${
                    highlightedProductId === product.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <div 
                    className="w-full md:w-32 h-32 flex-shrink-0 cursor-pointer relative"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {getActiveImage(product) ? (
                      <img
                        src={getActiveImage(product)!}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-md hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center rounded-md">
                        <ShoppingCart className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    {product.offer_active && product.offer_percentage && (
                      <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] px-1 py-0">
                        {product.offer_percentage}% OFF
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <h3 
                          className="font-outfit font-semibold text-lg cursor-pointer hover:text-primary transition-colors"
                          onClick={() => setSelectedProduct(product)}
                        >
                          {product.name}
                        </h3>
                      </div>
                      
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        {isVIP ? (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-yellow-500 mb-0.5 tracking-wider">
                              <Crown className="w-3 h-3" /> VIP ELITE PRICE
                            </div>
                            <div className="flex items-end gap-2">
                              <span className="text-xl font-bold text-yellow-500 flex items-center gap-1">
                                ₹{calculateVIPPrice(product)}
                                <Sparkles className="w-3 h-3 animate-pulse" />
                              </span>
                              <span className="text-xs text-muted-foreground line-through">
                                ₹{product.price}
                              </span>
                            </div>
                          </div>
                        ) : product.offer_active && product.offer_price ? (
                          <>
                            <span className="text-sm text-muted-foreground line-through">
                              ₹{product.price}
                            </span>
                            <span className="text-xl font-bold text-primary">
                              ₹{product.offer_price}
                            </span>
                          </>
                        ) : (
                          <span className="text-xl font-bold text-primary">
                            ₹{product.price}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end mt-4">
                      {!product.in_stock ? (
                        <Badge variant="destructive">Out of Stock</Badge>
                      ) : (!product.flavors || product.flavors.length === 0) ? (
                        <div className="flex items-center gap-2">
                          {quantity === 0 ? (
                            <Button
                              size="sm"
                              onClick={() => updateCart(product, 1)}
                              className="gap-1 font-medium"
                              disabled={!storeOpenNow}
                            >
                              <Plus className="w-4 h-4" />
                              Add
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-foreground"
                                onClick={() => updateCart(product, -1)}
                                disabled={!storeOpenNow}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="font-semibold min-w-[24px] text-center">
                                {quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-foreground"
                                onClick={() => updateCart(product, 1)}
                                disabled={!storeOpenNow}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="font-medium"
                          onClick={() => setSelectedProduct(product)}
                        >
                          Select Options
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground text-lg">
              No products available at the moment.
            </p>
          </div>
        )}

        {/* Product Request Form */}
        <div className="mt-8">
          <ProductRequestForm storeId={id} storeName={store?.name} />
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <StoreReviews storeId={id!} />
        </div>
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-outfit text-xl">{selectedProduct.name}</DialogTitle>
              <DialogDescription>
                {selectedProduct.category && <Badge variant="secondary" className="mt-1 capitalize">{selectedProduct.category}</Badge>}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                {getActiveImage(selectedProduct) ? (
                  <img src={getActiveImage(selectedProduct)!} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground/30" />
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
                      <span className="font-bold text-3xl text-yellow-500">₹{calculateVIPPrice(selectedProduct)}</span>
                      <span className="line-through text-muted-foreground text-sm">₹{selectedProduct.price}</span>
                    </div>
                  </div>
                ) : selectedProduct.offer_active && selectedProduct.offer_price ? (
                  <>
                    <span className="line-through text-muted-foreground">₹{selectedProduct.price}</span>
                    <span className="font-bold text-2xl text-primary">₹{selectedProduct.offer_price}</span>
                    <Badge className="bg-primary text-primary-foreground">{selectedProduct.offer_percentage}% OFF</Badge>
                  </>
                ) : (
                  <span className="font-bold text-2xl text-primary">₹{selectedProduct.price}</span>
                )}
              </div>
              
              {selectedProduct.description && (
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedProduct.description}
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
                          className={`relative overflow-hidden flex items-center justify-center rounded-md border-2 transition-all ${
                            isSelected 
                              ? 'border-primary ring-2 ring-primary ring-offset-1 ring-offset-background' 
                              : 'border-border hover:border-primary/50 opacity-60 hover:opacity-100'
                          } bg-card ${f.image_url ? 'w-16 h-16' : 'px-4 py-2'}`}
                          title={f.name}
                        >
                          {f.image_url ? (
                            <img src={f.image_url} alt={f.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-semibold">{f.name}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                {getProductQuantity(selectedProduct) === 0 ? (
                  <Button className="w-full text-lg font-bold py-6" onClick={() => updateCart(selectedProduct, 1)} disabled={!storeOpenNow}>
                    <Plus className="w-5 h-5 mr-2" /> Add to Cart
                  </Button>
                ) : (
                  <div className="flex items-center justify-between gap-4 bg-secondary/30 p-2 rounded-xl">
                    <Button size="icon" variant="ghost" onClick={() => updateCart(selectedProduct, -1)} disabled={!storeOpenNow}>
                      <Minus className="w-5 h-5" />
                    </Button>
                    <span className="font-black text-2xl">{getProductQuantity(selectedProduct)}</span>
                    <Button size="icon" variant="ghost" onClick={() => updateCart(selectedProduct, 1)} disabled={!storeOpenNow}>
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </div>
              
              <ProductReviews productId={selectedProduct.id} storeId={selectedProduct.store_id || id!} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-bounce-slow">
          <Link to="/cart">
            <Button size="lg" className="shadow-xl gap-2 px-8">
              View Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)} items)
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default StoreDetail;
