 import { useEffect, useState } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { User } from "@supabase/supabase-js";
 
 interface StoreAdminInfo {
   store_id: string;
   stores?: {
     id: string;
     name: string;
   };
 }
 
 export const useStoreAdmin = () => {
   const [user, setUser] = useState<User | null>(null);
   const [storeAdminInfo, setStoreAdminInfo] = useState<StoreAdminInfo | null>(null);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const checkStoreAdmin = async (userId: string) => {
       const { data, error } = await supabase
         .from("store_admins")
         .select("store_id, stores(id, name)")
         .eq("user_id", userId)
         .maybeSingle();
 
       if (!error && data) {
         setStoreAdminInfo(data as StoreAdminInfo);
       } else {
         setStoreAdminInfo(null);
       }
       setLoading(false);
     };
 
     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       (event, session) => {
         setUser(session?.user ?? null);
         if (session?.user) {
           setTimeout(() => {
             checkStoreAdmin(session.user.id);
           }, 0);
         } else {
           setStoreAdminInfo(null);
           setLoading(false);
         }
       }
     );
 
     supabase.auth.getSession().then(({ data: { session } }) => {
       setUser(session?.user ?? null);
       if (session?.user) {
         checkStoreAdmin(session.user.id);
       } else {
         setLoading(false);
       }
     });
 
     return () => subscription.unsubscribe();
   }, []);
 
   return { user, storeAdminInfo, isStoreAdmin: !!storeAdminInfo, loading };
 };