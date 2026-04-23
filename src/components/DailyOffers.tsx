import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Percent, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface DailyOffer {
  id: string;
  title: string;
  description: string | null;
  discount_percentage: number | null;
  image_url: string | null;
}

const DailyOffers = () => {
  const [offers, setOffers] = useState<DailyOffer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    const { data, error } = await supabase
      .from("daily_offers")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (data && !error) {
      setOffers(data);
    }
    setLoading(false);
  };

  const nextOffer = () => {
    setCurrentIndex((prev) => (prev + 1) % offers.length);
  };

  const prevOffer = () => {
    setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-40 bg-secondary/50 rounded-xl"></div>
      </div>
    );
  }

  if (offers.length === 0) {
    return null;
  }

  const currentOffer = offers[currentIndex];

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-primary animate-pulse" />
        <h2 className="text-2xl md:text-3xl font-outfit font-bold">Today's Offers & Deals</h2>
      </div>

      <div className="relative">
        <Card className="overflow-hidden bg-gradient-to-r from-primary/10 via-secondary/30 to-primary/10 border-primary/30 shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              {currentOffer.image_url && (
                <div className="md:w-1/3 h-40 md:h-auto">
                  <img
                    src={currentOffer.image_url}
                    alt={currentOffer.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className={`flex-1 p-6 flex flex-col justify-center ${!currentOffer.image_url ? 'text-center' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                  {currentOffer.discount_percentage && (
                    <Badge className="bg-destructive text-destructive-foreground animate-pulse">
                      <Percent className="w-3 h-3 mr-1" />
                      {currentOffer.discount_percentage}% OFF
                    </Badge>
                  )}
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    Limited Time
                  </Badge>
                </div>
                <h3 className="text-xl md:text-2xl font-outfit font-bold text-foreground mb-2">
                  {currentOffer.title}
                </h3>
                {currentOffer.description && (
                  <p className="text-muted-foreground">{currentOffer.description}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {offers.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background shadow-md"
              onClick={prevOffer}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background shadow-md"
              onClick={nextOffer}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>

      {offers.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {offers.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? "bg-primary w-6" : "bg-muted-foreground/30"
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default DailyOffers;