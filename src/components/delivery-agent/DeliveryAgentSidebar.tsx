import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Truck, LayoutDashboard, ShoppingCart, Home, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import teamWolfLogo from "@/assets/teamwolf-logo.png";

const navItems = [
  { href: "/delivery-agent", label: "Dashboard", icon: LayoutDashboard },
  { href: "/delivery-agent/orders", label: "Orders", icon: ShoppingCart },
];

interface DeliveryAgentSidebarProps {
  agentName: string;
}

export const DeliveryAgentSidebar = ({ agentName }: DeliveryAgentSidebarProps) => {
  const location = useLocation();
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
            <h2 className="font-outfit font-bold text-lg text-foreground">Delivery Agent</h2>
            <p className="text-xs text-muted-foreground truncate max-w-[150px]">{agentName}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
        >
          <Home className="w-5 h-5" />
          <span className="font-medium">Back to App</span>
        </Link>
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
