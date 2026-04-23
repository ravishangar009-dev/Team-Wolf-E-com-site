import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface DeliveryAgent {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  is_active: boolean;
  is_available: boolean;
  current_lat: number | null;
  current_lng: number | null;
  location_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useDeliveryAgent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [agent, setAgent] = useState<DeliveryAgent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAgent = async (userId: string) => {
      const { data, error } = await supabase
        .from("delivery_agents")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data) {
        setAgent(data as DeliveryAgent);
      } else {
        setAgent(null);
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => checkAgent(session.user.id), 0);
        } else {
          setAgent(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAgent(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, agent, isDeliveryAgent: !!agent, loading };
};
