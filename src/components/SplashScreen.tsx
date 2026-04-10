import { useEffect, useState } from "react";

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<"rings" | "logo" | "exit">("rings");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("logo"), 800);
    const t2 = setTimeout(() => setPhase("exit"), 2200);
    const t3 = setTimeout(onComplete, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background ${phase === "exit" ? "animate-fade-out" : ""}`}
    >
      {/* Concentric rings */}
      <div className="absolute">
        <div className="w-40 h-40 rounded-full border border-gold-muted animate-ring-pulse" />
      </div>
      <div className="absolute">
        <div className="w-56 h-56 rounded-full border border-gold-muted/50 animate-ring-pulse-delayed" />
      </div>
      <div className="absolute">
        <div className="w-72 h-72 rounded-full border border-gold-muted/30 animate-ring-pulse-delayed-2" />
      </div>

      {/* Logo */}
      <div className={`relative z-10 text-center ${phase !== "rings" ? "animate-fade-in-up" : "opacity-0"}`}>
        <h1 className="font-heading text-5xl font-light tracking-[0.3em] gold-gradient-text">
          VAULT
        </h1>
        <p className="mt-2 text-xs tracking-[0.25em] text-muted-foreground font-body uppercase">
          Health Intelligence
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
