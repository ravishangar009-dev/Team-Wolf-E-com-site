import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Store {
  id: string;
  name: string;
  category: string;
  image_url: string;
  address: string;
  phone: string;
  rating: number;
  delivery_time: string;
  is_open: boolean;
}

const Stores = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { value: "all", label: "All Stores" },
    { value: "grocery", label: "Grocery" },
    { value: "medical", label: "Medical" },
    { value: "vegetables", label: "Vegetables" },
    { value: "restaurant", label: "Restaurant" },
    { value: "bakery", label: "Bakery" },
  ];

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .order("rating", { ascending: false });

    if (!error && data) {
      setStores(data);
    }
    setLoading(false);
  };

  const filteredStores =
    selectedCategory === "all"
      ? stores
      : stores.filter((store) => store.category.trim().toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-outfit font-bold mb-2">Local Stores</h1>
          <p className="text-muted-foreground">
            Browse and order from your favorite neighborhood stores
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 animate-fade-in">
          {categories.map((category) => (
            <Badge
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap px-4 py-2 text-sm hover:scale-105 transition-transform"
              onClick={() => setSelectedCategory(category.value)}
            >
              {category.label}
            </Badge>
          ))}
        </div>

        {/* Stores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full h-48" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            : filteredStores.map((store, index) => (
                <Link
                  key={store.id}
                  to={`/store/${store.id}`}
                  className="animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={store.image_url}
                        alt={store.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        {store.is_open ? (
                          <Badge className="bg-green-500 text-white">Open</Badge>
                        ) : (
                          <Badge variant="destructive">Closed</Badge>
                        )}
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-outfit font-semibold text-lg mb-1">
                          {store.name}
                        </h3>
                        <Badge variant="secondary" className="capitalize text-xs">
                          {store.category}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-primary fill-primary" />
                          <span className="font-medium">{store.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{store.delivery_time}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{store.address}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
        </div>

        {filteredStores.length === 0 && !loading && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground text-lg">
              No stores found in this category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stores;
