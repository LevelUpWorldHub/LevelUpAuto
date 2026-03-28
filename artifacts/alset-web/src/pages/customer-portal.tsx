import React from "react";
import { useListWorkOrders, useListClaims, useListRentals, useListTowingJobs } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent, SkeletonCard, Badge } from "@/components/ui-elements";
import { cn } from "@/components/ui-elements";
import { motion } from "framer-motion";
import { format, differenceInDays } from "date-fns";
import {
  Wrench, FileText, Truck, Car, DollarSign, CheckCircle, Clock, MapPin,
  Shield, AlertTriangle, Phone, MessageSquare, Star, ChevronRight, Zap
} from "lucide-react";

const TIMELINE_STEPS = [
  { key: "incident",       label: "Incident Reported",     icon: AlertTriangle },
  { key: "tow_requested",  label: "Tow Dispatched",        icon: Truck },
  { key: "arrived",        label: "Vehicle at Shop",       icon: MapPin },
  { key: "inspection",     label: "Damage Inspection",     icon: Wrench },
  { key: "claim_filed",    label: "Insurance Claim Filed", icon: FileText },
  { key: "claim_approved", label: "Claim Approved",        icon: Shield },
  { key: "in_repair",      label: "Repair In Progress",    icon: Wrench },
  { key: "complete",       label: "Repair Complete",       icon: CheckCircle },
  { key: "pickup",         label: "Ready for Pickup",      icon: Star },
];

function getTimelineStep(workOrder: any, claim: any, towJob: any): number {
  if (!workOrder && !claim) return 0;
  if (workOrder?.status === "completed") return 8;
  if (workOrder?.status === "in-progress") return 6;
  if (claim?.status === "approved" || claim?.status === "paid") return 5;
  if (claim?.status === "under-review" || claim?.status === "submitted") return 4;
  if (workOrder?.status === "assigned") return 3;
  if (towJob?.status === "completed") return 2;
  if (towJob?.status === "en-route" || towJob?.status === "assigned") return 1;
  return 0;
}

function woProgress(status: string): number {
  const map: Record<string, number> = { pending: 5, assigned: 20, "in-progress": 60, "awaiting-parts": 75, completed: 100 };
  return map[status] ?? 0;
}

export default function CustomerPortal() {
  const { user } = useAuth();
  const { data: workOrders, isLoading: woLoading } = useListWorkOrders();
  const { data: claims,     isLoading: clLoading } = useListClaims();
  const { data: rentals,    isLoading: rentLoading } = useListRentals();
  const { data: towJobs,    isLoading: towLoading } = useListTowingJobs();

  const isLoading = woLoading || clLoading || rentLoading || towLoading;

  // Non-owner roles see a redirect message
  if (user?.role && !["owner","admin"].includes(user.role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
          <Car className="w-7 h-7 text-gold" />
        </div>
        <h2 className="text-xl font-display font-bold text-foreground">Customer Portal</h2>
        <p className="text-muted-foreground text-sm max-w-xs">This portal is for Tesla owners. Switch to the Owner role to view your repair status, claims, and billing.</p>
      </div>
    );
  }

  const activeOrder   = workOrders?.[0] ?? null;
  const activeClaim   = claims?.[0]  ?? null;
  const activeTow     = towJobs?.find(t => !["completed","cancelled"].includes(t.status)) ?? towJobs?.[0] ?? null;
  const activeRental  = rentals?.find(r => ["confirmed","active"].includes(r.status)) ?? rentals?.[0] ?? null;

  const step          = getTimelineStep(activeOrder, activeClaim, activeTow);
  const progress      = activeOrder ? woProgress(activeOrder.status) : 0;
  const insurancePays = activeClaim?.approvedAmount ?? 0;
  const repairCost    = activeOrder?.totalCost ?? 0;
  const deductible    = Math.max(0, repairCost - insurancePays);

  const rentalDays = activeRental?.startDate && activeRental?.endDate
    ? Math.max(1, differenceInDays(new Date(activeRental.endDate), new Date(activeRental.startDate))) : 1;

  return (
    <div className="space-y-7">
      {/* Hero header */}
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}
        className="relative rounded-2xl overflow-hidden card-gold p-6 border border-gold/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/[0.04] blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <p className="text-[11px] font-bold text-gold/60 uppercase tracking-widest mb-1">Customer Portal</p>
          <h1 className="text-2xl font-display font-bold">
            Welcome back, <span className="text-gradient-gold">{user?.name?.split(" ")[0] ?? "Owner"}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeOrder ? "Your repair is in progress. We'll keep you updated every step of the way." :
             "All clear — no active repairs. We're here when you need us."}
          </p>
        </div>
        {activeOrder && (
          <div className="mt-4 flex items-center gap-3 pt-4 border-t border-gold/15">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground font-semibold">{activeOrder.workOrderNumber}</span>
                <span className="text-gold font-bold">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <span className={cn("badge", activeOrder.status === "completed" ? "badge-green" : activeOrder.status === "in-progress" ? "badge-amber" : "badge-silver")}>
              {activeOrder.status}
            </span>
          </div>
        )}
      </motion.div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{Array.from({length:4}).map((_,i)=><SkeletonCard key={i} />)}</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Service Timeline */}
          <div className="lg:col-span-2 card-4d p-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Service Timeline</p>
            <div className="space-y-0">
              {TIMELINE_STEPS.map((s, i) => {
                const done    = i < step;
                const current = i === step;
                const Icon    = s.icon;
                return (
                  <div key={s.key} className="flex items-start gap-3">
                    {/* Connector */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border transition-all",
                        done    ? "bg-gold/20 border-gold/40"     :
                        current ? "bg-gold/30 border-gold animate-pulse" :
                                  "bg-muted/20 border-border/40"
                      )}>
                        <Icon className={cn("w-3.5 h-3.5", done || current ? "text-gold" : "text-muted-foreground/40")} />
                      </div>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div className={cn("w-px flex-1 mt-0.5 mb-0.5 min-h-[20px]", done ? "bg-gold/30" : "bg-border/30")} />
                      )}
                    </div>
                    <div className={cn("pb-3", i === TIMELINE_STEPS.length - 1 && "pb-0")}>
                      <p className={cn("text-sm font-semibold leading-none mt-1.5", done ? "text-gold/80" : current ? "text-foreground" : "text-muted-foreground/50")}>
                        {s.label}
                      </p>
                      {current && (
                        <p className="text-[11px] text-gold/60 mt-0.5">Current step</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Active Tow */}
            {activeTow ? (
              <Card variant="gold">
                <CardHeader><CardTitle icon={Truck}>Active Tow</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Job #</span>
                    <span className="text-xs font-mono font-bold text-gold">{activeTow.jobNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <span className={cn("badge text-[10px]", activeTow.status === "en-route" ? "badge-amber" : activeTow.status === "completed" ? "badge-green" : "badge-blue")}>
                      {activeTow.status}
                    </span>
                  </div>
                  {activeTow.pickupAddress && (
                    <div className="flex items-start gap-1.5 mt-2">
                      <MapPin className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-muted-foreground">{activeTow.pickupAddress}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-4 text-center">
                  <Truck className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No active tow</p>
                </CardContent>
              </Card>
            )}

            {/* Loaner Vehicle */}
            {activeRental ? (
              <Card variant="gold">
                <CardHeader><CardTitle icon={Car}>Loaner Vehicle</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Booking #</span>
                    <span className="text-xs font-mono font-bold text-purple-400">{activeRental.bookingNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Type</span>
                    <span className="text-xs font-semibold capitalize text-foreground">{activeRental.vehicleType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Duration</span>
                    <span className="text-xs font-semibold text-foreground">{rentalDays} days</span>
                  </div>
                  {activeRental.claimId && (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-500/8 border border-emerald-500/20 mt-2">
                      <Shield className="w-3 h-3 text-emerald-400" />
                      <span className="text-[11px] text-emerald-400 font-semibold">Insurance covered</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-4 text-center">
                  <Car className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No loaner assigned</p>
                </CardContent>
              </Card>
            )}

            {/* Billing Summary */}
            <Card variant="gold">
              <CardHeader><CardTitle icon={DollarSign}>Billing Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Repair Total</span>
                    <span className="text-sm font-bold text-foreground">{repairCost ? `$${repairCost.toLocaleString()}` : "TBD"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Insurance Covers</span>
                    <span className="text-sm font-bold text-emerald-400">{insurancePays ? `−$${insurancePays.toLocaleString()}` : "Pending"}</span>
                  </div>
                  <div className="border-t border-border/40 pt-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Your Deductible</span>
                    <span className="text-sm font-bold text-gold">{deductible ? `$${deductible.toLocaleString()}` : "—"}</span>
                  </div>
                </div>
                {activeClaim && (
                  <p className="text-[11px] text-muted-foreground mt-3 pt-3 border-t border-border/30">
                    Your insurance handles the rest — no further action required.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Insurance Claim Card */}
          {activeClaim && (
            <Card variant="gold" className="md:col-span-2 lg:col-span-2">
              <CardHeader><CardTitle icon={FileText}>Active Insurance Claim</CardTitle></CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-4 gap-3">
                  {[
                    { label: "Claim Number",     value: activeClaim.claimNumber,              color: "text-blue-400" },
                    { label: "Status",           value: activeClaim.status,                   color: "text-foreground" },
                    { label: "Estimated Damage", value: activeClaim.estimatedDamage ? `$${Number(activeClaim.estimatedDamage).toLocaleString()}` : "—", color: "text-amber-400" },
                    { label: "Approved Amount",  value: activeClaim.approvedAmount  ? `$${Number(activeClaim.approvedAmount).toLocaleString()}`  : "Pending", color: "text-emerald-400" },
                  ].map(f => (
                    <div key={f.label} className="p-3 rounded-xl bg-muted/20 border border-border/30 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{f.label}</p>
                      <p className={cn("text-sm font-bold", f.color)}>{f.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact & Support */}
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader><CardTitle icon={Phone}>Contact & Support</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { Icon: Phone,          label: "Call Shop",     sub: "Available 8AM–6PM",   color: "text-gold bg-gold/10" },
                { Icon: MessageSquare,  label: "Send Message",  sub: "We reply within 1hr", color: "text-blue-400 bg-blue-500/10" },
                { Icon: Zap,            label: "Emergency Tow", sub: "24/7 EV towing",       color: "text-amber-400 bg-amber-500/10" },
              ].map(({ Icon, label, sub, color }) => (
                <button key={label} className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border/30 hover:border-gold/20 transition-all group text-left">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", color.split(" ")[1])}>
                    <Icon className={cn("w-4 h-4", color.split(" ")[0])} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-gold transition-colors" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
