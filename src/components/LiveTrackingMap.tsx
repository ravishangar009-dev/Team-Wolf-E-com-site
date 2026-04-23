import { useEffect, useState, useRef } from "react";
import { MapPin, Navigation, Phone, Bike } from "lucide-react";
import { getDeliveryEta } from "@/utils/deliveryEta";

interface LiveTrackingMapProps {
  agentLat: number;
  agentLng: number;
  customerLat: number;
  customerLng: number;
  agentName: string;
  agentPhone: string;
}

const LiveTrackingMap = ({
  agentLat,
  agentLng,
  customerLat,
  customerLng,
  agentName,
  agentPhone,
}: LiveTrackingMapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const prevAgentPos = useRef({ lat: agentLat, lng: agentLng });
  const smoothAgent = useRef({ lat: agentLat, lng: agentLng });
  const pulseRef = useRef(0);

  const etaInfo = getDeliveryEta(agentLat, agentLng, customerLat, customerLng);

  // Smooth interpolation of agent position
  useEffect(() => {
    prevAgentPos.current = { lat: smoothAgent.current.lat, lng: smoothAgent.current.lng };
  }, [agentLat, agentLng]);

  useEffect(() => {
    const container = canvasRef.current?.parentElement;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = dimensions.width * 2;
    canvas.height = dimensions.height * 2;
    ctx.scale(2, 2);

    const w = dimensions.width;
    const h = dimensions.height;

    // Compute bounds with padding
    const padding = 60;
    const minLat = Math.min(agentLat, customerLat);
    const maxLat = Math.max(agentLat, customerLat);
    const minLng = Math.min(agentLng, customerLng);
    const maxLng = Math.max(agentLng, customerLng);

    const latRange = maxLat - minLat || 0.005;
    const lngRange = maxLng - minLng || 0.005;

    const toX = (lng: number) => padding + ((lng - minLng) / lngRange) * (w - padding * 2);
    const toY = (lat: number) => h - padding - ((lat - minLat) / latRange) * (h - padding * 2);

    const draw = () => {
      // Smoothly interpolate agent position
      smoothAgent.current.lat += (agentLat - smoothAgent.current.lat) * 0.08;
      smoothAgent.current.lng += (agentLng - smoothAgent.current.lng) * 0.08;

      pulseRef.current += 0.03;
      const pulse = Math.sin(pulseRef.current) * 0.5 + 0.5;

      ctx.clearRect(0, 0, w, h);

      // Background
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, "#f8f9fa");
      bgGrad.addColorStop(1, "#e9ecef");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Draw subtle grid
      ctx.strokeStyle = "rgba(0,0,0,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const ax = toX(smoothAgent.current.lng);
      const ay = toY(smoothAgent.current.lat);
      const cx = toX(customerLng);
      const cy = toY(customerLat);

      // Draw dashed route line
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = "rgba(245, 158, 11, 0.5)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      // Curved path
      const midX = (ax + cx) / 2;
      const midY = (ay + cy) / 2 - 30;
      ctx.quadraticCurveTo(midX, midY, cx, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Animated dots along path
      const dotCount = 8;
      for (let i = 0; i < dotCount; i++) {
        const t = ((i / dotCount) + pulseRef.current * 0.1) % 1;
        const dotX = (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * midX + t * t * cx;
        const dotY = (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * midY + t * t * cy;
        const dotAlpha = 0.2 + t * 0.6;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${dotAlpha})`;
        ctx.fill();
      }

      // Customer marker - red pin with pulse
      const custPulseRadius = 20 + pulse * 12;
      ctx.beginPath();
      ctx.arc(cx, cy, custPulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(239, 68, 68, ${0.1 + pulse * 0.08})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Home icon in customer marker
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("📍", cx, cy - 1);

      // Customer label
      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Your Location", cx, cy + 26);

      // Agent marker - amber/yellow with pulse
      const agentPulseRadius = 22 + pulse * 14;
      ctx.beginPath();
      ctx.arc(ax, ay, agentPulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245, 158, 11, ${0.12 + pulse * 0.1})`;
      ctx.fill();

      // Agent outer ring
      ctx.beginPath();
      ctx.arc(ax, ay, 18, 0, Math.PI * 2);
      const agentGrad = ctx.createRadialGradient(ax, ay, 4, ax, ay, 18);
      agentGrad.addColorStop(0, "#f59e0b");
      agentGrad.addColorStop(1, "#d97706");
      ctx.fillStyle = agentGrad;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Bike icon in agent marker
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🛵", ax, ay);

      // Agent label
      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(agentName, ax, ay + 30);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationRef.current);
  }, [dimensions, agentLat, agentLng, customerLat, customerLng, agentName]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bike className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">{agentName}</p>
            <p className="text-xs text-muted-foreground">Delivery Partner</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live
          </span>
          <a
            href={`tel:${agentPhone}`}
            className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
          >
            <Phone className="w-3 h-3" />
            Call
          </a>
        </div>
      </div>

      {/* Visual Map */}
      <div className="relative w-full h-56 rounded-xl overflow-hidden border border-border shadow-sm">
        <div className="absolute inset-0">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ imageRendering: "auto" }}
          />
        </div>
      </div>

      {/* ETA Bar */}
      {etaInfo && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">Arriving in {etaInfo.eta}</p>
            <p className="text-xs text-muted-foreground">
              {etaInfo.distance} km away • Updates every 5 seconds
            </p>
          </div>
        </div>
      )}

      {/* Agent contact card */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
          🛵
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{agentName}</p>
          <p className="text-xs text-muted-foreground">Your delivery partner</p>
        </div>
        <a
          href={`tel:${agentPhone}`}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shrink-0"
        >
          <Phone className="w-4 h-4" />
        </a>
      </div>

      {/* Open in Google Maps */}
      <a
        href={`https://www.google.com/maps/dir/${agentLat},${agentLng}/${customerLat},${customerLng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-secondary/50 transition-colors"
      >
        <MapPin className="w-4 h-4" />
        Open in Google Maps
      </a>
    </div>
  );
};

export default LiveTrackingMap;
