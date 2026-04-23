import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeliveryLocationMapProps {
  orderId: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  customerLat: number | null;
  customerLng: number | null;
  isAdmin?: boolean;
  onLocationUpdated?: () => void;
}

const DeliveryLocationMap = ({
  orderId,
  deliveryLat,
  deliveryLng,
  customerLat,
  customerLng,
  isAdmin = false,
  onLocationUpdated,
}: DeliveryLocationMapProps) => {
  const [updating, setUpdating] = useState(false);
  const [localDeliveryLat, setLocalDeliveryLat] = useState(deliveryLat);
  const [localDeliveryLng, setLocalDeliveryLng] = useState(deliveryLng);

  useEffect(() => {
    setLocalDeliveryLat(deliveryLat);
    setLocalDeliveryLng(deliveryLng);
  }, [deliveryLat, deliveryLng]);

  const updateDeliveryLocation = useCallback(async (lat: number, lng: number) => {
    setUpdating(true);
    const { error } = await supabase
      .from("orders")
      .update({
        delivery_lat: lat,
        delivery_lng: lng,
        delivery_updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update location");
    } else {
      setLocalDeliveryLat(lat);
      setLocalDeliveryLng(lng);
      toast.success("Delivery location updated");
      onLocationUpdated?.();
    }
    setUpdating(false);
  }, [orderId, onLocationUpdated]);

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    setUpdating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateDeliveryLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        toast.error("Failed to get location: " + error.message);
        setUpdating(false);
      },
      { enableHighAccuracy: true }
    );
  }, [updateDeliveryLocation]);

  const hasDeliveryLocation = localDeliveryLat && localDeliveryLng;
  const hasCustomerLocation = customerLat && customerLng;

  // Generate Google Maps embed URL
  const getMapUrl = () => {
    if (hasDeliveryLocation && hasCustomerLocation) {
      // Show route from delivery partner to customer
      return `https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${localDeliveryLat},${localDeliveryLng}&destination=${customerLat},${customerLng}&mode=driving`;
    } else if (hasDeliveryLocation) {
      return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${localDeliveryLat},${localDeliveryLng}&zoom=15`;
    } else if (hasCustomerLocation) {
      return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${customerLat},${customerLng}&zoom=15`;
    }
    return null;
  };

  // Static map for customer view
  const getStaticMapUrl = () => {
    if (hasDeliveryLocation && hasCustomerLocation) {
      return `https://maps.googleapis.com/maps/api/staticmap?size=400x200&markers=color:blue|label:D|${localDeliveryLat},${localDeliveryLng}&markers=color:red|label:C|${customerLat},${customerLng}&path=color:0x4f46e5|weight:3|${localDeliveryLat},${localDeliveryLng}|${customerLat},${customerLng}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`;
    } else if (hasDeliveryLocation) {
      return `https://maps.googleapis.com/maps/api/staticmap?size=400x200&markers=color:blue|label:D|${localDeliveryLat},${localDeliveryLng}&zoom=15&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`;
    }
    return null;
  };

  if (isAdmin) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Update Delivery Partner Location</p>
        
        {hasDeliveryLocation && (
          <div className="bg-secondary/50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Current: {localDeliveryLat?.toFixed(5)}, {localDeliveryLng?.toFixed(5)}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={useCurrentLocation}
            disabled={updating}
            className="flex-1"
          >
            {updating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 mr-2" />
            )}
            Use My Location
          </Button>
        </div>

        {hasDeliveryLocation && hasCustomerLocation && (
          <a
            href={`https://www.google.com/maps/dir/${localDeliveryLat},${localDeliveryLng}/${customerLat},${customerLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <MapPin className="w-3 h-3" />
            Open in Google Maps
          </a>
        )}
      </div>
    );
  }

  // Customer view
  if (!hasDeliveryLocation) {
    return (
      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Delivery location will be available once your order is out for delivery
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Live Delivery Tracking</p>
        <span className="flex items-center gap-1 text-xs text-emerald-600">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Live
        </span>
      </div>
      
      <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
        {/* Fallback display without API key */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
          <MapPin className="w-12 h-12 text-primary mb-2" />
          <p className="text-sm font-medium">Delivery Partner Location</p>
          <p className="text-xs text-muted-foreground">
            {localDeliveryLat?.toFixed(5)}, {localDeliveryLng?.toFixed(5)}
          </p>
          <a
            href={`https://www.google.com/maps?q=${localDeliveryLat},${localDeliveryLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Navigation className="w-3 h-3" />
            View on Google Maps
          </a>
        </div>
      </div>

      {hasCustomerLocation && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full" /> Delivery Partner
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full" /> Your Location
          </span>
        </div>
      )}
    </div>
  );
};

export default DeliveryLocationMap;
