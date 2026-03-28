import React, { useState } from "react";
import { useListTowingJobs, useCreateTowingJob, useUpdateTowingJob, useListVehicles, UpdateTowingJobBodyStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Modal, FormField, Input, Select, Textarea, StatusBadge, StatCard, SectionHeader, EmptyState, SkeletonCard, Badge } from "@/components/ui-elements";
import { cn } from "@/components/ui-elements";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Plus, Truck, MapPin, Clock, User, CheckCircle, Navigation, AlertCircle, Radio } from "lucide-react";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  requested:  { color: "text-blue-400",    bg: "bg-blue-500",    label: "Requested"  },
  assigned:   { color: "text-amber-400",   bg: "bg-amber-500",   label: "Assigned"   },
  "en-route": { color: "text-purple-400",  bg: "bg-purple-500",  label: "En Route"   },
  arrived:    { color: "text-gold",        bg: "bg-gold",        label: "On Scene"   },
  completed:  { color: "text-emerald-400", bg: "bg-emerald-500", label: "Completed"  },
  cancelled:  { color: "text-muted-foreground", bg: "bg-muted",  label: "Cancelled"  },
};

function TowCard({ job, onUpdate, canDispatch }: { job: any; onUpdate: (id: number, status: UpdateTowingJobBodyStatus) => void; canDispatch: boolean }) {
  const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.requested;
  const isActive = !["completed","cancelled"].includes(job.status);

  return (
    <Card className={cn("overflow-hidden", isActive && "card-gold")}>
      {/* Status strip */}
      <div className={cn("h-1", cfg.bg)} />

      <div className="px-5 pt-4 pb-3 border-b border-border/50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold font-mono text-gold">{job.jobNumber}</span>
              {isActive && <span className="relative flex h-2 w-2"><span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", cfg.bg)} /><span className={cn("relative inline-flex rounded-full h-2 w-2", cfg.bg)} /></span>}
            </div>
            <p className="text-sm text-muted-foreground">{job.vehicleModel ?? `Vehicle #${job.vehicleId}`}</p>
          </div>
          <StatusBadge status={job.status} />
        </div>
      </div>

      <CardContent className="space-y-4">
        {/* Route */}
        <div className="relative pl-6 space-y-3">
          <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
          <div className="flex items-start gap-2">
            <div className="absolute left-0 w-3 h-3 rounded-full border-2 border-red-400 bg-background" />
            <div className="min-w-0 pl-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pickup</p>
              <p className="text-sm text-foreground leading-snug">{job.pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="absolute left-0 bottom-0 w-3 h-3 rounded-full border-2 border-emerald-400 bg-background" />
            <div className="min-w-0 pl-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Dropoff</p>
              <p className="text-sm text-foreground leading-snug">{job.dropoffAddress}</p>
            </div>
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          {job.driverName && (
            <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 flex-shrink-0" /><span className="font-medium text-foreground">{job.driverName}</span></div>
          )}
          {job.estimatedArrival && (
            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 flex-shrink-0" /><span>ETA: {format(new Date(job.estimatedArrival), "h:mm a")}</span></div>
          )}
          {job.assignedCompanyName && (
            <div className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 flex-shrink-0" /><span>{job.assignedCompanyName}</span></div>
          )}
        </div>

        {job.notes && (
          <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
            <p className="text-xs text-muted-foreground leading-relaxed">{job.notes}</p>
          </div>
        )}

        {/* Dispatcher actions */}
        {canDispatch && isActive && (
          <div className="flex gap-2 flex-wrap pt-1">
            {job.status === "requested" && (
              <Button size="sm" variant="outline" onClick={() => onUpdate(job.id, UpdateTowingJobBodyStatus.assigned)}>
                <Radio className="w-3.5 h-3.5" /> Assign Driver
              </Button>
            )}
            {job.status === "assigned" && (
              <Button size="sm" variant="outline" onClick={() => onUpdate(job.id, UpdateTowingJobBodyStatus["en-route"])}>
                <Navigation className="w-3.5 h-3.5" /> En Route
              </Button>
            )}
            {job.status === "en-route" && (
              <Button size="sm" variant="outline" onClick={() => onUpdate(job.id, UpdateTowingJobBodyStatus.arrived)}>
                <MapPin className="w-3.5 h-3.5" /> Arrived
              </Button>
            )}
            {job.status === "arrived" && (
              <Button size="sm" onClick={() => onUpdate(job.id, UpdateTowingJobBodyStatus.completed)}>
                <CheckCircle className="w-3.5 h-3.5" /> Complete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Towing() {
  const { user } = useAuth();
  const { data: jobs, isLoading } = useListTowingJobs();
  const { data: vehicles } = useListVehicles();
  const createMutation = useCreateTowingJob();
  const updateMutation = useUpdateTowingJob();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ vehicleId: "", pickupAddress: "", dropoffAddress: "", notes: "" });

  const canRequest  = user?.role === "owner" || user?.role === "admin";
  const canDispatch = user?.role === "towing" || user?.role === "admin";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: { vehicleId: Number(formData.vehicleId), pickupAddress: formData.pickupAddress, dropoffAddress: formData.dropoffAddress, notes: formData.notes || undefined }
    }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/alset/towing"] }); setIsModalOpen(false); }
    });
  };

  const handleUpdate = (id: number, status: UpdateTowingJobBodyStatus) => {
    updateMutation.mutate({ id, data: { status } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/alset/towing"] })
    });
  };

  const active    = jobs?.filter(j => !["completed","cancelled"].includes(j.status)).length ?? 0;
  const completed = jobs?.filter(j => j.status === "completed").length ?? 0;
  const enRoute   = jobs?.filter(j => j.status === "en-route").length ?? 0;

  const activeJobs    = jobs?.filter(j => !["completed","cancelled"].includes(j.status)) ?? [];
  const completedJobs = jobs?.filter(j => j.status === "completed") ?? [];

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Dispatch Console</p>
          <h1 className="text-2xl font-display font-bold text-gradient-gold">Towing & Dispatch</h1>
          <p className="text-sm text-muted-foreground mt-1">Request and coordinate flatbed EV transport.</p>
        </div>
        {canRequest && <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4" /> Request Tow</Button>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Jobs"    value={jobs?.length ?? 0} icon={Truck}      color="gold" />
        <StatCard label="Active"        value={active}            icon={AlertCircle} color="amber" />
        <StatCard label="En Route"      value={enRoute}           icon={Navigation}  color="purple" />
        <StatCard label="Completed"     value={completed}         icon={CheckCircle} color="green" />
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : !jobs?.length ? (
        <Card><EmptyState icon={Truck} title="No tow requests" description="Request a tow to get started." action={canRequest && <Button size="sm" onClick={() => setIsModalOpen(true)}><Plus className="w-3.5 h-3.5" /> Request</Button>} /></Card>
      ) : (
        <div className="space-y-6">
          {activeJobs.length > 0 && (
            <div>
              <SectionHeader title={`Active Dispatches (${activeJobs.length})`} icon={Radio} />
              <div className="grid md:grid-cols-2 gap-4">
                {activeJobs.map((job, i) => (
                  <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <TowCard job={job} onUpdate={handleUpdate} canDispatch={canDispatch} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {completedJobs.length > 0 && (
            <div>
              <SectionHeader title="Completed" icon={CheckCircle} />
              <div className="grid md:grid-cols-2 gap-4">
                {completedJobs.map((job, i) => (
                  <motion.div key={job.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}>
                    <TowCard job={job} onUpdate={handleUpdate} canDispatch={canDispatch} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request Tow Service">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Vehicle to Tow">
            <Select required value={formData.vehicleId} onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}>
              <option value="" disabled className="bg-[#0d1220]">Select vehicle…</option>
              {vehicles?.map(v => <option key={v.id} value={v.id} className="bg-[#0d1220]">{v.year} {v.model} — {v.licensePlate}</option>)}
            </Select>
          </FormField>
          <FormField label="Pickup Address">
            <Input required placeholder="Full pickup address" value={formData.pickupAddress} onChange={e => setFormData({ ...formData, pickupAddress: e.target.value })} />
          </FormField>
          <FormField label="Dropoff Address (Service Center)">
            <Input required placeholder="Destination service center address" value={formData.dropoffAddress} onChange={e => setFormData({ ...formData, dropoffAddress: e.target.value })} />
          </FormField>
          <FormField label="Additional Notes">
            <Textarea rows={3} placeholder="Battery level, accessibility issues, urgency…" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Request Tow</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
