import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  id: string;
  name: string;
  price: number;
  offer_price: number | null;
  offer_active: boolean | null;
  image_url: string | null;
  store_id: string;
  store_name?: string;
}

const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(true);

    const { data } = await supabase
      .from("products")
      .select("id, name, price, offer_price, offer_active, image_url, store_id, vip_discount_percentage")
      .ilike("name", `%${value.trim()}%`)
      .eq("in_stock", true)
      .limit(20);

    if (data && data.length > 0) {
      const storeIds = [...new Set(data.map((p) => p.store_id))];
      const { data: stores } = await supabase
        .from("stores")
        .select("id, name")
        .in("id", storeIds);

      const storeMap = new Map(stores?.map((s) => [s.id, s.name]) ?? []);
      setResults(data.map((p) => ({ ...p, store_name: storeMap.get(p.store_id) || "Unknown" })));
    } else {
      setResults([]);
    }
    setLoading(false);
  };

  const handleSelect = (result: SearchResult) => {
    setQuery("");
    setResults([]);
    setOpen(false);
    navigate(`/store/${result.store_id}?highlight=${encodeURIComponent(result.id)}&search=${encodeURIComponent(result.name)}`);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search products across all stores..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          className="pl-9 pr-9"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-auto">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Searching...</p>
          ) : results.length === 0 && query.length >= 2 ? (
            <p className="p-4 text-sm text-muted-foreground">No products found for "{query}"</p>
          ) : (
            results.map((r) => (
              <button
                key={`${r.id}-${r.store_id}`}
                onClick={() => handleSelect(r)}
                className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
              >
                {r.image_url && (
                  <img src={r.image_url} alt={r.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.store_name}</p>
                </div>
                <span className="text-sm font-bold text-primary flex-shrink-0">
                  ₹{r.offer_active && r.offer_price ? r.offer_price : r.price}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Click outside to close */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
};

export default GlobalSearch;
