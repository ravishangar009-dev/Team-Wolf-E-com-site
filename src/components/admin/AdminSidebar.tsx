import { Package, ShoppingCart, BarChart3, Home, LogOut, Sparkles, UserCheck, Truck, Image, ScrollText, AlertTriangle, TrendingUp, Crown, Dumbbell } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import teamWolfLogo from "@/assets/teamwolf-logo.png";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: BarChart3 },
  { title: "Revenue Analytics", url: "/admin/revenue", icon: TrendingUp },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
  { title: "VIP Access", url: "/admin/vip-access", icon: Crown },
  { title: "Admin Temp Access", url: "/admin/temp-access", icon: UserCheck },
  { title: "Activity Log", url: "/admin/activity-log", icon: ScrollText },
  { title: "Daily Offers", url: "/admin/offers", icon: Sparkles },
  { title: "Advertisements", url: "/admin/advertisements", icon: Image },
  { title: "Low Stock Alerts", url: "/admin/low-stock", icon: AlertTriangle },
  { title: "Workout Exercises", url: "/admin/workout-exercises", icon: Dumbbell },
  { title: "Workout Packages", url: "/admin/workout-packages", icon: Package },
  { title: "User Workout Access", url: "/admin/user-workout-access", icon: UserCheck },
];

export const AdminSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col shrink-0">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <img src={teamWolfLogo} alt="Team Wolf" className="w-10 h-10 rounded-full" />
          <div>
            <h2 className="font-outfit font-bold text-lg text-foreground">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">Team Wolf Supplement</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/admin"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <NavLink
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
        >
          <Home className="w-5 h-5" />
          <span className="font-medium">Back to App</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};
