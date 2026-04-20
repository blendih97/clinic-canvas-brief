import { useEffect, useMemo, useState, type ElementType } from "react";
import { ArrowRight, FileText, PoundSterling, UserPlus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getAdminDashboardData,
  type AdminDashboardMetrics,
  type AdminRecentDocument,
  type AdminRecentSignup,
} from "@/lib/admin";

const metricConfig: Array<{
  key: keyof AdminDashboardMetrics;
  label: string;
  href: string;
  icon: ElementType;
  format?: (value: number) => string;
}> = [
  { key: "total_users", label: "Total users", href: "/admin/users", icon: Users },
  { key: "active_users", label: "Active users", href: "/admin/users", icon: UserPlus },
  { key: "trial_users", label: "Trial users", href: "/admin/users", icon: Users },
  { key: "paying_users", label: "Paying users", href: "/admin/subscriptions", icon: PoundSterling },
  {
    key: "mrr_gbp",
    label: "MRR",
    href: "/admin/subscriptions",
    icon: PoundSterling,
    format: (value) => `£${Number(value || 0).toFixed(2)}`,
  },
  { key: "churned_this_month", label: "Churn this month", href: "/admin/subscriptions", icon: Users },
];

const statusTone: Record<string, string> = {
  success: "bg-primary/10 text-primary",
  processed: "bg-primary/10 text-primary",
  pending: "bg-secondary text-secondary-foreground",
  processing: "bg-secondary text-secondary-foreground",
  failed: "bg-destructive/10 text-destructive",
};

const AdminDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AdminDashboardMetrics>({
    total_users: 0,
    active_users: 0,
    trial_users: 0,
    paying_users: 0,
    mrr_gbp: 0,
    churned_this_month: 0,
  });
  const [recentSignups, setRecentSignups] = useState<AdminRecentSignup[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<AdminRecentDocument[]>([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await getAdminDashboardData();
        if (!mounted) return;
        setMetrics(data.metrics);
        setRecentSignups(data.recentSignups);
        setRecentDocuments(data.recentDocuments);
      } catch (error) {
        toast.error("Could not load the admin dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const metricCards = useMemo(
    () =>
      metricConfig.map((item) => ({
        ...item,
        value: item.format ? item.format(Number(metrics[item.key] || 0)) : Intl.NumberFormat("en-GB").format(Number(metrics[item.key] || 0)),
      })),
    [metrics],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-primary">Admin dashboard</p>
          <h1 className="mt-2 font-heading text-4xl font-light text-foreground">Business overview</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Launch control for members, subscriptions, and document throughput.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Stripe metrics are currently estimated from plan status until payments are connected.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((card) => (
          <Link key={card.key} to={card.href} className="block">
            <Card className="h-full border-border transition-colors hover:border-primary/40">
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{card.label}</p>
                  <p className="mt-3 font-heading text-3xl font-light text-foreground">{loading ? "—" : card.value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <card.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr,1.25fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-xl font-medium">Recent signups</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Latest members joining RinVita.</p>
            </div>
            <Link to="/admin/users" className="text-sm text-primary hover:opacity-80">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Signup</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSignups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {loading ? "Loading recent signups…" : "No signups yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  recentSignups.map((signup) => (
                    <TableRow key={signup.user_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{signup.full_name || "Unnamed user"}</p>
                          <p className="text-xs text-muted-foreground">{signup.email || "No email"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{signup.plan}</TableCell>
                      <TableCell>{signup.country || "—"}</TableCell>
                      <TableCell>{new Date(signup.signup_date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-xl font-medium">Recent documents</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Newest uploads and processing state across the platform.</p>
            </div>
            <Link to="/admin/documents" className="text-sm text-primary hover:opacity-80">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {loading ? "Loading recent documents…" : "No documents uploaded yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  recentDocuments.map((document) => (
                    <TableRow key={document.document_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{document.user_name}</p>
                          <p className="text-xs text-muted-foreground">{document.document_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{document.document_type || "—"}</TableCell>
                      <TableCell>{document.original_language || "—"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs capitalize ${statusTone[document.processing_status] || "bg-secondary text-secondary-foreground"}`}>
                          {document.processing_status}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(document.upload_date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/admin/users" className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40">
          <p className="text-sm font-medium text-foreground">Member operations</p>
          <p className="mt-1 text-sm text-muted-foreground">Review accounts, plan state, and launch support actions.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm text-primary">Open users <ArrowRight className="h-4 w-4" /></span>
        </Link>
        <Link to="/admin/subscriptions" className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40">
          <p className="text-sm font-medium text-foreground">Revenue controls</p>
          <p className="mt-1 text-sm text-muted-foreground">Inspect MRR, churn, and payment readiness for launch.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm text-primary">Open subscriptions <ArrowRight className="h-4 w-4" /></span>
        </Link>
        <Link to="/admin/documents" className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40">
          <p className="text-sm font-medium text-foreground">Processing visibility</p>
          <p className="mt-1 text-sm text-muted-foreground">Track uploads, statuses, and failures from one place.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm text-primary">Open documents <FileText className="h-4 w-4" /></span>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboardPage;