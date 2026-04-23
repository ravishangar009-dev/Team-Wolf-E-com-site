import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { OrderData } from "@/pages/store-admin/StoreAdminOrders";

interface StoreAdminOrderCardProps {
  order: OrderData;
  onViewDetails: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending": return "bg-orange-100 text-orange-700";
    case "accepted": return "bg-blue-100 text-blue-700";
    case "out_for_delivery": return "bg-purple-100 text-purple-700";
    case "delivered": return "bg-emerald-100 text-emerald-700";
    case "cancelled": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

export const StoreAdminOrderCard = ({ order, onViewDetails }: StoreAdminOrderCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-semibold">#{order.id.slice(0, 8)}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(order.status || "pending")}`}>
                {order.status?.replace(/_/g, " ") || "pending"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(order.created_at), "dd MMM, hh:mm a")}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{order.phone}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-primary text-lg">₹{order.total_amount}</p>
            <Button variant="ghost" size="sm" className="text-xs h-7 mt-1" onClick={onViewDetails}>
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
