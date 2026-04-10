import {
  LayoutDashboard, Droplets, ScanLine, Pill, FileText, Share2, CreditCard, Settings, LogOut
} from "lucide-react";

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

const Sidebar = ({ active, onNavigate }: { active: Section; onNavigate: (s: Section) => void }) => {
  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="font-heading text-2xl font-light tracking-[0.2em] gold-gradient-text">VAULT</h1>
        <p className="text-[10px] tracking-[0.2em] text-muted-foreground mt-0.5 uppercase">Health Intelligence</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-heading font-semibold">
            AH
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Alexander Hayes</p>
            <p className="text-[10px] text-muted-foreground">Professional Plan</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground py-1.5 rounded bg-secondary/30 transition-colors">
            <Settings className="w-3 h-3" /> Settings
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground py-1.5 rounded bg-secondary/30 transition-colors">
            <LogOut className="w-3 h-3" /> Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
