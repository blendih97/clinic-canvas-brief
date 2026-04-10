import { FileText, AlertTriangle, Globe, Pill, AlertCircle, TrendingUp } from "lucide-react";
import { kpiData, timelineEvents, alerts } from "@/data/mockData";

const statusColors = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  flagged: "bg-primary/10 text-primary border-primary/20",
};

const typeIcons: Record<string, string> = {
  blood: "🩸",
  imaging: "📷",
  prescription: "💊",
};

const OverviewSection = () => {
  const kpis = [
    { label: "Total Records", value: kpiData.totalRecords, icon: FileText, accent: false },
    { label: "Active Flags", value: kpiData.activeFlags, icon: AlertTriangle, accent: true },
    { label: "Countries", value: kpiData.countries, icon: Globe, accent: false },
    { label: "Medications", value: kpiData.activeMedications, icon: Pill, accent: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-3xl font-light text-cream">Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">Your health intelligence at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <kpi.icon className={`w-4 h-4 ${kpi.accent ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-[10px] tracking-wider text-muted-foreground uppercase">{kpi.label}</span>
            </div>
            <p className={`font-heading text-4xl font-light ${kpi.accent ? "text-primary" : "text-cream"}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* AI Alerts */}
        <div className="col-span-2 bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-primary" />
            <h3 className="font-heading text-lg text-cream">AI Intelligence Alerts</h3>
          </div>
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <div key={i} className={`p-3 rounded border text-xs leading-relaxed ${statusColors[alert.type]}`}>
                {alert.message}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="col-span-3 bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="font-heading text-lg text-cream">Health Timeline</h3>
          </div>
          <div className="space-y-0">
            {timelineEvents.map((event, i) => (
              <div key={i} className="flex gap-4 group">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm">
                    {typeIcons[event.type]}
                  </div>
                  {i < timelineEvents.length - 1 && <div className="w-px flex-1 bg-border" />}
                </div>
                <div className="pb-5">
                  <p className="text-xs text-muted-foreground">{event.date}</p>
                  <p className="text-sm font-medium text-cream">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{event.detail}</p>
                  <p className="text-[10px] text-gold-light mt-0.5">{event.facility}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;
