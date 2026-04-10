import {
  LayoutDashboard, Droplets, ScanLine, Pill, FileText, Share2, CreditCard, Settings, LogOut
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

type Section = "overview" | "blood" | "imaging" | "medications" | "documents" | "share" | "billing";

const navItems: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "blood", label: "Blood Results", icon: Droplets },
  { id: "imaging", label: "Imaging", icon: ScanLine },
  { id: "medications", label: "Medications", icon: Pill },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "share", label: "Share Brief", icon: Share2 },
  { id: "billing", label: "Subscription", icon: CreditCard },
];

const mobileNavItems = navItems.slice(0, 5);

const Sidebar = ({ active, onNavigate }: { active: Section; onNavigate: (s: Section) => void }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around px-1 py-2">
        {mobileNavItems.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] transition-colors ${
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              {item.label.split(" ")[0]}
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <aside className="w-52 min-h-screen bg-card border-r border-border flex flex-col">
      <div className="p-5 border-b border-border">
        <h1 className="font-heading text-2xl font-light tracking-[0.2em] gold-gradient-text">VAULT</h1>
        <p className="text-[10px] tracking-[0.2em] text-muted-foreground mt-0.5 uppercase">Health Intelligence</p>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all ${
                isActive
                  ? "bg-sidebar-accent text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-[10px] font-heading font-semibold">
            AH
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Alexander Hayes</p>
            <p className="text-[10px] text-muted-foreground">Professional Plan</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button className="flex-1 flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground py-1.5 rounded bg-muted transition-colors">
            <Settings className="w-3 h-3" /> Settings
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground py-1.5 rounded bg-muted transition-colors">
            <LogOut className="w-3 h-3" /> Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
