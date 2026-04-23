import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function StoreAdminNotificationToggle() {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) return null;

  return (
    <Card className={isSubscribed ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20" : "border-orange-200 bg-orange-50 dark:bg-orange-950/20"}>
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isSubscribed ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-orange-100 dark:bg-orange-900/30"}`}>
            {isSubscribed ? (
              <Bell className="w-5 h-5 text-emerald-600" />
            ) : (
              <BellOff className="w-5 h-5 text-orange-600" />
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">
              {isSubscribed ? "Notifications Enabled" : "Enable Order Notifications"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isSubscribed
                ? "You'll receive alerts when new orders arrive"
                : "Get instant alerts when customers place orders"}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant={isSubscribed ? "outline" : "default"}
          onClick={isSubscribed ? unsubscribe : subscribe}
          disabled={isLoading}
          className="flex-shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSubscribed ? (
            "Disable"
          ) : (
            "Enable"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}