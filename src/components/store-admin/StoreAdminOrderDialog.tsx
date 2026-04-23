import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, ExternalLink, CheckCircle2, Truck, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import OrderTimeline from "@/components/OrderTimeline";
import type { OrderData } from "@/pages/store-admin/StoreAdminOrders";

interface StoreAdminOrderDialogProps {
  order: OrderData | null;
  onClose: () => void;
  onStatusUpdate: () => void;
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

const getNextStatus = (s: string) => {
  if (s === "pending") return "accepted";
  if (s === "accepted") return "out_for_delivery";
  if (s === "out_for_delivery") return "delivered";
  return null;
};

const getNextStatusLabel = (s: string) => {
  if (s === "pending") return "Accept Order";
  if (s === "accepted") return "Out for Delivery";
  if (s === "out_for_delivery") return "Mark Delivered";
  return null;
};

export const StoreAdminOrderDialog = ({ order, onClose, onStatusUpdate }: StoreAdminOrderDialogProps) => {
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) {
      toast.error("Failed to update order status");
      setUpdatingStatus(false);
      return;
    }
    toast.success(`Order marked as ${newStatus.replace(/_/g, " ")}`);
    setUpdatingStatus(false);
    onClose();
    onStatusUpdate();
  };

  if (!order) return null;

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order #{order.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Date</p>
              <p className="font-medium">{format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}</p>
            </div>
            <div>
              <p className="text-muted-foreground flex items-center gap-1 text-xs"><Phone className="w-3 h-3" /> Phone</p>
              <a href={`tel:${order.phone}`} className="font-medium text-primary">{order.phone}</a>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Status</p>
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status || "pending")}`}>
                {order.status?.replace(/_/g, " ") || "pending"}
              </span>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground flex items-center gap-1 mb-1 text-xs"><MapPin className="w-3 h-3" /> Delivery Address</p>
            <p className="font-medium text-sm">{order.delivery_address}</p>
            {order.latitude && order.longitude && (
              <a
                href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-xs flex items-center gap-1 mt-1 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                View on Map
              </a>
            )}
          </div>

          <div>
            <p className="text-muted-foreground mb-2 text-xs">Order Items</p>
            <div className="space-y-2">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-secondary/50 p-3 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.products?.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-sm">₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t">
              <p className="font-semibold text-sm">Total Amount</p>
              <p className="text-lg font-bold text-primary">₹{order.total_amount}</p>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground mb-2 text-xs">Order Progress</p>
            <OrderTimeline status={order.status || "pending"} />
          </div>

          {order.status !== "delivered" && order.status !== "cancelled" && (
            <div className="space-y-2 pt-3 border-t">
              {getNextStatus(order.status || "pending") && (
                <Button
                  size="sm"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={updatingStatus}
                  onClick={() => updateOrderStatus(order.id, getNextStatus(order.status || "pending")!)}
                >
                  {updatingStatus ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    <>
                      {order.status === "pending" && <CheckCircle2 className="w-4 h-4 mr-2" />}
                      {order.status === "accepted" && <Truck className="w-4 h-4 mr-2" />}
                      {order.status === "out_for_delivery" && <Package className="w-4 h-4 mr-2" />}
                      {getNextStatusLabel(order.status || "pending")}
                    </>
                  )}
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                className="w-full"
                disabled={updatingStatus}
                onClick={() => updateOrderStatus(order.id, "cancelled")}
              >
                Cancel Order
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
