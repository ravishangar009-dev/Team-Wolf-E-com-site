import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Megaphone } from "lucide-react";

const ADMIN_PHONE = "9787141556";

const ShopAdvertiseBanner = () => {
  return (
    <section className="container mx-auto px-4 py-8">
      <Card className="bg-gradient-to-r from-primary/15 via-primary/5 to-accent/10 border-primary/20 overflow-hidden">
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Megaphone className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 text-center md:text-left space-y-2">
            <h3 className="font-outfit font-bold text-lg md:text-xl">
              Want to advertise your shop?
            </h3>
            <p className="text-sm text-muted-foreground max-w-xl">
               Get your shop visible on TeamWolf! Promote your offers, new arrivals, new items, 
              or list your new shop. Call us to get started.
            </p>
          </div>
          <a href={`tel:${ADMIN_PHONE}`} className="flex-shrink-0">
            <Button size="lg" className="gap-2 font-outfit font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <Phone className="w-4 h-4" />
              Call {ADMIN_PHONE}
            </Button>
          </a>
        </CardContent>
      </Card>
    </section>
  );
};

export default ShopAdvertiseBanner;
