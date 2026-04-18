import {
  LayoutDashboard, Droplets, ScanLine, Pill, FileText, Share2, CreditCard, Settings, LogOut, ChevronDown, User, FileDown, Users, Play
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type Section = "overview" | "blood" | "imaging" | "media" | "medications" | "documents" | "share" | "billing" | "export" | "family";

const baseNavItems: { id: Section; label: string; icon: React.ElementType; familyOnly?: boolean }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "blood", label: "Blood Results", icon: Droplets },
  { id: "imaging", label: "Imaging", icon: ScanLine },
  { id: "media", label: "Media", icon: Play },
  { id: "medications", label: "Medications", icon: Pill },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "export", label: "Export", icon: FileDown },
  { id: "share", label: "Share Brief", icon: Share2 },
  { id: "family", label: "Family", icon: Users, familyOnly: true },
  { id: "billing", label: "Subscription", icon: CreditCard },
];

const mobileNavItems: Section[] = ["overview", "blood", "media", "documents", "export"];

const planLabels: Record<string, string> = {
  free: "Free Trial",
  standard: "Standard Plan",
  family: "Family Plan",
};

const Sidebar = ({ active, onNavigate }: { active: Section; onNavigate: (s: Section) => void }) => {
  const isMobile = useIsMobile();
  const { profile, signOut, user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const plan = profile?.plan || "free";

  const navItems = baseNavItems.filter((item) => !item.familyOnly || plan === "family");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (isMobile) {
    const mobileItems = navItems.filter((item) => mobileNavItems.includes(item.id));
    return (
      <>
        <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border flex items-center justify-between px-4 py-2.5">
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
                <button onClick={() => { nav("/profile"); setDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> View Profile
                </button>
                <button onClick={() => { nav("/settings"); setDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5" /> Settings
                </button>
                <button onClick={() => { signOut(); setDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs text-destructive hover:bg-muted flex items-center gap-2">
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around px-1 py-2">
          {mobileItems.map((item) => {
            const isActive = active === item.id;
            return (
              <button key={item.id} onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] transition-colors ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                {item.label.split(" ")[0]}
              </button>
            );
          })}
        </nav>
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
              {item.label}
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
            <button onClick={() => { nav("/profile"); setDropdownOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> View Profile
            </button>
            <button onClick={() => { nav("/settings"); setDropdownOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" /> Settings
            </button>
            <button onClick={() => { signOut(); setDropdownOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-destructive hover:bg-muted flex items-center gap-2">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
