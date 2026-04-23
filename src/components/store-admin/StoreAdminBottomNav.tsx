import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Package, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/store-admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/store-admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/store-admin/products", label: "Products", icon: Package },
  { href: "/", label: "Store", icon: Home },
];

export const StoreAdminBottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "scale-110")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
