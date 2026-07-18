import React, { useState } from "react";
import { useListRentals, useCreateRental, useUpdateRental, CreateRentalBodyVehicleType, UpdateRentalBodyStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Modal, FormField, Input, Select, Textarea, StatusBadge, StatCard, SectionHeader, EmptyState, SkeletonCard, Badge, Alert } from "@/components/ui-elements";
import { cn } from "@/components/ui-elements";
import { motion } from "framer-motion";
import { format, differenceInDays } from "date-fns";
import { Plus, CalendarDays, Car, DollarSign, Clock, CheckCircle, Building2, Zap } from "lucide-react";

const VEHICLE_TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  electric: Zap, sedan: Car, suv: Car, luxury: Car, truck: Car,
};

const VEHICLE_TYPE_COLORS: Record<string, string> = {
  electric: "text-blue-400 bg-blue-500/10",
  sedan:    "text-gold bg-gold/10",
  suv:      "text-purple-400 bg-purple-500/10",
  luxury:   "text-amber-400 bg-amber-500/10",
  truck:    "text-emerald-400 bg-emerald-500/10",
};

function RentalCard({ rental, onUpdate, canManage }: { rental: any; onUpdate: (id: number, status: UpdateRentalBodyStatus) => void; canManage: boolean }) {
  const days = rental.startDate && rental.endDate ? differenceInDays(new Date(rental.endDate), new Date(rental.startDate)) : null;
  const VTypeIcon = VEHICLE_TYPE_ICONS[rental.vehicleType] ?? Car;
  const typeColor = VEHICLE_TYPE_COLORS[rental.vehicleType] ?? "text-gold bg-gold/10";
  const isActive = ["confirmed","active"].includes(rental.status);

  return (
    <Card variant={isActive ? "gold" : "default"} className="overflow-visible">
      <div className="px-5 pt-5 pb-4 border-b border-border/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={cn("p-2.5 rounded-xl flex-shrink-0", typeColor)}>
              <VTypeIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-sm font-bold font-mono text-gold">{rental.bookingNumber}</span>
                {rental.claimId && <span className="badge badge-blue text-[10px]">Claim #{rental.claimId}</span>}
              </div>
              <p className="text-sm text-muted-foreground capitalize">{rental.vehicleType} loaner</p>
            </div>
          </div>
          <StatusBadge status={rental.status} />
        </div>
      </div>

      <CardContent className="space-y-4">
        {/* Dates */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          {[
            { label: "Start Date",  value: format(new Date(rental.startDate), "MMM d, yyyy") },
            { label: "End Date",    value: rental.endDate ? format(new Date(rental.endDate), "MMM d, yyyy") : "Open" },
            { label: "Duration",    value: days !== null ? `${days} day${days !== 1 ? "s" : ""}` : "TBD" },
          ].map(f => (
            <div key={f.label} className="p-2.5 rounded-lg bg-muted/25 border border-border/40 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{f.label}</p>
              <p className="font-semibold text-foreground">{f.value}</p>
            </div>
          ))}
        </div>

        {/* Financial */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            <span>Daily rate:</span>
            <span className="text-foreground font-medium">{rental.dailyRate ? `$${rental.dailyRate}/day` : "TBD"}</span>
          </div>
          {rental.totalCost && (
            <div className="font-bold text-gold">${Number(rental.totalCost).toLocaleString()} total</div>
          )}
        </div>

        {/* Company */}
        {rental.rentalCompanyName && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="w-3.5 h-3.5" />
            <span>Provided by: <span className="text-foreground font-medium">{rental.rentalCompanyName}</span></span>
          </div>
        )}

        {rental.notes && (
          <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
            <p className="text-xs text-muted-foreground">{rental.notes}</p>
          </div>
        )}

        {/* Insurance billing note */}
        {rental.claimId && isActive && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-emerald-300">Insurance Billing Active</p>
              <p className="text-[11px] text-emerald-300/70 mt-0.5">Rental costs are being billed directly to the claim insurer via EDI.</p>
            </div>
          </div>
        )}
      </CardContent>

      {canManage && (
        <CardFooter className="flex items-center gap-3">
          {rental.status === "requested" && (
            <Button size="sm" variant="outline" onClick={() => onUpdate(rental.id, UpdateRentalBodyStatus.confirmed)}>
              <CheckCircle className="w-3.5 h-3.5" /> Confirm
            </Button>
          )}
          {rental.status === "confirmed" && (
            <Button size="sm" variant="outline" onClick={() => onUpdate(rental.id, UpdateRentalBodyStatus.active)}>
              Activate
            </Button>
          )}
          {rental.status === "active" && (
            <Button size="sm" onClick={() => onUpdate(rental.id, UpdateRentalBodyStatus.returned)}>
              <Car className="w-3.5 h-3.5" /> Return Vehicle
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

export default function Rentals() {
  const { user } = useAuth();
  const { data: rentals, isLoading } = useListRentals();
  const createMutation = useCreateRental();
  const updateMutation = useUpdateRental();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicleType: CreateRentalBodyVehicleType.electric as CreateRentalBodyVehicleType,
    startDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const canRequest = user?.role === "owner" || user?.role === "admin";
  const canManage  = user?.role === "rental" || user?.role === "admin";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: { vehicleType: formData.vehicleType, startDate: formData.startDate, notes: formData.notes || undefined }
    }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/alset/rentals"] }); setIsModalOpen(false); }
    });
  };

  const handleUpdate = (id: number, status: UpdateRentalBodyStatus) => {
    updateMutation.mutate({ id, data: { status } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/alset/rentals"] })
    });
  };

  const active    = rentals?.filter(r => ["confirmed","active"].includes(r.status)).length ?? 0;
  const completed = rentals?.filter(r => r.status === "returned").length ?? 0;
  const revenue   = rentals?.filter(r => r.status === "returned").reduce((a, r) => a + (r.totalCost ?? 0), 0) ?? 0;

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Loaner Fleet</p>
          <h1 className="text-2xl font-display font-bold text-gradient-gold">Loaners & Rentals</h1>
          <p className="text-sm text-muted-foreground mt-1">Loaner vehicle management with direct insurance billing.</p>
        </div>
        {canRequest && <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4" /> Request Loaner</Button>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Bookings"  value={rentals?.length ?? 0} icon={CalendarDays} color="gold" />
        <StatCard label="Active Rentals"  value={active}               icon={Car}          color="green" />
        <StatCard label="Returned"        value={completed}            icon={CheckCircle}  color="blue" />
        <StatCard label="Revenue"         value={`$${revenue.toLocaleString()}`} icon={DollarSign} color="amber" />
      </div>

      {canManage && rentals?.some(r => r.status === "requested") && (
        <Alert type="info" title="Pending Confirmations">
          {rentals.filter(r => r.status === "requested").length} loaner request{rentals.filter(r => r.status === "requested").length > 1 ? "s" : ""} awaiting your confirmation.
        </Alert>
      )}

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : !rentals?.length ? (
        <Card><EmptyState icon={CalendarDays} title="No rental bookings" description="Request a loaner vehicle when your Tesla is in for repair." action={canRequest && <Button size="sm" onClick={() => setIsModalOpen(true)}><Plus className="w-3.5 h-3.5" /> Request</Button>} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {rentals.map((rental, i) => (
            <motion.div key={rental.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <RentalCard rental={rental} onUpdate={handleUpdate} canManage={canManage} />
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request Loaner Vehicle">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Vehicle Type Needed">
            <Select value={formData.vehicleType} onChange={e => setFormData({ ...formData, vehicleType: e.target.value as CreateRentalBodyVehicleType })}>
              {Object.values(CreateRentalBodyVehicleType).map(t => <option key={t} value={t} className="bg-[#0d1220] capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </Select>
          </FormField>
          <FormField label="Start Date">
            <Input type="date" required value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
          </FormField>
          <FormField label="Notes">
            <Textarea rows={3} placeholder="Any special requirements, preferred model, etc…" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Submit Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
