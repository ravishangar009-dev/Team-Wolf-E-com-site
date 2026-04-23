import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StoreAdminSidebar } from "./StoreAdminSidebar";
import { StoreAdminBottomNav } from "./StoreAdminBottomNav";
import { useStoreAdmin } from "@/hooks/useStoreAdmin";
import { Loader2 } from "lucide-react";

interface StoreAdminLayoutProps {
  children: ReactNode;
}

export const StoreAdminLayout = ({ children }: StoreAdminLayoutProps) => {
  const { user, storeAdminInfo, isStoreAdmin, loading } = useStoreAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (!isStoreAdmin) {
        navigate("/");
      }
    }
  }, [user, isStoreAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Checking store admin access...</p>
        </div>
      </div>
    );
  }

  if (!user || !isStoreAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <StoreAdminSidebar storeName={storeAdminInfo?.stores?.name || "My Store"} />
      </div>
      {/* Main content with bottom padding on mobile for bottom nav */}
      <main className="flex-1 p-4 md:p-8 overflow-auto min-w-0 pb-20 md:pb-8">
        {children}
      </main>
      {/* Mobile bottom navigation */}
      <StoreAdminBottomNav />
    </div>
  );
};
