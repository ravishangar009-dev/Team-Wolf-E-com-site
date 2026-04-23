import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Zap, Shield, Dumbbell, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import DailyOffers from "@/components/DailyOffers";
import AdvertisementGallery from "@/components/AdvertisementGallery";
import OffersSection from "@/components/OffersSection";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import MaintenanceWarningBanner from "@/components/MaintenanceWarningBanner";
import GlobalSearch from "@/components/GlobalSearch";
import SiteLockdown from "@/components/SiteLockdown";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import CustomerTestimonials from "@/components/CustomerTestimonials";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import teamWolfLogo from "@/assets/teamwolf-logo.png";
import hero1 from "@/assets/hero-1.png";
import hero2 from "@/assets/hero-2.png";
import hero3 from "@/assets/hero-3.png";
import hero4 from "@/assets/hero-4.png";
import hero6 from "@/assets/hero-6.png";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const [welcomeName, setWelcomeName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentHero, setCurrentHero] = useState(0);
  const { settings: siteSettings } = useSiteSettings();

  const heroImages = [hero6];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const loggedIn = !!session?.user;
      setIsLoggedIn(loggedIn);
      if (!loggedIn || !session?.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setWelcomeName(profile?.full_name || null);
    };
    load();
  }, []);

  const features = [
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: "Pure Potency",
      description: "Lab-tested, premium-grade supplements for maximum results",
    },
    {
      icon: <Dumbbell className="w-8 h-8 text-primary" />,
      title: "Built for Athletes",
      description: "Formulas designed for serious lifters and competitors",
    },
    {
      icon: <ShoppingBag className="w-8 h-8 text-primary" />,
      title: "Fast Delivery",
      description: "Get your supplements delivered to your doorstep quickly",
    },
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "100% Authentic",
      description: "Guaranteed genuine products with verified sourcing",
    },
  ];

  if (siteSettings && !siteSettings.is_site_active) {
    return (
      <SiteLockdown
        reopenAt={siteSettings.reopen_at}
        message={siteSettings.shutdown_message}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MaintenanceWarningBanner />
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background hero images */}
        <div className="absolute inset-0">
          {heroImages.map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${currentHero === i ? "opacity-60" : "opacity-0"
                }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium">
                <Zap className="w-4 h-4" />
                Premium Gym Supplements
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-outfit font-black text-foreground leading-tight tracking-tight">
                UNLEASH THE{" "}
                <span className="text-primary">WOLF</span>
                <br />
                WITHIN
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
                Premium protein powders, pre-workouts, BCAAs, and sports nutrition. Fuel your beast mode with Team Wolf.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/products">
                  <Button size="lg" className="text-lg px-8 py-6 font-outfit font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-primary hover:bg-primary/90">
                    Shop Now <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex-1 flex justify-center lg:justify-end animate-scale-in">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl scale-110"></div>
                <img
                  src={teamWolfLogo}
                  alt="Team Wolf Supplement"
                  className="relative w-48 h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 opacity-50 mix-blend-screen invert drop-shadow-2xl animate-pulse-soft"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome Banner */}
      {isLoggedIn && (
        <section className="container mx-auto px-4 pt-6">
          <Card className="border-border/60 bg-card">
            <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Welcome back, warrior</p>
                <p className="font-outfit font-semibold text-lg">
                  {welcomeName ? `${welcomeName}` : "Ready to train?"}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Search */}
      <section className="container mx-auto px-4 pt-8">
        <GlobalSearch />
      </section>

      {/* Daily Offers */}
      <DailyOffers />

      {/* Advertisement Gallery */}
      <AdvertisementGallery />

      {/* Product Offers */}
      <OffersSection />

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-outfit font-bold text-center mb-4">
          Why Choose <span className="text-primary">Team Wolf</span>?
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          We don't just sell supplements — we fuel champions.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card animate-fade-in hover:border-primary/30"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 text-center space-y-3">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                  {feature.icon}
                </div>
                <h3 className="font-outfit font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <CustomerTestimonials />

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden relative">
          <div className="absolute right-0 top-0 w-1/3 h-full opacity-10">
            <img src={teamWolfLogo} alt="" className="w-full h-full object-contain invert" />
          </div>
          <CardContent className="p-8 md:p-12 text-center relative z-10 space-y-6">
            <h2 className="text-3xl md:text-4xl font-outfit font-bold">
              Ready to <span className="text-primary">Dominate</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join the wolf pack. Get access to premium supplements, exclusive deals, and the fuel you need to crush your goals.
            </p>
            <Link to="/products">
              <Button size="lg" className="text-lg px-8 py-6 font-outfit font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105">
                Shop Supplements <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-8">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src={teamWolfLogo} alt="Team Wolf" className="w-8 h-8 invert" />
              <span className="font-outfit font-bold text-foreground">Team Wolf Supplement</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © 2025 Team Wolf Supplement. Fuel your beast mode.
            </p>
          </div>
        </div>
      </footer>

      <PushNotificationPrompt />
      <PWAInstallPrompt />
    </div>
  );
};

export default Home;
