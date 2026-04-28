import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface VIPStatus {
  isVIP: boolean;
  globalDiscount: number;
  productDiscounts: Record<string, number>; // productId -> discountPercentage
  loading: boolean;
}

export const useVIPStatus = () => {
  const [status, setStatus] = useState<VIPStatus>({
    isVIP: false,
    globalDiscount: 0,
    productDiscounts: {},
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    const fetchVIPStatus = async (userId: string) => {
      try {
        // Fetch VIP customer record
        const { data: vipCustomer, error: vipError } = await supabase
          .from("vip_customers")
          .select("id, global_discount")
          .eq("user_id", userId)
          .maybeSingle();

        if (vipError || !vipCustomer) {
          if (mounted) setStatus(prev => ({ ...prev, loading: false }));
          return;
        }

        // Fetch specific product discounts
        const { data: productDiscounts, error: pdError } = await supabase
          .from("vip_product_discounts")
          .select("product_id, discount_percentage")
          .eq("vip_id", vipCustomer.id);

        if (mounted) {
          const discountMap: Record<string, number> = {};
          if (!pdError && productDiscounts) {
            productDiscounts.forEach(pd => {
              discountMap[pd.product_id] = pd.discount_percentage;
            });
          }

          setStatus({
            isVIP: true,
            globalDiscount: vipCustomer.global_discount,
            productDiscounts: discountMap,
            loading: false,
          });
        }
      } catch (err) {
        console.error("Error in useVIPStatus:", err);
        if (mounted) setStatus(prev => ({ ...prev, loading: false }));
      }
    };

    const setupAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchVIPStatus(session.user.id);
      } else {
        if (mounted) setStatus(prev => ({ ...prev, loading: false }));
      }
    };

    setupAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchVIPStatus(session.user.id);
      } else {
        if (mounted) {
          setStatus({
            isVIP: false,
            globalDiscount: 0,
            productDiscounts: {},
            loading: false,
          });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Calculates the best price for a VIP customer
   */
  const calculateVIPPrice = (product: {
    id: string;
    price: number;
    offer_active?: boolean | null;
    offer_price?: number | null;
    vip_discount_percentage?: number | null;
  }) => {
    if (!status.isVIP) {
      return product.offer_active && product.offer_price ? product.offer_price : product.price;
    }

    const standardPrice = product.price;
    const standardOfferPrice = product.offer_active && product.offer_price ? product.offer_price : standardPrice;

    // 1. Check for product-specific VIP discount
    const specificDiscount = status.productDiscounts[product.id];
    let vipPrice = standardPrice;

    if (specificDiscount !== undefined) {
      vipPrice = standardPrice * (1 - specificDiscount / 100);
    } else if (product.vip_discount_percentage) {
      // 2. Apply product's built-in VIP discount
      vipPrice = standardPrice * (1 - product.vip_discount_percentage / 100);
    } else if (status.globalDiscount > 0) {
      // 3. Apply global VIP discount
      vipPrice = standardPrice * (1 - status.globalDiscount / 100);
    }

    // Round to 2 decimal places
    vipPrice = Math.round(vipPrice * 100) / 100;

    // Return the lowest of standard offer price and VIP price
    return Math.min(standardOfferPrice, vipPrice);
  };

  return { ...status, calculateVIPPrice };
};
