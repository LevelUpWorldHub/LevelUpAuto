import React, { useState } from "react";
import { useListWorkOrders, useCreateWorkOrder, useUpdateWorkOrder, useListVehicles, UpdateWorkOrderBodyStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Modal, FormField, Input, Select, Textarea, StatusBadge, StatCard, SectionHeader, EmptyState, SkeletonCard, Badge, ProgressBar } from "@/components/ui-elements";
import { cn } from "@/components/ui-elements";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Plus, Wrench, Cpu, Scan, Zap, BarChart3, CheckCircle, Clock, DollarSign, User, AlertTriangle, Shield, Activity } from "lucide-react";

const DIAG_TOOLS = [
  { name: "Tchek AI Vision",    status: "active",  color: "text-blue-400",    bg: "bg-blue-500/10",    icon: Scan   },
  { name: "Tractable AI Est.",  status: "active",  color: "text-purple-400",  bg: "bg-purple-500/10",  icon: Cpu    },
  { name: "Celette Naja 3D",    status: "standby", color: "text-gold",        bg: "bg-gold/10",        icon: Zap    },
  { name: "Car-O-Tronic Vision2",status:"active",  color: "text-amber-400",   bg: "bg-amber-500/10",   icon: BarChart3 },
  { name: "UVeye Scanner",      status: "standby", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: Scan   },
  { name: "ADAS Calibration",   status: "needed",  color: "text-red-400",     bg: "bg-red-500/10",     icon: Shield },
];

const STATUS_STEPS = ["pending", "assigned", "in-progress", "awaiting-parts", "completed"];

function StepBar({ status }: { status: string }) {
  const idx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 w-full">
      {STATUS_STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className={cn(
            "h-1 flex-1 rounded-full transition-all duration-500",
            i < idx  ? "bg-gold" :
            i === idx ? "bg-gold/70" : "bg-muted"
          )} />
        </React.Fragment>
      ))}
    </div>
  );
}

function WoCard({ order, onComplete, canAct }: { order: any; onComplete: (id: number) => void; canAct: boolean }) {
  const laborCost = (order.laborHours ?? 0) * (order.laborRate ?? 185);
  const parts = order.partsTotal ?? 0;
  const total = order.totalCost ?? (laborCost + parts);

  return (
    <Card variant={order.status === "completed" ? "default" : "gold"} className="overflow-hidden">
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
        <div className="mt-3">
          <StepBar status={order.status} />
        </div>
      </div>

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
            {order.completionDate && <><span>·</span><span>Completed: {format(new Date(order.completionDate), "MMM d, yyyy")}</span></>}
          </div>
        )}

        {order.notes && (
          <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
            <p className="text-xs text-muted-foreground leading-relaxed">{order.notes}</p>
          </div>
        )}

        {/* ADAS alert for Tesla */}
        {order.status === "in-progress" && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-300">ADAS Calibration Required</p>
              <p className="text-[11px] text-amber-300/70 mt-0.5">Autopilot cameras must be recalibrated after structural repair per Tesla service guidelines.</p>
            </div>
          </div>
        )}
      </CardContent>

      {canAct && order.status !== "completed" && order.status !== "cancelled" && (
        <CardFooter className="flex items-center justify-between gap-3">
          {order.status === "assigned" && (
            <Button size="sm" variant="outline" onClick={() => {}}>Start Repair</Button>
          )}
          {order.status === "in-progress" && (
            <Button size="sm" variant="outline" onClick={() => {}}>Awaiting Parts</Button>
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

  const canCreate = user?.role === "shop" || user?.role === "admin";
  const canAct    = user?.role === "shop" || user?.role === "admin";

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

  const active    = orders?.filter(o => ["assigned","in-progress","awaiting-parts"].includes(o.status)).length ?? 0;
  const completed = orders?.filter(o => o.status === "completed").length ?? 0;
  const totalRev  = orders?.filter(o => o.status === "completed").reduce((a, o) => a + (o.totalCost ?? 0), 0) ?? 0;

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Shop Management</p>
          <h1 className="text-2xl font-display font-bold text-gradient-gold">Work Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Tesla-certified repair management with AI-assisted diagnostics.</p>
        </div>
        {canCreate && <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4" /> New Work Order</Button>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Orders"   value={orders?.length ?? 0} icon={Wrench}    color="gold" />
        <StatCard label="Active"         value={active}              icon={Activity}  color="amber" />
        <StatCard label="Completed"      value={completed}           icon={CheckCircle} color="green" />
        <StatCard label="Revenue"        value={`$${totalRev.toLocaleString()}`} icon={DollarSign} color="blue" />
      </div>

      {/* Diagnostic tool panel — shop only */}
      {(user?.role === "shop" || user?.role === "admin") && (
        <div>
          <SectionHeader title="Diagnostic & Measurement Tools" icon={Cpu} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {DIAG_TOOLS.map((t, i) => (
              <div key={i} className={cn("card-4d p-3 text-center cursor-default", t.status === "needed" && "border-amber-500/25")}>
                <div className={cn("w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center", t.bg)}>
                  <t.icon className={cn("w-4 h-4", t.color)} />
                </div>
                <p className="text-[10px] font-bold text-foreground leading-tight">{t.name}</p>
                <p className={cn("text-[10px] mt-1 font-semibold capitalize", t.status === "active" ? "text-emerald-400" : t.status === "needed" ? "text-amber-400" : "text-muted-foreground")}>
                  {t.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : !orders?.length ? (
        <Card><EmptyState icon={Wrench} title="No work orders" description="Create a work order to begin tracking a repair." action={canCreate && <Button size="sm" onClick={() => setIsModalOpen(true)}><Plus className="w-3.5 h-3.5" /> New</Button>} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {orders.map((order, i) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <WoCard order={order} onComplete={handleComplete} canAct={canAct} />
            </motion.div>
          ))}
        </div>
      )}

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
