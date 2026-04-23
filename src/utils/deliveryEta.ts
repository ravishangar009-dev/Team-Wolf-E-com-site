// Calculate distance between two points using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Calculate ETA based on distance
// Average delivery speed: 20 km/h in urban areas
export function calculateEta(distanceKm: number): { minutes: number; text: string } {
  const averageSpeedKmh = 20;
  const minutes = Math.ceil((distanceKm / averageSpeedKmh) * 60);
  
  if (minutes < 1) {
    return { minutes: 1, text: "Less than 1 min" };
  } else if (minutes < 60) {
    return { minutes, text: `${minutes} min` };
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return {
      minutes,
      text: remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`,
    };
  }
}

// Get ETA between delivery partner and customer
export function getDeliveryEta(
  deliveryLat: number | null,
  deliveryLng: number | null,
  customerLat: number | null,
  customerLng: number | null
): { distance: number; eta: string } | null {
  if (!deliveryLat || !deliveryLng || !customerLat || !customerLng) {
    return null;
  }

  const distance = calculateDistance(deliveryLat, deliveryLng, customerLat, customerLng);
  const eta = calculateEta(distance);

  return {
    distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
    eta: eta.text,
  };
}
