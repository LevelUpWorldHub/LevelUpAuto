import React from "react";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { StatCard, Card, CardHeader, CardTitle, CardContent, StatusBadge, SectionHeader, SkeletonCard, EmptyState, Dot, Badge } from "@/components/ui-elements";
import { cn } from "@/components/ui-elements";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  FileText, Wrench, Truck, Car, Activity, TrendingUp, Clock,
  ShieldCheck, Cpu, Scan, Zap, BarChart3, AlertTriangle, CheckCircle,
  ArrowRight, DollarSign, Users, MapPin
} from "lucide-react";

const TESLA_TECH = [
  { name: "Tchek AI Vision",       desc: "Computer vision damage assessment",        icon: Scan,    color: "text-blue-400",   bg: "bg-blue-500/10"   },
  { name: "Tractable AI",          desc: "Deep learning repair estimation",           icon: Cpu,     color: "text-purple-400", bg: "bg-purple-500/10" },
  { name: "UVeye Underbody",       desc: "360° underbody damage detection",          icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { name: "Celette Naja 3D",       desc: "Laser structural measurement system",      icon: Zap,     color: "text-gold",       bg: "bg-gold/10"       },
  { name: "Car-O-Tronic Vision2",  desc: "OEM-certified frame alignment laser",      icon: BarChart3, color: "text-amber-400",  bg: "bg-amber-500/10"  },
  { name: "ADAS Calibration Suite","desc": "Full camera/sensor recalibration",       icon: ShieldCheck, color: "text-red-400", bg: "bg-red-500/10" },
];

const AI_INSIGHTS = [
  { severity: "critical", message: "Model 3 VIN 5YJ3E1EA - Autopilot camera calibration required post-repair", time: "2 min ago" },
  { severity: "warning",  message: "Claim CLM-001A2B approaching 30-day review deadline - adjuster action needed", time: "1 hr ago" },
  { severity: "info",     message: "Tractable AI estimated $4,850 damage — within 4% of manual adjuster estimate", time: "3 hr ago" },
  { severity: "success",  message: "WO-AAA001 structural repair passed Car-O-Tronic Vision2 OEM tolerances", time: "5 hr ago" },
];

function AiInsight({ severity, message, time }: { severity: string; message: string; time: string }) {
  const cfg = {
    critical: { cls: "border-l-red-500 bg-red-500/5",    dot: "red"  as const, badge: "badge-red" },
    warning:  { cls: "border-l-amber-500 bg-amber-500/5", dot: "amber" as const, badge: "badge-amber" },
    info:     { cls: "border-l-blue-500 bg-blue-500/5",   dot: "blue"  as const, badge: "badge-blue" },
    success:  { cls: "border-l-emerald-500 bg-emerald-500/5", dot: "green" as const, badge: "badge-green" },
  }[severity] ?? { cls: "border-l-border bg-muted/20", dot: "gold" as const, badge: "badge-silver" };

  return (
    <div className={cn("border-l-2 rounded-r-lg px-4 py-3 flex items-start gap-3", cfg.cls)}>
      <Dot color={cfg.dot} className="mt-1 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{message}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{time}</p>
      </div>
      <span className={cn("badge text-[10px] flex-shrink-0 capitalize", cfg.badge)}>{severity}</span>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useGetDashboardStats();

  const fname = user?.name?.split(" ")[0] ?? "there";
  const role = user?.role ?? "owner";

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-14 w-1/3 bg-muted/40 animate-pulse rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Total Claims",      value: stats?.totalClaims ?? 0,       sublabel: `${stats?.openClaims ?? 0} open`,      icon: FileText,    color: "blue"   as const },
    { label: "Work Orders",       value: stats?.totalWorkOrders ?? 0,   sublabel: `${stats?.activeWorkOrders ?? 0} active`, icon: Wrench,   color: "amber"  as const },
    { label: "Pending Tows",      value: stats?.pendingTowingJobs ?? 0, sublabel: "awaiting dispatch",                    icon: Truck,       color: "red"    as const },
    { label: "Active Rentals",    value: stats?.activeRentals ?? 0,     sublabel: "loaners in use",                       icon: Car,         color: "purple" as const },
  ];

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Welcome back</p>
          <h1 className="text-3xl font-display font-bold">
            <span className="text-gradient-gold">{fname}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {role === "owner"   && "Your Tesla portfolio status — all repairs, claims, and services at a glance."}
            {role === "shop"    && "Active repairs, AI diagnostics, and ADAS calibration queue."}
            {role === "insurer" && "Claims pipeline, adjuster queue, and CIECA/BMS integration status."}
            {role === "towing"  && "Dispatch board — active tow requests and driver assignments."}
            {role === "rental"  && "Loaner fleet status, bookings, and utilization metrics."}
            {role === "admin"   && "Full platform overview — all roles, all modules."}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Platform Live</span>
          <span className="text-border">·</span>
          <span>{format(new Date(), "MMM d, yyyy")}</span>
        </div>
      </motion.div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <StatCard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* Role-specific sections */}
      {role === "shop" && (
        <div className="space-y-6">
          {/* AI Tech Suite */}
          <div>
            <SectionHeader title="Tesla-Certified Repair Technology" icon={Cpu} />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {TESLA_TECH.map((tech, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                  <div className="card-4d p-4 flex items-start gap-3 hover:border-gold/25 transition-colors cursor-default">
                    <div className={cn("p-2 rounded-xl flex-shrink-0", tech.bg)}>
                      <tech.icon className={cn("w-4 h-4", tech.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{tech.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{tech.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div>
            <SectionHeader title="AI Diagnostic Insights" icon={Zap} />
            <div className="space-y-2">
              {AI_INSIGHTS.map((insight, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                  <AiInsight {...insight} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {role === "owner" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card variant="gold" className="overflow-hidden">
            <CardHeader><CardTitle className="text-gradient-gold flex items-center gap-2"><Car className="w-4 h-4" />Your Tesla Status</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-sm text-muted-foreground">Primary Vehicle</span>
                <span className="text-sm font-semibold">2023 Model 3 Pearl White</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-sm text-muted-foreground">Active Repair</span>
                <StatusBadge status="in-progress" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-sm text-muted-foreground">Open Claim</span>
                <span className="text-sm font-semibold text-gold">CLM-001A2B — $4,500 approved</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Loaner Vehicle</span>
                <StatusBadge status="active" />
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-emerald-300">Your vehicle is at our Tesla-certified facility. Estimated completion: March 28, 2026.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" />Open Items</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Claim CLM-002C3D under review",      status: "under-review" },
                { label: "Tow request for Model S pending",    status: "requested" },
                { label: "Rental RNT-R2C3D — awaiting assign", status: "requested" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-0">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {role === "insurer" && (
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: "Pending Approval",  value: stats?.openClaims ?? 0,    icon: Clock,         color: "amber" as const },
            { label: "Approved This Month", value: 3,                        icon: CheckCircle,   color: "green" as const },
            { label: "Avg Settlement",    value: "$4,717",                   icon: DollarSign,    color: "gold" as const },
          ].map((s, i) => <StatCard key={i} {...s} />)}
        </div>
      )}

      {(role === "towing" || role === "admin") && (
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: "Active Dispatches", value: stats?.pendingTowingJobs ?? 0, icon: Truck,   color: "amber" as const },
            { label: "Drivers Available", value: 4,                              icon: Users,   color: "green" as const },
            { label: "Avg Response Time", value: "18 min",                       icon: Clock,   color: "blue" as const },
          ].map((s, i) => <StatCard key={i} {...s} />)}
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <SectionHeader title="Recent Activity" icon={Activity} />
        <Card>
          {stats?.recentActivity?.length ? (
            <div className="divide-y divide-border/40">
              {stats.recentActivity.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-white/[0.015] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-lg bg-muted/50 flex-shrink-0">
                      {item.type === "claim"      && <FileText className="w-3.5 h-3.5 text-blue-400" />}
                      {item.type === "work-order" && <Wrench className="w-3.5 h-3.5 text-amber-400" />}
                      {item.type === "towing"     && <Truck className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{item.message}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{format(new Date(item.timestamp), "MMM d, h:mm a")}</p>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Activity} title="No recent activity" description="Actions will appear here as you use the platform." />
          )}
        </Card>
      </div>
    </div>
  );
}
