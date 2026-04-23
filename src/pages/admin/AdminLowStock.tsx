import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface LowStockProduct {
  id: string;
  name: string;
  stock_count: number;
  alert_count: number | null;
  in_stock: boolean;
  stores: { name: string };
}

export default function AdminLowStock() {
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowStock();
  }, []);

  const fetchLowStock = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, stock_count, alert_count, in_stock,
          stores ( name )
        `)
        .order("stock_count", { ascending: true });

      if (error) throw error;
      
      const filteredData = (data as unknown as LowStockProduct[]).filter(
        (product) => product.stock_count <= (product.alert_count ?? 5)
      );

      setProducts(filteredData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <h1 className="text-3xl font-outfit font-bold">Low Stock Alerts</h1>
        </div>
        <p className="text-muted-foreground">
          Showing all products that have reached or fallen below their alert thresholds.
        </p>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center bg-card rounded-lg border border-border">
            <p className="text-muted-foreground text-lg">
              All products are fully stocked!
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {products.map((product) => (
              <Card key={product.id} className="border-border">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Store: {product.stores?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={product.stock_count <= 0 ? "destructive" : "secondary"}>
                      {product.stock_count <= 0 ? "Out of Stock" : `${product.stock_count} Left`}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
