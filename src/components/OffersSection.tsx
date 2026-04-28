import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Percent, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type OfferProduct = {
  id: string;
  name: string;
  price: number;
  offer_price: number | null;
  offer_percentage: number | null;
  offer_active: boolean | null;
  image_url: string | null;
  store_id: string;
  stores?: {
    id: string;
    name: string;
  } | null;
};

const OffersSection = () => {
  const [items, setItems] = useState<OfferProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(
          "id,name,price,offer_price,offer_percentage,offer_active,image_url,store_id,vip_discount_percentage,stores(id,name)"
        )
        .eq("offer_active", true)
        .order("created_at", { ascending: false })
        .limit(12);

      if (!error && data) setItems(data as any);
      setLoading(false);
    };
    load();
  }, []);

  const visible = useMemo(
    () => items.filter((p) => p.offer_active && (p.offer_price ?? null) !== null),
    [items]
  );

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Tag className="w-6 h-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-outfit font-bold">Offers</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </section>
    );
  }

  if (visible.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Tag className="w-6 h-6 text-primary" />
          <h2 className="text-2xl md:text-3xl font-outfit font-bold">Offers</h2>
        </div>
        <Link to="/products">
          <Button variant="outline" size="sm">Browse Products</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {visible.map((p) => (
          <Card key={p.id} className="overflow-hidden group hover:shadow-lg transition-all">
            <div className="relative h-36 overflow-hidden">
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={`${p.name} offer`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-muted" />
              )}
              {p.offer_percentage ? (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-destructive text-destructive-foreground">
                    <Percent className="w-3 h-3 mr-1" />
                    {p.offer_percentage}%
                  </Badge>
                </div>
              ) : null}
            </div>

            <CardContent className="p-4 space-y-2">
              <div>
                <p className="font-outfit font-semibold leading-tight">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.stores?.name ?? "Store"}
                </p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground line-through">₹{p.price}</span>
                <span className="text-lg font-bold text-primary">₹{p.offer_price}</span>
              </div>

              <Link to={`/store/${p.store_id}`} className="block">
                <Button size="sm" className="w-full">View in store</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default OffersSection;
