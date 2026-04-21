import {
  LayoutDashboard, Droplets, ScanLine, Pill, FileText, Share2, CreditCard, Settings, LogOut, ChevronDown, User, FileDown, Users, Play, MoreHorizontal, ShieldAlert, Inbox, X
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "@/hooks/useLocale";

type Section = "overview" | "blood" | "imaging" | "media" | "medications" | "documents" | "share" | "billing" | "export" | "family";

const baseNavItems: { id: Section; labelKey: string; icon: React.ElementType; familyOnly?: boolean }[] = [
  { id: "overview", labelKey: "sidebar.overview", icon: LayoutDashboard },
  { id: "blood", labelKey: "sidebar.blood", icon: Droplets },
  { id: "imaging", labelKey: "sidebar.imaging", icon: ScanLine },
  { id: "media", labelKey: "sidebar.media", icon: Play },
  { id: "medications", labelKey: "sidebar.medications", icon: Pill },
  { id: "documents", labelKey: "sidebar.documents", icon: FileText },
  { id: "export", labelKey: "sidebar.export", icon: FileDown },
  { id: "share", labelKey: "sidebar.share", icon: Share2 },
  { id: "family", labelKey: "sidebar.family", icon: Users, familyOnly: true },
  { id: "billing", labelKey: "sidebar.billing", icon: CreditCard },
];

// Primary mobile items (always visible at the bottom). Order matters.
const mobilePrimary: Section[] = ["overview", "blood", "imaging", "documents"];

// Items that live inside the mobile "More" sheet (in display order).
type SheetAction =
  | { kind: "section"; id: Section; labelKey: string; icon: React.ElementType; familyOnly?: boolean }
  | { kind: "route"; route: string; labelKey: string; icon: React.ElementType }
  | { kind: "callback"; callback: "requestRecords"; labelKey: string; icon: React.ElementType };

const mobileMoreItems: SheetAction[] = [
  { kind: "section", id: "medications", labelKey: "sidebar.medications", icon: Pill },
  { kind: "section", id: "medications", labelKey: "sidebar.allergies", icon: ShieldAlert },
  { kind: "section", id: "media", labelKey: "sidebar.media", icon: Play },
  { kind: "section", id: "family", labelKey: "sidebar.family", icon: Users, familyOnly: true },
  { kind: "section", id: "share", labelKey: "sidebar.share", icon: Share2 },
  { kind: "callback", callback: "requestRecords", labelKey: "sidebar.requestRecords", icon: Inbox },
  { kind: "section", id: "export", labelKey: "sidebar.export", icon: FileDown },
  { kind: "section", id: "billing", labelKey: "sidebar.billing", icon: CreditCard },
  { kind: "route", route: "/app/settings", labelKey: "sidebar.settings", icon: Settings },
];

interface SidebarProps {
  active: Section;
  onNavigate: (s: Section) => void;
  onRequestRecords?: () => void;
}

const Sidebar = ({ active, onNavigate, onRequestRecords }: SidebarProps) => {
  const isMobile = useIsMobile();
  const { profile, signOut, user } = useAuth();
  const { t } = useLocale();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const plan = profile?.plan || "free";
  const planLabels: Record<string, string> = {
    free: t("sidebar.free"),
    standard: t("sidebar.standard"),
    family: t("sidebar.familyPlan"),
  };

  const navItems = baseNavItems.filter((item) => !item.familyOnly || plan === "family");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Lock body scroll while More sheet is open
  useEffect(() => {
    if (!moreOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [moreOpen]);

  const handleSheetAction = (item: SheetAction) => {
    setMoreOpen(false);
    if (item.kind === "section") {
      onNavigate(item.id);
    } else if (item.kind === "route") {
      nav(item.route);
    } else if (item.kind === "callback") {
      if (item.callback === "requestRecords") onRequestRecords?.();
    }
  };

  if (isMobile) {
    const primaryItems = navItems.filter((item) => mobilePrimary.includes(item.id))
      // sort to match the mobilePrimary order
      .sort((a, b) => mobilePrimary.indexOf(a.id) - mobilePrimary.indexOf(b.id));
    const sheetItems = mobileMoreItems.filter((it) => !(it.kind === "section" && it.familyOnly && plan !== "family"));
    const moreActive = !mobilePrimary.includes(active);

    return (
      <>
        {/* Top header */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-card border-b border-border flex items-center justify-between px-4 py-2.5">
          <div>
            <h1 className="font-heading text-lg font-light tracking-[0.15em] gold-gradient-text">RinVita</h1>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-heading font-semibold">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
              ) : initials}
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-10 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-medium text-foreground">{displayName}</p>
                  <p className="text-[10px] text-muted-foreground">{planLabels[plan]}</p>
                </div>
                <button onClick={() => { nav("/app/profile"); setDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> {t("sidebar.viewProfile")}
                </button>
                <button onClick={() => { nav("/app/settings"); setDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5" /> {t("sidebar.settings")}
                </button>
                <button onClick={() => { signOut(); setDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-destructive hover:bg-muted flex items-center gap-2">
                  <LogOut className="w-3.5 h-3.5" /> {t("sidebar.signOut")}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Bottom nav — exactly 5 items */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border grid grid-cols-5"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
          aria-label="Primary navigation"
        >
          {primaryItems.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[10px] transition-colors ${
                  isActive ? "text-primary font-medium" : "text-muted-foreground active:text-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                <span className="leading-tight">{t(item.labelKey).split(" ")[0]}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[10px] transition-colors ${
              moreActive ? "text-primary font-medium" : "text-muted-foreground active:text-foreground"
            }`}
          >
            <MoreHorizontal className={`w-5 h-5 ${moreActive ? "text-primary" : ""}`} />
            <span className="leading-tight">{t("sidebar.more")}</span>
          </button>
        </nav>

        {/* More bottom sheet */}
        {moreOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-end"
            style={{ display: "flex" }}
            role="dialog"
            aria-modal="true"
            aria-label={t("sidebar.moreOptions")}
          >
            <div
              className="absolute inset-0 bg-foreground/30 backdrop-blur-sm animate-fade-in"
              onClick={() => setMoreOpen(false)}
            />
            <div
              className="relative w-full max-h-[85vh] overflow-auto rounded-t-2xl border-t border-x border-primary/15 shadow-2xl"
              style={{
                backgroundColor: "#F6F2E9",
                animation: "rinvita-sheet-up 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
                paddingBottom: "max(env(safe-area-inset-bottom), 16px)",
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-2.5 pb-1">
                <div className="w-10 h-1 rounded-full bg-foreground/15" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-2 pb-3">
                <h3 className="font-heading text-2xl text-foreground" style={{ color: "#1f2937" }}>
                  {t("sidebar.moreOptions")}
                </h3>
                <button
                  onClick={() => setMoreOpen(false)}
                  aria-label={t("common.close") || "Close"}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="h-px mx-5" style={{ backgroundColor: "rgba(184,149,42,0.18)" }} />

              {/* Items grid */}
              <ul className="px-3 py-3 grid grid-cols-1 gap-1">
                {sheetItems.map((item, idx) => {
                  const isActive =
                    item.kind === "section" && active === item.id;
                  const Icon = item.icon;
                  return (
                    <li key={`${item.kind}-${idx}`}>
                      <button
                        onClick={() => handleSheetAction(item)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors min-h-[52px] active:bg-foreground/5"
                        style={isActive ? { backgroundColor: "rgba(184,149,42,0.12)" } : undefined}
                      >
                        <span
                          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: "rgba(184,149,42,0.12)", color: "#B8952A" }}
                        >
                          <Icon className="w-[18px] h-[18px]" />
                        </span>
                        <span
                          className="text-[15px] font-medium"
                          style={{ color: isActive ? "#B8952A" : "#1f2937" }}
                        >
                          {t(item.labelKey)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <aside className="w-52 min-h-screen bg-card border-r border-border flex flex-col">
      <div className="p-5 border-b border-border">
        <h1 className="font-heading text-2xl font-light tracking-[0.15em] gold-gradient-text">RinVita</h1>
        <p className="text-[10px] tracking-[0.15em] text-muted-foreground mt-0.5">Your health history. Everywhere you go.</p>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all ${isActive ? "bg-sidebar-accent text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
              <item.icon className="w-4 h-4" />
              {t(item.labelKey)}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border relative" ref={dropdownRef}>
        <button onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-[10px] font-heading font-semibold overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
            ) : initials}
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-medium text-foreground truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground">{planLabels[plan]}</p>
          </div>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>

        {dropdownOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
            <button onClick={() => { nav("/app/profile"); setDropdownOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> {t("sidebar.viewProfile")}
            </button>
            <button onClick={() => { nav("/app/settings"); setDropdownOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" /> {t("sidebar.settings")}
            </button>
            <button onClick={() => { signOut(); setDropdownOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-destructive hover:bg-muted flex items-center gap-2">
              <LogOut className="w-3.5 h-3.5" /> {t("sidebar.signOut")}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
