import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useVIPStatus } from "./hooks/useVIPStatus";
import { useEffect } from "react";
import Home from "./pages/Home";
import Products from "./pages/Products";
import StoreDetail from "./pages/StoreDetail";
import Cart from "./pages/Cart";
import Auth from "./pages/Auth";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOffers from "./pages/admin/AdminOffers";
import AdminAdvertisements from "./pages/admin/AdminAdvertisements";
import AdminTempAccess from "./pages/admin/AdminTempAccess";
import AdminVIPAccess from "./pages/admin/AdminVIPAccess";
import AdminActivityLog from "./pages/admin/AdminActivityLog";
import AdminLowStock from "./pages/admin/AdminLowStock";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminStores from "./pages/admin/AdminStores";
import StoreAdminDashboard from "./pages/store-admin/StoreAdminDashboard";
import StoreAdminOrders from "./pages/store-admin/StoreAdminOrders";
import StoreAdminProducts from "./pages/store-admin/StoreAdminProducts";
import OfflineBilling from "./pages/store-admin/OfflineBilling";
import AdminDeliveryAgents from "./pages/admin/AdminDeliveryAgents";
import DeliveryAgentDashboard from "./pages/delivery-agent/DeliveryAgentDashboard";
import DeliveryAgentOrders from "./pages/delivery-agent/DeliveryAgentOrders";
import WorkoutVIP from "./pages/WorkoutVIP";
import AdminWorkoutExercises from "./pages/admin/AdminWorkoutExercises";
import AdminWorkoutPackages from "./pages/admin/AdminWorkoutPackages";
import AdminUserWorkoutAccess from "./pages/admin/AdminUserWorkoutAccess";
import MaintenanceGuard from "./components/MaintenanceGuard";

const queryClient = new QueryClient();

const VIPThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isVIP } = useVIPStatus();

  useEffect(() => {
    if (isVIP) {
      document.body.classList.add("vip-theme");
    } else {
      document.body.classList.remove("vip-theme");
    }
  }, [isVIP]);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <VIPThemeWrapper>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stores" element={<MaintenanceGuard><Products /></MaintenanceGuard>} />
          <Route path="/products" element={<MaintenanceGuard><Products /></MaintenanceGuard>} />
          <Route path="/store/:id" element={<MaintenanceGuard><StoreDetail /></MaintenanceGuard>} />
          <Route path="/cart" element={<MaintenanceGuard><Cart /></MaintenanceGuard>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/vip-access" element={<AdminVIPAccess />} />
          <Route path="/admin/temp-access" element={<AdminTempAccess />} />
          <Route path="/admin/activity-log" element={<AdminActivityLog />} />
          <Route path="/admin/low-stock" element={<AdminLowStock />} />
          <Route path="/admin/revenue" element={<AdminRevenue />} />
          <Route path="/admin/stores" element={<AdminStores />} />
          <Route path="/admin/offers" element={<AdminOffers />} />
          <Route path="/admin/advertisements" element={<AdminAdvertisements />} />
          <Route path="/admin/delivery-agents" element={<AdminDeliveryAgents />} />
          <Route path="/admin/workout-exercises" element={<AdminWorkoutExercises />} />
          <Route path="/admin/workout-packages" element={<AdminWorkoutPackages />} />
          <Route path="/admin/user-workout-access" element={<AdminUserWorkoutAccess />} />
          <Route path="/workout-vip" element={<WorkoutVIP />} />
          {/* Store Admin (Temp Access) Routes */}
          <Route path="/store-admin" element={<StoreAdminDashboard />} />
          <Route path="/store-admin/orders" element={<StoreAdminOrders />} />
          <Route path="/store-admin/products" element={<StoreAdminProducts />} />
          <Route path="/store-admin/offline-billing" element={<OfflineBilling />} />
          {/* Delivery Agent Routes */}
          <Route path="/delivery-agent" element={<DeliveryAgentDashboard />} />
          <Route path="/delivery-agent/orders" element={<DeliveryAgentOrders />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </VIPThemeWrapper>
  </QueryClientProvider>
);

export default App;
