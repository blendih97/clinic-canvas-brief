import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PageView {
  id: string;
  session_id: string | null;
  user_id: string | null;
  path: string;
  referrer: string | null;
  user_agent: string | null;
  created_at: string;
}

const AdminVisitorsPage = () => {
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState<PageView[]>([]);
  const [stats, setStats] = useState({ total24h: 0, sessions24h: 0, total7d: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [recent, last24h, last7d] = await Promise.all([
          supabase.from("page_views").select("*").order("created_at", { ascending: false }).limit(100),
          supabase.from("page_views").select("session_id", { count: "exact" }).gte("created_at", since24h),
          supabase.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", since7d),
        ]);

        if (recent.data) setViews(recent.data as PageView[]);

        const sessions24h = new Set(
          (last24h.data || []).map((r: any) => r.session_id).filter(Boolean),
        ).size;
        setStats({
          total24h: last24h.count || 0,
          sessions24h,
          total7d: last7d.count || 0,
        });
      } catch (e) {
        toast.error("Could not load visitor activity");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const topPages = Object.entries(
    views.reduce<Record<string, number>>((acc, v) => {
      acc[v.path] = (acc[v.path] || 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-primary">Visitor activity</p>
        <h1 className="mt-2 font-heading text-4xl font-light text-foreground">Site traffic</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Real-time visitor flows captured from page views across the marketing site and app.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Page views (24h)</CardTitle></CardHeader>
          <CardContent className="font-heading text-3xl font-light">{loading ? "—" : stats.total24h}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Unique sessions (24h)</CardTitle></CardHeader>
          <CardContent className="font-heading text-3xl font-light">{loading ? "—" : stats.sessions24h}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Page views (7d)</CardTitle></CardHeader>
          <CardContent className="font-heading text-3xl font-light">{loading ? "—" : stats.total7d}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Top pages (last 100 views)</CardTitle></CardHeader>
        <CardContent>
          {topPages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No page views yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Path</TableHead><TableHead className="text-right">Views</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {topPages.map(([path, count]) => (
                  <TableRow key={path}>
                    <TableCell className="font-mono text-xs">{path}</TableCell>
                    <TableCell className="text-right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent page views</CardTitle></CardHeader>
        <CardContent>
          {views.length === 0 ? (
            <p className="text-sm text-muted-foreground">No visits recorded yet.</p>
          ) : (
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Session</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {views.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(v.created_at).toLocaleString("en-GB")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{v.path}</TableCell>
                      <TableCell className="max-w-[240px] truncate text-xs text-muted-foreground">
                        {v.referrer || "direct"}
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground">
                        {v.session_id?.slice(0, 8) || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminVisitorsPage;
