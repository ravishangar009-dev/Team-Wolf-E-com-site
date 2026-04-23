import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import teamWolfLogo from "@/assets/teamwolf-logo.png";

interface SiteLockdownProps {
  reopenAt: string | null;
  message: string | null;
}

const SiteLockdown = ({ reopenAt, message }: SiteLockdownProps) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!reopenAt) return;

    const update = () => {
      const now = new Date().getTime();
      const target = new Date(reopenAt).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("");
        // Navigate to home and reload to check if site is back
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        } else {
          window.location.reload();
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(parts.join(" "));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [reopenAt]);

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-lg animate-fade-in">
        <div className="relative mx-auto w-32 h-32">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
          <img
            src={teamWolfLogo}
            alt="Team Wolf"
            className="relative w-32 h-32 opacity-60 grayscale rounded-full"
          />
          <div className="absolute -bottom-1 -right-1 bg-muted rounded-full p-2">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-outfit font-bold text-foreground">
            We'll Be Back Soon!
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {message || "We are currently on a break. We will be back soon!"}
          </p>
        </div>

        {timeLeft && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
              Coming back in
            </p>
            <div className="flex justify-center gap-3">
              {timeLeft.split(" ").map((part, i) => {
                const num = part.slice(0, -1);
                const label = part.slice(-1);
                const labelMap: Record<string, string> = {
                  d: "Days",
                  h: "Hours",
                  m: "Min",
                  s: "Sec",
                };
                return (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-xl p-3 min-w-[70px] shadow-sm"
                  >
                    <p className="text-2xl md:text-3xl font-bold font-outfit text-primary">
                      {num}
                    </p>
                    <p className="text-xs text-muted-foreground">{labelMap[label] || label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          🐺 Team Wolf Supplement — Fuel Your Beast Mode
        </p>
      </div>
    </div>
  );
};

export default SiteLockdown;
