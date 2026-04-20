import { BarChart3, Clock3, FileText, Home, LogOut, Settings, Shield, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: Home, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: BarChart3 },
  { to: "/admin/documents", label: "Documents", icon: FileText },
  { to: "/admin/activity", label: "Activity Log", icon: Clock3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const AdminLayout = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-border bg-card lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <NavLink to="/admin" end className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="font-heading text-2xl font-light leading-none gold-gradient-text">RinVita</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.25em] text-primary">Admin</p>
              </div>
            </NavLink>

            <NavLink to="/app" className="rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              Member app
            </NavLink>
          </div>

          <div className="border-b border-border px-5 py-4">
            <div className="rounded-lg bg-secondary/70 px-3 py-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-primary">Admin mode</p>
              <p className="mt-1 text-sm text-foreground">{user?.email || "Owner account"}</p>
            </div>
          </div>

          <nav className="grid gap-1 p-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-3 lg:mt-auto">
            <button
              onClick={() => void signOut()}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;