import React, { useState } from "react";
import { useListWorkOrders, useListClaims, useListRentals } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent, StatCard, SectionHeader, EmptyState, SkeletonCard, Badge } from "@/components/ui-elements";
import { cn } from "@/components/ui-elements";
import { motion } from "framer-motion";
import { format, differenceInDays } from "date-fns";
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertTriangle, Building2, Receipt, Wrench, Car, BarChart3, CreditCard, FileText } from "lucide-react";

const TABS = ["Overview", "Work Orders", "Insurance", "Rentals"] as const;
type Tab = typeof TABS[number];

function MoneyRow({ label, value, note, color = "foreground", bold = false }: { label: string; value: string; note?: string; color?: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
      <div>
        <p className={cn("text-sm", bold ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</p>
        {note && <p className="text-[10px] text-muted-foreground mt-0.5">{note}</p>}
      </div>
      <p className={cn("text-sm font-bold tabular-nums", `text-${color}`)}>{value}</p>
    </div>
  );
}

export default function Accounting() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("Overview");
  const { data: workOrders, isLoading: woLoading } = useListWorkOrders();
  const { data: claims, isLoading: clLoading } = useListClaims();
  const { data: rentals, isLoading: rentLoading } = useListRentals();

  const role = user?.role ?? "owner";
  const isLoading = woLoading || clLoading || rentLoading;

  // Aggregate financials
  const completedOrders = workOrders?.filter(o => o.status === "completed") ?? [];
  const woRevenue = completedOrders.reduce((s, o) => s + (o.totalCost ?? 0), 0);
  const woLabor   = completedOrders.reduce((s, o) => s + ((o.laborHours ?? 0) * (o.laborRate ?? 185)), 0);
  const woParts   = completedOrders.reduce((s, o) => s + (o.partsTotal ?? 0), 0);
  const activeOrders = workOrders?.filter(o => ["assigned","in-progress","awaiting-parts"].includes(o.status)) ?? [];
  const pipelineValue = activeOrders.reduce((s, o) => s + (o.totalCost ?? 0), 0);

  const approvedClaims = claims?.filter(c => ["approved","paid"].includes(c.status)) ?? [];
  const paidClaims     = claims?.filter(c => c.status === "paid") ?? [];
  const claimsApproved = approvedClaims.reduce((s, c) => s + (c.approvedAmount ?? 0), 0);
  const claimsPaid     = paidClaims.reduce((s, c) => s + (c.approvedAmount ?? 0), 0);
  const claimsPending  = claims?.filter(c => ["submitted","under-review"].includes(c.status)).length ?? 0;

  const completedRentals = rentals?.filter(r => ["completed","active","confirmed"].includes(r.status)) ?? [];
  const rentalRevenue = completedRentals.reduce((s, r) => {
    const days = r.startDate && r.endDate ? Math.max(1, differenceInDays(new Date(r.endDate), new Date(r.startDate))) : 1;
    return s + (r.dailyRate ?? 0) * days;
  }, 0);

  const totalRevenue  = woRevenue + rentalRevenue;
  const outstanding   = pipelineValue;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Financial Management</p>
        <h1 className="text-2xl font-display font-bold text-gradient-gold">Accounting & Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {role === "owner" ? "Your repair billing and insurance settlement overview." :
           role === "insurer" ? "Insurance settlements, approvals, and direct billing summary." :
           "Revenue, receivables, and insurance settlement tracking."}
        </p>
      </div>

      {/* KPI cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array.from({length:4}).map((_,i)=><SkeletonCard key={i} />)}</div>
      ) : role === "owner" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Approved Insurance"  value={`$${claimsApproved.toLocaleString()}`}  icon={CheckCircle}  color="green" />
          <StatCard label="Insurance Paid"      value={`$${claimsPaid.toLocaleString()}`}       icon={DollarSign}   color="gold" />
          <StatCard label="Claims Pending"      value={claimsPending}                           icon={Clock}        color="amber" />
          <StatCard label="Active Repairs"      value={activeOrders.length}                     icon={Wrench}       color="blue" />
        </div>
      ) : role === "insurer" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Claims"        value={claims?.length ?? 0}                     icon={FileText}     color="blue" />
          <StatCard label="Approved Value"      value={`$${claimsApproved.toLocaleString()}`}   icon={CheckCircle}  color="green" />
          <StatCard label="Paid Out"            value={`$${claimsPaid.toLocaleString()}`}        icon={DollarSign}   color="gold" />
          <StatCard label="Pending Review"      value={claimsPending}                           icon={AlertTriangle} color="amber" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Revenue"       value={`$${totalRevenue.toLocaleString()}`}     icon={TrendingUp}   color="gold" />
          <StatCard label="In Pipeline"         value={`$${outstanding.toLocaleString()}`}      icon={Clock}        color="amber" />
          <StatCard label="Insurance Collected" value={`$${claimsPaid.toLocaleString()}`}       icon={CheckCircle}  color="green" />
          <StatCard label="Rental Income"       value={`$${rentalRevenue.toLocaleString()}`}    icon={Car}          color="blue" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border border-border/40 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
              tab === t ? "bg-card text-foreground shadow-sm border border-border/60" : "text-muted-foreground hover:text-foreground")}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "Overview" && (
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="grid md:grid-cols-2 gap-5">

          {/* Revenue summary */}
          <Card variant="gold">
            <CardHeader><CardTitle icon={BarChart3}>Revenue Summary</CardTitle></CardHeader>
            <CardContent className="space-y-0">
              <MoneyRow label="Work Order Revenue"   value={`$${woRevenue.toLocaleString()}`}     note={`${completedOrders.length} completed orders`} />
              <MoneyRow label="  — Labor"            value={`$${woLabor.toLocaleString()}`}       note="At $185/hr" />
              <MoneyRow label="  — Parts & Materials" value={`$${woParts.toLocaleString()}`}      />
              <MoneyRow label="Rental Income"        value={`$${rentalRevenue.toLocaleString()}`} note={`${completedRentals.length} bookings`} />
              <MoneyRow label="Pipeline (in-progress)" value={`$${pipelineValue.toLocaleString()}`} note="Not yet collected" color="amber" />
              <MoneyRow label="Total Revenue"        value={`$${totalRevenue.toLocaleString()}`}  bold={true} color="gold" />
            </CardContent>
          </Card>

          {/* Insurance summary */}
          <Card variant="gold">
            <CardHeader><CardTitle icon={Building2}>Insurance Settlement</CardTitle></CardHeader>
            <CardContent className="space-y-0">
              <MoneyRow label="Total Claims Filed"   value={String(claims?.length ?? 0)} />
              <MoneyRow label="Approved Claims"      value={String(approvedClaims.length)} />
              <MoneyRow label="Approved Value"       value={`$${claimsApproved.toLocaleString()}`} color="green" />
              <MoneyRow label="Paid to Date"         value={`$${claimsPaid.toLocaleString()}`}     color="gold" bold />
              <MoneyRow label="Awaiting Payment"     value={`$${(claimsApproved - claimsPaid).toLocaleString()}`} color="amber" />
              <MoneyRow label="Claims Pending Review" value={String(claimsPending)} />
            </CardContent>
          </Card>

          {/* Monthly breakdown (static illustration) */}
          <Card className="md:col-span-2">
            <CardHeader><CardTitle icon={BarChart3}>Revenue Breakdown by Category</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Labor Revenue",        value: woLabor,       total: totalRevenue || 1, color: "bg-gold" },
                  { label: "Parts & Materials",     value: woParts,       total: totalRevenue || 1, color: "bg-blue-500" },
                  { label: "Rental Income",         value: rentalRevenue, total: totalRevenue || 1, color: "bg-purple-500" },
                  { label: "Insurance Settlements", value: claimsPaid,    total: Math.max(claimsPaid, totalRevenue) || 1, color: "bg-emerald-500" },
                ].map(bar => (
                  <div key={bar.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{bar.label}</span>
                      <span className="font-semibold text-foreground">${bar.value.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-700", bar.color)}
                        style={{ width: `${Math.round((bar.value / bar.total) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {tab === "Work Orders" && (
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="space-y-3">
          {isLoading ? <SkeletonCard /> : !workOrders?.length ? (
            <Card><EmptyState icon={Wrench} title="No work orders" description="Work order billing will appear here." /></Card>
          ) : (
            <div className="card-4d overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Order #</th><th>Vehicle</th><th>Status</th><th>Labor Hrs</th><th>Parts</th><th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrders.map(o => (
                      <tr key={o.id}>
                        <td><span className="font-mono text-gold text-xs font-bold">{o.workOrderNumber}</span></td>
                        <td><span className="text-sm text-foreground">{o.vehicleModel ?? `#${o.vehicleId}`}</span></td>
                        <td><span className={cn("badge text-[10px]", o.status === "completed" ? "badge-green" : o.status === "in-progress" ? "badge-amber" : "badge-silver")}>{o.status}</span></td>
                        <td className="text-sm text-muted-foreground">{o.laborHours ?? "—"}</td>
                        <td className="text-sm text-muted-foreground">{o.partsTotal ? `$${Number(o.partsTotal).toLocaleString()}` : "—"}</td>
                        <td className="text-sm font-semibold text-gold">{o.totalCost ? `$${Number(o.totalCost).toLocaleString()}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gold/20">
                      <td colSpan={5} className="px-4 py-3 text-sm font-bold text-muted-foreground text-right">Total Revenue</td>
                      <td className="px-4 py-3 text-base font-bold text-gold">${woRevenue.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {tab === "Insurance" && (
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="space-y-3">
          {isLoading ? <SkeletonCard /> : !claims?.length ? (
            <Card><EmptyState icon={FileText} title="No insurance claims" description="Insurance billing will appear here." /></Card>
          ) : (
            <div className="card-4d overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Claim #</th><th>Vehicle</th><th>Insurer</th><th>Status</th><th>Estimated</th><th>Approved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map(c => (
                      <tr key={c.id}>
                        <td><span className="font-mono text-blue-400 text-xs font-bold">{c.claimNumber}</span></td>
                        <td><span className="text-sm text-foreground">{c.vehicleModel ?? `#${c.vehicleId}`}</span></td>
                        <td><span className="text-sm text-muted-foreground">{c.insurerName ?? "—"}</span></td>
                        <td><span className={cn("badge text-[10px]", c.status === "paid" ? "badge-green" : c.status === "approved" ? "badge-blue" : c.status === "denied" ? "badge-red" : "badge-amber")}>{c.status}</span></td>
                        <td className="text-sm text-muted-foreground">{c.estimatedDamage ? `$${Number(c.estimatedDamage).toLocaleString()}` : "—"}</td>
                        <td className="text-sm font-semibold text-emerald-400">{c.approvedAmount ? `$${Number(c.approvedAmount).toLocaleString()}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-emerald-500/20">
                      <td colSpan={5} className="px-4 py-3 text-sm font-bold text-muted-foreground text-right">Total Approved</td>
                      <td className="px-4 py-3 text-base font-bold text-emerald-400">${claimsApproved.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {tab === "Rentals" && (
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="space-y-3">
          {isLoading ? <SkeletonCard /> : !rentals?.length ? (
            <Card><EmptyState icon={Car} title="No rentals" description="Rental income will appear here." /></Card>
          ) : (
            <div className="card-4d overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Booking #</th><th>Vehicle Type</th><th>Status</th><th>Start</th><th>End</th><th>Days</th><th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentals.map(r => {
                      const days = r.startDate && r.endDate ? Math.max(1, differenceInDays(new Date(r.endDate), new Date(r.startDate))) : 1;
                      const total = (r.dailyRate ?? 0) * days;
                      return (
                        <tr key={r.id}>
                          <td><span className="font-mono text-purple-400 text-xs font-bold">{r.bookingNumber}</span></td>
                          <td><span className="text-sm text-foreground capitalize">{r.vehicleType}</span></td>
                          <td><span className={cn("badge text-[10px]", r.status === "completed" ? "badge-green" : r.status === "active" ? "badge-blue" : "badge-silver")}>{r.status}</span></td>
                          <td className="text-xs text-muted-foreground">{r.startDate ? format(new Date(r.startDate), "MMM d") : "—"}</td>
                          <td className="text-xs text-muted-foreground">{r.endDate ? format(new Date(r.endDate), "MMM d") : "—"}</td>
                          <td className="text-sm text-muted-foreground">{days}</td>
                          <td className="text-sm font-semibold text-purple-400">${total.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-purple-500/20">
                      <td colSpan={6} className="px-4 py-3 text-sm font-bold text-muted-foreground text-right">Total Rental Income</td>
                      <td className="px-4 py-3 text-base font-bold text-purple-400">${rentalRevenue.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
