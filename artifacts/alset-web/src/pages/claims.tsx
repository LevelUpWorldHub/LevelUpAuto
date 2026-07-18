import React, { useState } from "react";
import { useListClaims, useCreateClaim, useUpdateClaim, useListVehicles, CreateClaimBodyPriority, UpdateClaimBodyStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent, Button, Modal, FormField, Input, Select, Textarea, StatusBadge, StatCard, SectionHeader, EmptyState, SkeletonCard, Alert, Divider, Badge } from "@/components/ui-elements";
import { cn } from "@/components/ui-elements";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Plus, FileText, DollarSign, Clock, CheckCircle, AlertTriangle, Building2, ChevronDown, ChevronUp, ShieldCheck, MessageSquare, Send, Zap, User, Wrench } from "lucide-react";

const SEED_MESSAGES: Record<number, Array<{ role: string; name: string; text: string; time: string }>> = {
  1: [
    { role: "shop",    name: "Alex Rodriguez",   text: "Vehicle inspected. Rear quarter panel intrusion confirmed. Photos and OEM scan submitted to adjuster portal.", time: "Mar 12, 10:05 AM" },
    { role: "insurer", name: "Sarah Mitchell",   text: "Claim received. Reviewing submitted documentation. Will need chassis measurement report from Celette NAJA before approval.", time: "Mar 12, 2:30 PM" },
    { role: "shop",    name: "Alex Rodriguez",   text: "Celette NAJA 3D measurement complete. Digital twin uploaded — total frame deviation 4.2mm within repair threshold. ADAS calibration flagged.", time: "Mar 13, 9:14 AM" },
  ],
};

const ROLE_COLORS: Record<string, string> = {
  insurer: "border-emerald-500/50 bg-emerald-500/5",
  shop:    "border-gold/40 bg-gold/5",
  owner:   "border-blue-500/30 bg-blue-500/5",
  towing:  "border-amber-500/30 bg-amber-500/5",
};
const ROLE_BADGE_CLASSES: Record<string, string> = {
  insurer: "badge-green", shop: "badge-gold", owner: "badge-blue", towing: "badge-amber",
};

function MessageThread({ claimId, role }: { claimId: number; role: string }) {
  const [msgs, setMsgs] = useState(SEED_MESSAGES[claimId] ?? []);
  const [text, setText] = useState("");
  const { user } = useAuth();

  const send = () => {
    if (!text.trim()) return;
    setMsgs(m => [...m, { role: role, name: user?.name ?? "You", text: text.trim(), time: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) }]);
    setText("");
  };

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Message Thread</p>

      {msgs.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No messages yet. Start the conversation below.</p>
      ) : (
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {msgs.map((m, i) => (
            <div key={i} className={cn("p-3 rounded-xl border-l-2 text-sm", ROLE_COLORS[m.role] ?? "border-border bg-muted/10")}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-foreground text-xs">{m.name}</span>
                <span className={cn("badge text-[9px] py-0 px-1.5", ROLE_BADGE_CLASSES[m.role] ?? "badge-silver")}>{m.role}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{m.time}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{m.text}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a message… (Enter to send)"
          rows={2}
          className="field-textarea flex-1 text-xs"
        />
        <button onClick={send} disabled={!text.trim()}
          className="px-3 py-2 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/25 text-gold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function ClaimRow({ claim, onUpdate, canUpdate, role }: { claim: any; onUpdate?: (id: number, status: UpdateClaimBodyStatus) => void; canUpdate: boolean; role: string }) {
  const [expanded, setExpanded] = useState(false);

  const progress = {
    submitted: 10, "under-review": 35, approved: 65, "in-progress": 80, paid: 100, denied: 100, closed: 100
  }[claim.status as string] ?? 10;
  const pctColor = claim.status === "denied" ? "bg-red-500" : progress === 100 ? "bg-emerald-500" : "bg-gold";
  const deductible = Math.max(0, (claim.estimatedDamage ?? 0) - (claim.approvedAmount ?? 0));

  return (
    <div className="card-4d overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-muted/40 flex-shrink-0">
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold font-mono text-foreground">{claim.claimNumber}</span>
              <StatusBadge status={claim.priority} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {claim.vehicleModel ?? `Vehicle #${claim.vehicleId}`} · {format(new Date(claim.incidentDate), "MMM d, yyyy")}
            </p>
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
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }} className="overflow-hidden border-t border-border/50 mt-0">
            <div className="px-5 py-4 space-y-4">

              {/* Description */}
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Incident Description</p>
                <p className="text-sm text-foreground leading-relaxed">{claim.incidentDescription}</p>
              </div>

              {/* Financial grid */}
              <div className="grid sm:grid-cols-4 gap-2">
                {[
                  { label: "Estimated Damage", value: claim.estimatedDamage ? `$${Number(claim.estimatedDamage).toLocaleString()}` : "Pending",          color: "text-amber-400" },
                  { label: "Approved Amount",  value: claim.approvedAmount  ? `$${Number(claim.approvedAmount).toLocaleString()}`  : "Pending",          color: "text-emerald-400" },
                  { label: "Deductible",       value: deductible            ? `$${deductible.toLocaleString()}`                    : "—",                color: "text-gold" },
                  { label: "Net to Owner",     value: claim.approvedAmount  ? `$${Math.max(0, Number(claim.approvedAmount) - deductible).toLocaleString()}` : "—", color: "text-foreground" },
                ].map(f => (
                  <div key={f.label} className="p-2.5 rounded-xl bg-muted/20 border border-border/30 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{f.label}</p>
                    <p className={cn("text-sm font-bold", f.color)}>{f.value}</p>
                  </div>
                ))}
              </div>

              {/* Insurer + payment info */}
              {(claim.insurerName || claim.directBillingEnabled) && (
                <div className="flex flex-wrap items-center gap-2">
                  {claim.insurerName && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-gold" />
                      <span>Insurer: <span className="text-foreground font-medium">{claim.insurerName}</span></span>
                    </div>
                  )}
                  {claim.directBillingEnabled && (
                    <span className="flex items-center gap-1 badge badge-gold text-[10px]"><Zap className="w-2.5 h-2.5" />Direct Billing</span>
                  )}
                </div>
              )}

              {/* CIECA/BMS indicator */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-300">CIECA/BMS v3.1 Protocol</p>
                  <p className="text-[11px] text-blue-300/70">Electronic data interchange — claim transmitted to adjuster system in real-time</p>
                </div>
                <span className="badge badge-blue text-[10px]">EDI Active</span>
              </div>

              {claim.notes && (
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Adjuster Notes</p>
                  <p className="text-sm text-foreground">{claim.notes}</p>
                </div>
              )}

              {/* Insurer actions */}
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

              {/* Message thread */}
              <div className="pt-2 border-t border-border/40">
                <MessageThread claimId={claim.id} role={role} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
  const [activeTab, setActiveTab] = useState<"all" | "active" | "approved" | "closed">("all");
  const [formData, setFormData] = useState({
    vehicleId: "",
    incidentDate: new Date().toISOString().split("T")[0],
    incidentDescription: "",
    estimatedDamage: "",
    priority: CreateClaimBodyPriority.medium as CreateClaimBodyPriority,
  });

  const role       = user?.role ?? "owner";
  const canCreate  = role === "owner" || role === "admin";
  const canUpdate  = role === "insurer" || role === "admin";

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

  const filtered = claims?.filter(c => {
    if (activeTab === "all")      return true;
    if (activeTab === "active")   return ["submitted","under-review"].includes(c.status);
    if (activeTab === "approved") return ["approved","paid"].includes(c.status);
    if (activeTab === "closed")   return ["denied","closed"].includes(c.status);
    return true;
  }) ?? [];

  const open      = claims?.filter(c => ["submitted","under-review"].includes(c.status)).length ?? 0;
  const approved  = claims?.filter(c => ["approved","paid"].includes(c.status)).length ?? 0;
  const totalVal  = claims?.reduce((a, c) => a + (c.approvedAmount ?? 0), 0) ?? 0;

  const tabs = [
    { key: "all",      label: "All Claims", count: claims?.length ?? 0 },
    { key: "active",   label: "Active",     count: open },
    { key: "approved", label: "Approved",   count: approved },
    { key: "closed",   label: "Closed",     count: claims?.filter(c => ["denied","closed"].includes(c.status)).length ?? 0 },
  ] as const;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">CIECA/BMS Integration</p>
          <h1 className="text-2xl font-display font-bold text-gradient-gold">Insurance Claims</h1>
          <p className="text-sm text-muted-foreground mt-1">Electronic damage reporting with direct insurer integration and real-time EDI.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4" /> File New Claim</Button>
        )}
      </div>

      {/* Stats */}
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

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : !filtered.length ? (
        <Card><EmptyState icon={FileText} title="No claims" description="No claims match this filter."
          action={canCreate && <Button size="sm" onClick={() => setIsModalOpen(true)}><Plus className="w-3.5 h-3.5" /> File Claim</Button>} /></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((claim, i) => (
            <motion.div key={claim.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <ClaimRow claim={claim} onUpdate={handleUpdate} canUpdate={canUpdate} role={role} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
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
