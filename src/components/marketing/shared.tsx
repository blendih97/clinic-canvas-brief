import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export const marketingColors = {
  cream: "hsl(var(--background))",
  cream2: "hsl(var(--secondary))",
  ink: "hsl(var(--foreground))",
  gold: "hsl(var(--primary))",
  goldSoft: "hsl(var(--primary) / 0.12)",
  goldBorder: "hsl(var(--primary) / 0.24)",
  goldStrong: "hsl(var(--primary) / 0.4)",
  mutedText: "hsl(var(--foreground) / 0.58)",
  softText: "hsl(var(--foreground) / 0.42)",
  faintText: "hsl(var(--foreground) / 0.3)",
  surface: "hsl(var(--card))",
  surfaceBorder: "hsl(var(--border))",
  success: "hsl(144 45% 38%)",
  successSoft: "hsl(144 45% 38% / 0.1)",
  successBorder: "hsl(144 45% 38% / 0.28)",
};

export function MarketingStyles() {
  return (
    <style>{`
      @keyframes marketing-fade-up {
        from { opacity: 0; transform: translateY(24px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes marketing-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      @keyframes marketing-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      @keyframes marketing-slide-down {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes marketing-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes marketing-pop-in {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes marketing-shimmer {
        0% { opacity: 0.3; }
        50% { opacity: 1; }
        100% { opacity: 0.3; }
      }
      @keyframes marketing-progress-bar {
        from { width: 0%; }
        to { width: 100%; }
      }
      .marketing-reveal {
        opacity: 0;
        transform: translateY(18px);
        transition: opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1);
      }
      .marketing-reveal.visible {
        opacity: 1;
        transform: translateY(0);
      }
      .marketing-section-label {
        display: block;
        margin-bottom: 12px;
        color: ${marketingColors.gold};
        font-size: 10px;
        font-weight: 500;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
      .marketing-page * {
        -webkit-tap-highlight-color: transparent;
      }
    `}</style>
  );
}

export function useMarketingBreakpoint() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    width,
    isMobile: width < 768,
    isTablet: width < 1024,
  };
}

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("visible");
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return ref;
}

export function LogoMark({ size = 26, color = marketingColors.gold }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <polygon points="14,2 26,9 26,19 14,26 2,19 2,9" stroke={color} strokeWidth="1.5" fill="none" />
      <polygon points="14,8 20,11.5 20,16.5 14,20 8,16.5 8,11.5" fill={color} opacity="0.2" />
      <circle cx="14" cy="14" r="2.5" fill={color} />
    </svg>
  );
}

type MarketingNavProps = {
  currentPage: "home" | "demo";
};

export function MarketingNav({ currentPage }: MarketingNavProps) {
  const { isMobile } = useMarketingBreakpoint();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "How it works", href: currentPage === "home" ? "#how-it-works" : "/#how-it-works" },
    { label: "Features", href: currentPage === "home" ? "#features" : "/#features" },
    { label: "Pricing", href: currentPage === "home" ? "#pricing" : "/#pricing" },
  ];

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          height: isMobile ? 60 : 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "0 20px" : "0 56px",
          background: scrolled || menuOpen ? "hsl(var(--background) / 0.97)" : "transparent",
          backdropFilter: scrolled || menuOpen ? "blur(20px)" : "none",
          borderBottom: scrolled ? `1px solid ${marketingColors.goldBorder}` : "1px solid transparent",
          transition: "all 0.35s ease",
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <LogoMark color={marketingColors.gold} size={isMobile ? 22 : 26} />
          <span
            style={{
              fontFamily: "Cormorant Garamond",
              fontSize: isMobile ? 20 : 22,
              fontWeight: 500,
              letterSpacing: "0.03em",
              color: marketingColors.ink,
            }}
          >
            RinVita
          </span>
        </Link>

        {!isMobile && (
          <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                style={{ fontSize: 14, color: marketingColors.mutedText, textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = marketingColors.ink;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = marketingColors.mutedText;
                }}
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/auth"
              style={{
                padding: "9px 22px",
                background: "transparent",
                border: `1px solid ${marketingColors.gold}`,
                borderRadius: 2,
                color: marketingColors.gold,
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.06em",
                cursor: "pointer",
                transition: "all 0.2s",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = marketingColors.gold;
                e.currentTarget.style.color = "hsl(var(--primary-foreground))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = marketingColors.gold;
              }}
            >
              Sign In
            </Link>
          </div>
        )}

        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              to="/auth?mode=signup"
              style={{
                padding: "8px 16px",
                background: marketingColors.gold,
                borderRadius: 2,
                color: "hsl(var(--primary-foreground))",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textDecoration: "none",
              }}
            >
              Start free trial
            </Link>
            <button
              onClick={() => setMenuOpen((open) => !open)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                flexDirection: "column",
                gap: 5,
              }}
              aria-label="Toggle menu"
            >
              <div style={{ width: 22, height: 1.5, background: marketingColors.ink, transition: "all 0.3s", transform: menuOpen ? "rotate(45deg) translate(4.5px,4.5px)" : "none" }} />
              <div style={{ width: 22, height: 1.5, background: marketingColors.ink, transition: "all 0.3s", opacity: menuOpen ? 0 : 1 }} />
              <div style={{ width: 22, height: 1.5, background: marketingColors.ink, transition: "all 0.3s", transform: menuOpen ? "rotate(-45deg) translate(4.5px,-4.5px)" : "none" }} />
            </button>
          </div>
        )}
      </nav>

      {isMobile && menuOpen && (
        <div
          style={{
            position: "fixed",
            top: 60,
            left: 0,
            right: 0,
            zIndex: 190,
            background: "hsl(var(--background) / 0.98)",
            backdropFilter: "blur(20px)",
            borderBottom: `1px solid ${marketingColors.goldBorder}`,
            padding: "8px 0 20px",
            animation: "marketing-slide-down 0.25s ease",
          }}
        >
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: "block",
                padding: "14px 24px",
                fontSize: 18,
                fontFamily: "Cormorant Garamond",
                color: marketingColors.ink,
                textDecoration: "none",
                borderBottom: `1px solid hsl(var(--foreground) / 0.06)`,
              }}
            >
              {link.label}
            </a>
          ))}
          <div style={{ padding: "16px 24px 0" }}>
            <Link
              to="/auth"
              onClick={() => setMenuOpen(false)}
              style={{
                width: "100%",
                display: "block",
                padding: "14px",
                background: "transparent",
                border: `1px solid ${marketingColors.goldBorder}`,
                borderRadius: 2,
                color: marketingColors.gold,
                fontSize: 14,
                fontWeight: 500,
                textAlign: "center",
                letterSpacing: "0.06em",
                textDecoration: "none",
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

export function MarketingFooter() {
  const { isMobile, isTablet } = useMarketingBreakpoint();
  const paddingX = isMobile ? 20 : isTablet ? 32 : 56;

  const productLinks = [
    { label: "How it works", href: "/#how-it-works" },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Watch demo", href: "/demo" },
  ];

  const legalLinks = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ];

  return (
    <footer
      style={{
        background: marketingColors.cream2,
        borderTop: `1px solid ${marketingColors.goldBorder}`,
        padding: `${isMobile ? 48 : 64}px ${paddingX}px ${isMobile ? 36 : 40}px`,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: isMobile ? 36 : 0,
            marginBottom: isMobile ? 36 : 56,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
              <LogoMark size={22} color={marketingColors.gold} />
              <span style={{ fontFamily: "Cormorant Garamond", fontSize: 20, fontWeight: 500, color: marketingColors.ink, letterSpacing: "0.03em" }}>
                RinVita
              </span>
            </div>
            <p style={{ fontFamily: "Cormorant Garamond", fontSize: 16, fontStyle: "italic", color: marketingColors.mutedText, marginBottom: 16 }}>
              Your medical history, finally in one place.
            </p>
            <div style={{ fontSize: 11, color: marketingColors.softText, letterSpacing: "0.04em", lineHeight: 1.7 }}>
              ICO Registration: ZC123014
              <br />
              Registered in England & Wales
            </div>
          </div>

          <div style={{ display: "flex", gap: isMobile ? 40 : 80 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.1em", color: marketingColors.gold, marginBottom: 16, fontWeight: 500 }}>PRODUCT</div>
              {productLinks.map((link) => (
                <div key={link.label} style={{ marginBottom: 10 }}>
                  <a href={link.href} style={{ fontSize: 14, color: marketingColors.mutedText, textDecoration: "none" }}>
                    {link.label}
                  </a>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.1em", color: marketingColors.gold, marginBottom: 16, fontWeight: 500 }}>LEGAL</div>
              {legalLinks.map((link) => (
                <div key={link.label} style={{ marginBottom: 10 }}>
                  <Link to={link.href} style={{ fontSize: 14, color: marketingColors.mutedText, textDecoration: "none" }}>
                    {link.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: `1px solid hsl(var(--foreground) / 0.08)`,
            paddingTop: 24,
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            gap: isMobile ? 6 : 0,
          }}
        >
          <div style={{ fontSize: 12, color: marketingColors.faintText }}>© 2026 RinVita Ltd. All rights reserved.</div>
          <div style={{ fontSize: 12, color: marketingColors.faintText }}>Made with care for the internationally mobile</div>
        </div>
      </div>
    </footer>
  );
}
