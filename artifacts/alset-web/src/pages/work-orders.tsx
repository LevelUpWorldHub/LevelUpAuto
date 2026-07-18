import React, { useState } from "react";
import { useListWorkOrders, useCreateWorkOrder, useUpdateWorkOrder, useListVehicles, UpdateWorkOrderBodyStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Modal, FormField, Input, Select, Textarea, StatusBadge, StatCard, SectionHeader, EmptyState, SkeletonCard, Badge, ProgressBar } from "@/components/ui-elements";
import { cn } from "@/components/ui-elements";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Plus, Wrench, Cpu, Scan, Zap, BarChart3, CheckCircle, Clock, DollarSign, User, AlertTriangle, Shield, Activity, ChevronDown, ChevronUp, Camera, Radio, Satellite } from "lucide-react";

// ─── Repair tech data ────────────────────────────────────────────────────────

const AI_DIAG_TOOLS = [
  { name: "Tractable AI",    subtitle: "Damage estimation",    confidence: 94, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { name: "Tchek AI Vision", subtitle: "Photo-based analysis", confidence: 91, color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
  { name: "UVeye Scanner",   subtitle: "Under-vehicle scan",   confidence: 88, color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20" },
];

const FRAME_TOOLS = [
  { name: "Celette NAJA 3D",      status: "Digital Twin Active", icon: Satellite, color: "text-gold",        bg: "bg-gold/10",         border: "border-gold/20" },
  { name: "Car-O-Tronic Vision2", status: "Measured",            icon: Scan,      color: "text-blue-400",   bg: "bg-blue-500/10",     border: "border-blue-500/20" },
  { name: "Eagle Laser Systems",  status: "Ready",               icon: Zap,       color: "text-amber-400",  bg: "bg-amber-500/10",    border: "border-amber-500/20" },
];

const ADAS_SENSORS = [
  { sensor: "Autopilot Camera System",  status: "pending" },
  { sensor: "Ultrasonic Sensor Array",  status: "calibrated" },
  { sensor: "Forward Radar Module",     status: "calibrated" },
  { sensor: "Autopilot Side Cameras",   status: "pending" },
  { sensor: "Reverse Camera",           status: "not-required" },
  { sensor: "FSD Vision Processor",     status: "pending" },
];

const REPAIR_MATERIALS  = ["Tesla OEM Panel", "PPG Envirobase Primer", "Waterborne Basecoat", "High-Solid Clear"];
const REPAIR_TECHNIQUES = ["SMART Repair", "3D Frame Alignment", "ADAS Post-Repair", "Color Spectrometer Match"];

const STATUS_STEPS = ["pending", "assigned", "in-progress", "awaiting-parts", "completed"];

function StepBar({ status }: { status: string }) {
  const idx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 w-full">
      {STATUS_STEPS.map((s, i) => (
        <div key={s} className={cn("h-1 flex-1 rounded-full transition-all duration-500",
          i < idx  ? "bg-gold" : i === idx ? "bg-gold/70" : "bg-muted")} />
      ))}
    </div>
  );
}

function RepairTechPanel() {
  return (
    <div className="space-y-4 pt-2">
      {/* AI Damage Diagnostics */}
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">AI Damage Diagnostics</p>
        <div className="grid grid-cols-3 gap-2">
          {AI_DIAG_TOOLS.map(t => (
            <div key={t.name} className={cn("p-2.5 rounded-xl border text-center", t.bg, t.border)}>
              <p className={cn("text-[11px] font-bold leading-tight", t.color)}>{t.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t.subtitle}</p>
              <div className="mt-2">
                <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className={cn("h-full rounded-full", t.bg.replace("/10","/60"))} style={{ width: `${t.confidence}%` }} />
                </div>
                <p className={cn("text-[11px] font-bold mt-1", t.color)}>{t.confidence}% confidence</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frame Measurement */}
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Frame Measurement & Alignment</p>
        <div className="grid grid-cols-3 gap-2">
          {FRAME_TOOLS.map(t => {
            const Icon = t.icon;
            return (
              <div key={t.name} className={cn("p-2.5 rounded-xl border flex flex-col items-center text-center gap-1.5", t.bg, t.border)}>
                <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", t.bg)}>
                  <Icon className={cn("w-3.5 h-3.5", t.color)} />
                </div>
                <p className={cn("text-[11px] font-bold leading-tight", t.color)}>{t.name}</p>
                <span className={cn("text-[10px] font-semibold", t.color)}>{t.status}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADAS Calibration */}
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">ADAS / Autopilot Calibration</p>
        <div className="grid grid-cols-2 gap-1.5">
          {ADAS_SENSORS.map(s => (
            <div key={s.sensor} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-muted/20 border border-border/30">
              <span className="text-[11px] text-foreground truncate pr-1">{s.sensor}</span>
              <span className={cn("text-[10px] font-bold flex-shrink-0",
                s.status === "calibrated"    ? "text-emerald-400" :
                s.status === "pending"       ? "text-gold" :
                                               "text-muted-foreground"
              )}>
                {s.status === "calibrated" ? "✓ Done" : s.status === "pending" ? "Pending" : "N/A"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Materials & Techniques */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Repair Materials</p>
          <div className="flex flex-wrap gap-1">
            {REPAIR_MATERIALS.map(m => (
              <span key={m} className="text-[10px] px-2 py-0.5 rounded-full border border-gold/25 text-gold/80 bg-gold/5">{m}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Techniques</p>
          <div className="flex flex-wrap gap-1">
            {REPAIR_TECHNIQUES.map(t => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-white/50 bg-white/[0.04]">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WoCard({ order, onComplete, canAct, isShop }: { order: any; onComplete: (id: number) => void; canAct: boolean; isShop: boolean }) {
  const [techOpen, setTechOpen] = useState(false);
  const laborCost = (order.laborHours ?? 0) * (order.laborRate ?? 185);
  const parts  = order.partsTotal ?? 0;
  const total  = order.totalCost ?? (laborCost + parts);

  return (
    <Card variant={order.status === "completed" ? "default" : "gold"} className="overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-border/50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-bold font-mono text-gold">{order.workOrderNumber}</span>
              {order.claimId && <span className="badge badge-blue text-[10px]">Claim #{order.claimId}</span>}
            </div>
            <p className="text-sm text-muted-foreground">{order.vehicleModel ?? `Vehicle #${order.vehicleId}`}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="mt-3"><StepBar status={order.status} /></div>
      </div>

      {/* Body */}
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground leading-relaxed">{order.description}</p>

        <div className="grid grid-cols-3 gap-2 text-xs">
          {[
            { label: "Labor Hrs", value: order.laborHours ?? "—" },
            { label: "Parts",     value: parts  ? `$${Number(parts).toLocaleString()}` : "—" },
            { label: "Total Est", value: total  ? `$${Number(total).toLocaleString()}` : "—" },
          ].map(f => (
            <div key={f.label} className="p-2.5 rounded-lg bg-muted/25 border border-border/40 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{f.label}</p>
              <p className="font-bold text-foreground">{f.value}</p>
            </div>
          ))}
        </div>

        {order.technicianName && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Technician: <span className="text-foreground font-medium">{order.technicianName}</span></span>
          </div>
        )}

        {order.startDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Started: {format(new Date(order.startDate), "MMM d, yyyy")}</span>
            {order.completionDate && <><span>·</span><span>Est. complete: {format(new Date(order.completionDate), "MMM d, yyyy")}</span></>}
          </div>
        )}

        {order.notes && (
          <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
            <p className="text-xs text-muted-foreground leading-relaxed">{order.notes}</p>
          </div>
        )}

        {/* ADAS warning banner */}
        {["in-progress","assigned"].includes(order.status) && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-300">ADAS Calibration Required</p>
              <p className="text-[11px] text-amber-300/70 mt-0.5">Autopilot cameras must be recalibrated after structural repair per Tesla certified guidelines.</p>
            </div>
          </div>
        )}

        {/* Repair Technology toggle — shop/admin only */}
        {isShop && (
          <div>
            <button
              onClick={() => setTechOpen(t => !t)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gold/5 hover:bg-gold/10 border border-gold/15 hover:border-gold/25 transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-gold" />
                <span className="text-xs font-semibold text-gold">AI Repair Technology</span>
                <span className="badge badge-gold text-[10px] py-0 px-2">Tesla Certified</span>
              </div>
              {techOpen ? <ChevronUp className="w-3.5 h-3.5 text-gold" /> : <ChevronDown className="w-3.5 h-3.5 text-gold/60" />}
            </button>
            <AnimatePresence>
              {techOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden mt-2"
                >
                  <div className="p-3 rounded-xl bg-muted/15 border border-border/40">
                    <RepairTechPanel />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>

      {canAct && order.status !== "completed" && order.status !== "cancelled" && (
        <CardFooter className="flex items-center justify-between gap-3">
          {order.status === "assigned" && (
            <Button size="sm" variant="outline">Start Repair</Button>
          )}
          {order.status === "in-progress" && (
            <Button size="sm" variant="outline">Awaiting Parts</Button>
          )}
          <Button size="sm" className="ml-auto" onClick={() => onComplete(order.id)}>
            <CheckCircle className="w-3.5 h-3.5" /> Complete
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default function WorkOrders() {
  const { user } = useAuth();
  const { data: orders, isLoading } = useListWorkOrders();
  const { data: vehicles } = useListVehicles();
  const createMutation = useCreateWorkOrder();
  const updateMutation = useUpdateWorkOrder();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ vehicleId: "", description: "", laborHours: "", partsTotal: "", startDate: "" });
  const [activeTab, setActiveTab] = useState<"all" | "active" | "pending" | "completed">("all");

  const role     = user?.role ?? "owner";
  const isShop   = role === "shop" || role === "admin";
  const canCreate = isShop;
  const canAct    = isShop;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        vehicleId: Number(formData.vehicleId),
        description: formData.description,
        laborHours: formData.laborHours ? Number(formData.laborHours) : undefined,
        partsTotal: formData.partsTotal ? Number(formData.partsTotal) : undefined,
        startDate: formData.startDate || undefined,
      }
    }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/alset/work-orders"] }); setIsModalOpen(false); }
    });
  };

  const handleComplete = (id: number) => {
    updateMutation.mutate({ id, data: { status: UpdateWorkOrderBodyStatus.completed, completionDate: new Date().toISOString().split("T")[0] } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/alset/work-orders"] })
    });
  };

  const filtered = orders?.filter(o => {
    if (activeTab === "all")       return true;
    if (activeTab === "active")    return ["assigned","in-progress","awaiting-parts"].includes(o.status);
    if (activeTab === "pending")   return o.status === "draft";
    if (activeTab === "completed") return o.status === "completed";
    return true;
  }) ?? [];

  const active    = orders?.filter(o => ["assigned","in-progress","awaiting-parts"].includes(o.status)).length ?? 0;
  const completed = orders?.filter(o => o.status === "completed").length ?? 0;
  const totalRev  = orders?.filter(o => o.status === "completed").reduce((a, o) => a + (o.totalCost ?? 0), 0) ?? 0;

  const tabs = [
    { key: "all",       label: "All Orders",  count: orders?.length ?? 0 },
    { key: "active",    label: "In Progress", count: active },
    { key: "pending",   label: "Pending",     count: orders?.filter(o => o.status === "draft").length ?? 0 },
    { key: "completed", label: "Completed",   count: completed },
  ] as const;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Shop Management</p>
          <h1 className="text-2xl font-display font-bold text-gradient-gold">Work Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Tesla-certified repair management with AI-assisted diagnostics.</p>
        </div>
        {canCreate && <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4" /> New Work Order</Button>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Orders"   value={orders?.length ?? 0} icon={Wrench}      color="gold" />
        <StatCard label="Active"         value={active}              icon={Activity}    color="amber" />
        <StatCard label="Completed"      value={completed}           icon={CheckCircle} color="green" />
        <StatCard label="Revenue"        value={`$${totalRev.toLocaleString()}`} icon={DollarSign} color="blue" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border border-border/40 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
              activeTab === t.key ? "bg-card text-foreground shadow-sm border border-border/60" : "text-muted-foreground hover:text-foreground")}>
            {t.label}
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              activeTab === t.key ? "bg-gold/20 text-gold" : "bg-muted/40 text-muted-foreground")}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : !filtered.length ? (
        <Card><EmptyState icon={Wrench} title="No work orders" description={`No ${activeTab === "all" ? "" : activeTab + " "}work orders found.`}
          action={canCreate && <Button size="sm" onClick={() => setIsModalOpen(true)}><Plus className="w-3.5 h-3.5" /> New</Button>} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((order, i) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <WoCard order={order} onComplete={handleComplete} canAct={canAct} isShop={isShop} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Work Order">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Vehicle">
            <Select required value={formData.vehicleId} onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}>
              <option value="" disabled className="bg-[#0d1220]">Select vehicle…</option>
              {vehicles?.map(v => <option key={v.id} value={v.id} className="bg-[#0d1220]">{v.year} {v.model} — {v.licensePlate}</option>)}
            </Select>
          </FormField>
          <FormField label="Repair Description">
            <Textarea required rows={4} placeholder="Describe the repair scope, damage, and required work…" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Labor Hrs">
              <Input type="number" step="0.5" placeholder="e.g. 6.5" value={formData.laborHours} onChange={e => setFormData({ ...formData, laborHours: e.target.value })} />
            </FormField>
            <FormField label="Parts ($)">
              <Input type="number" placeholder="e.g. 1800" value={formData.partsTotal} onChange={e => setFormData({ ...formData, partsTotal: e.target.value })} />
            </FormField>
            <FormField label="Start Date">
              <Input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create Order</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
