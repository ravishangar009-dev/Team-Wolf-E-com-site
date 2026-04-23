import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ShoppingCart, LogOut, Store, Home, Package, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StoreAdminSidebarProps {
  storeName: string;
}

const navItems = [
  { href: "/store-admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/store-admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/store-admin/products", label: "Products", icon: Package },
  { href: "/store-admin/offline-billing", label: "Offline Billing", icon: Receipt },
];
 
 export const StoreAdminSidebar = ({ storeName }: StoreAdminSidebarProps) => {
   const location = useLocation();
   const navigate = useNavigate();
 
   const handleLogout = async () => {
     await supabase.auth.signOut();
     toast.success("Logged out successfully");
     navigate("/");
   };
 
   return (
     <aside className="w-64 bg-card border-r border-border min-h-screen p-6 flex flex-col">
       <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-outfit font-bold">Temp Admin</h2>
          </div>
          <p className="text-sm text-muted-foreground truncate">Team Wolf Supplement</p>
       </div>
 
       <nav className="flex-1 space-y-2">
         {navItems.map((item) => {
           const Icon = item.icon;
           const isActive = location.pathname === item.href;
           return (
             <Link
               key={item.href}
               to={item.href}
               className={cn(
                 "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                 isActive
                   ? "bg-primary text-primary-foreground"
                   : "text-muted-foreground hover:bg-secondary hover:text-foreground"
               )}
             >
               <Icon className="w-5 h-5" />
               {item.label}
             </Link>
           );
         })}
       </nav>
 
       <div className="space-y-2 pt-4 border-t border-border">
         <Link
           to="/"
           className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
         >
           <Home className="w-5 h-5" />
           Back to Store
         </Link>
         <button
           onClick={handleLogout}
           className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
         >
           <LogOut className="w-5 h-5" />
           Logout
         </button>
       </div>
     </aside>
   );
 };