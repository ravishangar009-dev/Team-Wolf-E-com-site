import { CheckCircle2, Clock, Package, Truck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderTimelineProps {
  status: string;
  className?: string;
}

const STATUSES = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "accepted", label: "Accepted", icon: Package },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

const statusIndex = (status: string) => {
  if (status === "cancelled") return -1;
  const idx = STATUSES.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
};

const OrderTimeline = ({ status, className }: OrderTimelineProps) => {
  const currentIdx = statusIndex(status);
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className={cn("flex items-center gap-2 text-destructive", className)}>
        <XCircle className="w-5 h-5" />
        <span className="font-medium">Order Cancelled</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 sm:gap-2", className)}>
      {STATUSES.map((step, idx) => {
        const Icon = step.icon;
        const isCompleted = idx <= currentIdx;
        const isCurrent = idx === currentIdx;

        return (
          <div key={step.key} className="flex items-center">
            {/* Step */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                  isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span
                className={cn(
                  "text-[10px] sm:text-xs mt-1 text-center max-w-[60px] sm:max-w-none leading-tight",
                  isCompleted ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {idx < STATUSES.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-4 sm:w-8 mx-1 sm:mx-2 transition-colors",
                  idx < currentIdx ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OrderTimeline;
