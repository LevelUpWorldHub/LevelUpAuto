import React, { useState } from "react";
import { useListClaims, useCreateClaim, useUpdateClaim, useListVehicles, CreateClaimBodyPriority, UpdateClaimBodyStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent, Button, Modal, FormField, Input, Select, Textarea, StatusBadge, StatCard, SectionHeader, EmptyState, SkeletonCard, Alert, Divider, Badge } from "@/components/ui-elements";
import { cn } from "@/components/ui-elements";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Plus, FileText, DollarSign, Clock, CheckCircle, AlertTriangle, Building2, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";

function ClaimRow({ claim, onUpdate, canUpdate }: { claim: any; onUpdate?: (id: number, status: UpdateClaimBodyStatus) => void; canUpdate: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const progress = {
    submitted: 10, "under-review": 35, approved: 65, "in-progress": 80, paid: 100, denied: 100, closed: 100
  }[claim.status as string] ?? 10;

  const pctColor = claim.status === "denied" ? "bg-red-500" : progress === 100 ? "bg-emerald-500" : "bg-gold";

  return (
    <div className="card-4d overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-muted/40 flex-shrink-0">
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold font-mono text-foreground">{claim.claimNumber}</span>
              <StatusBadge status={claim.priority} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{claim.vehicleModel ?? `Vehicle #${claim.vehicleId}`} · {format(new Date(claim.incidentDate), "MMM d, yyyy")}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground">Estimated</p>
            <p className="text-sm font-semibold text-foreground">${claim.estimatedDamage?.toLocaleString() ?? "—"}</p>
          </div>
          <StatusBadge status={claim.status} />
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5">
        <div className="h-0.5 bg-muted rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-700", pctColor)} style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
          className="border-t border-border/50 mt-0">
          <div className="px-5 py-4 space-y-4">
            {/* Description */}
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Incident Description</p>
              <p className="text-sm text-foreground leading-relaxed">{claim.incidentDescription}</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: "Estimated Damage", value: claim.estimatedDamage ? `$${Number(claim.estimatedDamage).toLocaleString()}` : "Pending", icon: DollarSign },
                { label: "Approved Amount",  value: claim.approvedAmount ? `$${Number(claim.approvedAmount).toLocaleString()}` : "Pending", icon: CheckCircle },
                { label: "Insurer",           value: claim.insurerName ?? "Unassigned", icon: Building2 },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/40">
                  <f.icon className="w-4 h-4 text-gold flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</p>
                    <p className="text-xs font-semibold text-foreground truncate">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CIECA/BMS indicator */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
              <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-300">CIECA/BMS Integration</p>
                <p className="text-[11px] text-blue-300/70">Electronic data interchange — claim data transmitted to adjuster system</p>
              </div>
              <span className="badge badge-blue text-[10px]">EDI Active</span>
            </div>

            {claim.notes && (
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Notes</p>
                <p className="text-sm text-foreground">{claim.notes}</p>
              </div>
            )}

            {/* Actions */}
            {canUpdate && claim.status !== "paid" && claim.status !== "denied" && (
              <div className="flex gap-2 flex-wrap pt-1">
                {claim.status === "submitted" && (
                  <Button size="sm" variant="outline" onClick={() => onUpdate?.(claim.id, UpdateClaimBodyStatus["under-review"])}>
                    Start Review
                  </Button>
                )}
                {claim.status === "under-review" && (
                  <>
                    <Button size="sm" onClick={() => onUpdate?.(claim.id, UpdateClaimBodyStatus.approved)}>
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onUpdate?.(claim.id, UpdateClaimBodyStatus.denied)}>
                      Deny
                    </Button>
                  </>
                )}
                {claim.status === "approved" && (
                  <Button size="sm" onClick={() => onUpdate?.(claim.id, UpdateClaimBodyStatus.paid)}>
                    <DollarSign className="w-3.5 h-3.5" /> Mark Paid
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function Claims() {
  const { user } = useAuth();
  const { data: claims, isLoading } = useListClaims();
  const { data: vehicles } = useListVehicles();
  const createMutation = useCreateClaim();
  const updateMutation = useUpdateClaim();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: "",
    incidentDate: new Date().toISOString().split("T")[0],
    incidentDescription: "",
    estimatedDamage: "",
    priority: CreateClaimBodyPriority.medium,
  });

  const canCreate = user?.role === "owner" || user?.role === "admin";
  const canUpdate = user?.role === "insurer" || user?.role === "admin";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        ...formData,
        vehicleId: Number(formData.vehicleId),
        estimatedDamage: formData.estimatedDamage ? Number(formData.estimatedDamage) : undefined,
      }
    }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/alset/claims"] }); setIsModalOpen(false); }
    });
  };

  const handleUpdate = (id: number, status: UpdateClaimBodyStatus) => {
    updateMutation.mutate({ id, data: { status } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/alset/claims"] })
    });
  };

  const open   = claims?.filter(c => ["submitted","under-review"].includes(c.status)).length ?? 0;
  const approved = claims?.filter(c => c.status === "approved" || c.status === "paid").length ?? 0;
  const totalVal = claims?.reduce((a, c) => a + (c.approvedAmount ?? 0), 0) ?? 0;

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">CIECA/BMS Integration</p>
          <h1 className="text-2xl font-display font-bold text-gradient-gold">Insurance Claims</h1>
          <p className="text-sm text-muted-foreground mt-1">Electronic damage reporting with direct insurer integration.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4" /> File New Claim</Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Claims"     value={claims?.length ?? 0} icon={FileText}    color="blue" />
        <StatCard label="Open / In Review" value={open}                icon={Clock}       color="amber" />
        <StatCard label="Approved / Paid"  value={approved}            icon={CheckCircle} color="green" />
        <StatCard label="Total Approved"   value={`$${totalVal.toLocaleString()}`} icon={DollarSign} color="gold" />
      </div>

      {canUpdate && open > 0 && (
        <Alert type="warning" title="Adjuster Action Required">
          {open} claim{open > 1 ? "s" : ""} pending review. Click to expand and process.
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : !claims?.length ? (
        <Card><EmptyState icon={FileText} title="No claims filed" description="File a claim to begin the insurance process." action={canCreate && <Button size="sm" onClick={() => setIsModalOpen(true)}><Plus className="w-3.5 h-3.5" /> File Claim</Button>} /></Card>
      ) : (
        <div className="space-y-3">
          {claims.map((claim, i) => (
            <motion.div key={claim.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <ClaimRow claim={claim} onUpdate={handleUpdate} canUpdate={canUpdate} />
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="File Insurance Claim" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Vehicle">
            <Select required value={formData.vehicleId} onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}>
              <option value="" disabled className="bg-[#0d1220]">Select your vehicle…</option>
              {vehicles?.map(v => <option key={v.id} value={v.id} className="bg-[#0d1220]">{v.year} {v.model} — {v.licensePlate}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Incident Date">
              <Input type="date" required value={formData.incidentDate} onChange={e => setFormData({ ...formData, incidentDate: e.target.value })} />
            </FormField>
            <FormField label="Priority">
              <Select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value as CreateClaimBodyPriority })}>
                {Object.values(CreateClaimBodyPriority).map(p => <option key={p} value={p} className="bg-[#0d1220] capitalize">{p}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label="Incident Description">
            <Textarea required rows={4} placeholder="Describe what happened, where, and the visible damage…" value={formData.incidentDescription} onChange={e => setFormData({ ...formData, incidentDescription: e.target.value })} />
          </FormField>
          <FormField label="Estimated Damage ($)">
            <Input type="number" placeholder="e.g. 5000" value={formData.estimatedDamage} onChange={e => setFormData({ ...formData, estimatedDamage: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Submit Claim</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
