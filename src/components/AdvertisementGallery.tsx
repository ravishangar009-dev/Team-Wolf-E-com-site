import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, ChevronLeft, ChevronRight, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  shop_name: string | null;
  shop_phone: string | null;
}

const AdvertisementGallery = () => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const fetchAds = async () => {
      const { data } = await supabase
        .from("advertisements")
        .select("id, title, description, image_url, shop_name, shop_phone")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (data) setAds(data as Advertisement[]);
      setLoading(false);
    };
    fetchAds();
  }, []);

  const goTo = useCallback((index: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
  }, []);

  const next = useCallback(() => {
    if (ads.length <= 1) return;
    goTo((currentIndex + 1) % ads.length);
  }, [ads.length, currentIndex, goTo]);

  const prev = useCallback(() => {
    if (ads.length <= 1) return;
    goTo((currentIndex - 1 + ads.length) % ads.length);
  }, [ads.length, currentIndex, goTo]);

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (ads.length <= 1) return;
    timerRef.current = setInterval(next, 4000);
    return () => clearInterval(timerRef.current);
  }, [ads.length, next]);

  if (loading) return <div className="animate-pulse"><div className="h-48 bg-secondary/50 rounded-xl" /></div>;
  if (ads.length === 0) return null;

  const ad = ads[currentIndex];

  return (
    <section className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-6 h-6 text-primary" />
        <h2 className="text-2xl md:text-3xl font-outfit font-bold">Shop Spotlight</h2>
      </div>

      <div className="relative">
        <Card className="overflow-hidden border-primary/20 shadow-lg">
          <CardContent className="p-0">
            <div
              className={`transition-opacity duration-300 ease-in-out ${isTransitioning ? "opacity-0" : "opacity-100"}`}
            >
              <div className="flex flex-col md:flex-row">
                {ad.image_url && (
                  <div className="md:w-1/2 h-48 md:h-64">
                    <img
                      src={ad.image_url}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className={`flex-1 p-6 flex flex-col justify-center ${!ad.image_url ? "text-center" : ""}`}>
                  {ad.shop_name && (
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                      {ad.shop_name}
                    </p>
                  )}
                  <h3 className="text-xl md:text-2xl font-outfit font-bold text-foreground mb-2">
                    {ad.title}
                  </h3>
                  {ad.description && (
                    <p className="text-sm text-muted-foreground mb-4">{ad.description}</p>
                  )}
                  {ad.shop_phone && (
                    <a href={`tel:${ad.shop_phone}`}>
                      <Button className="gap-2 font-outfit font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105">
                        <Phone className="w-4 h-4" />
                        Call {ad.shop_name || "Shop"} — {ad.shop_phone}
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {ads.length > 1 && (
          <>
            <Button
              variant="ghost" size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background shadow-md"
              onClick={prev}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background shadow-md"
              onClick={next}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>

      {ads.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {ads.map((_, i) => (
            <button
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentIndex ? "bg-primary w-6" : "bg-muted-foreground/30 w-2"
              }`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default AdvertisementGallery;
