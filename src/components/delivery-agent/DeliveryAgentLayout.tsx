import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DeliveryAgentSidebar } from "./DeliveryAgentSidebar";
import { DeliveryAgentBottomNav } from "./DeliveryAgentBottomNav";
import { useDeliveryAgent } from "@/hooks/useDeliveryAgent";
import { Loader2 } from "lucide-react";

interface DeliveryAgentLayoutProps {
  children: ReactNode;
}

export const DeliveryAgentLayout = ({ children }: DeliveryAgentLayoutProps) => {
  const { user, agent, isDeliveryAgent, loading } = useDeliveryAgent();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (!isDeliveryAgent) {
        navigate("/");
      }
    }
  }, [user, isDeliveryAgent, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Checking delivery agent access...</p>
        </div>
      </div>
    );
  }

  if (!user || !isDeliveryAgent) {
    return null;
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <div className="hidden md:block">
        <DeliveryAgentSidebar agentName={agent?.full_name || "Delivery Agent"} />
      </div>
      <main className="flex-1 p-4 md:p-8 overflow-auto min-w-0 pb-20 md:pb-8">
        {children}
      </main>
      <DeliveryAgentBottomNav />
    </div>
  );
};
