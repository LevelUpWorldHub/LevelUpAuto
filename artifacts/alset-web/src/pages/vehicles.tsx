import React, { useState } from "react";
import { useListVehicles, useCreateVehicle, CreateVehicleBodyModel } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Input, Select, FormField, Modal, StatCard, SectionHeader, EmptyState, SkeletonCard, Badge } from "@/components/ui-elements";
import { cn } from "@/components/ui-elements";
import { motion } from "framer-motion";
import { Plus, Car, Gauge, Calendar, Hash, MapPin, Cpu, Shield, Zap, Activity } from "lucide-react";

const MODEL_SPECS: Record<string, { range: string; topSpeed: string; accel: string; motor: string }> = {
  "Model S":   { range: "405 mi",  topSpeed: "200 mph",  accel: "1.99s 0-60", motor: "Tri-Motor AWD" },
  "Model 3":   { range: "358 mi",  topSpeed: "162 mph",  accel: "3.1s 0-60",  motor: "Dual-Motor AWD" },
  "Model X":   { range: "348 mi",  topSpeed: "163 mph",  accel: "2.5s 0-60",  motor: "Tri-Motor AWD" },
  "Model Y":   { range: "330 mi",  topSpeed: "155 mph",  accel: "3.5s 0-60",  motor: "Dual-Motor AWD" },
  "Cybertruck":{ range: "340 mi",  topSpeed: "130 mph",  accel: "2.7s 0-60",  motor: "Tri-Motor AWD" },
  "Roadster":  { range: "620 mi",  topSpeed: "250 mph+", accel: "1.9s 0-60",  motor: "Tri-Motor AWD" },
};

const MODEL_COLORS: Record<string, string> = {
  "Model S": "text-blue-400",
  "Model 3": "text-gold",
  "Model X": "text-purple-400",
  "Model Y": "text-emerald-400",
  "Cybertruck": "text-silver",
  "Roadster": "text-red-400",
};

export default function Vehicles() {
  const { user } = useAuth();
  const { data: vehicles, isLoading } = useListVehicles();
  const createMutation = useCreateVehicle();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    model: CreateVehicleBodyModel.Model_3 as CreateVehicleBodyModel,
    year: new Date().getFullYear(),
    vin: "",
    color: "",
    licensePlate: "",
    mileage: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: { ...formData, year: Number(formData.year), mileage: formData.mileage ? Number(formData.mileage) : undefined }
    }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/alset/vehicles"] }); setIsModalOpen(false); }
    });
  };

  const canAdd = user?.role === "owner" || user?.role === "admin";

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Fleet Registry</p>
          <h1 className="text-2xl font-display font-bold text-gradient-gold">My Vehicles</h1>
          <p className="text-sm text-muted-foreground mt-1">Registered Tesla vehicles and diagnostic status.</p>
        </div>
        {canAdd && (
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Register Vehicle
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Registered" value={vehicles?.length ?? 0} icon={Car} color="gold" />
        <StatCard label="Active Repairs" value={1} icon={Cpu} color="amber" />
        <StatCard label="ADAS Status" value="2/2 OK" icon={Shield} color="green" />
        <StatCard label="Avg Mileage" value={vehicles?.length ? Math.round(vehicles.reduce((a, v) => a + (v.mileage ?? 0), 0) / vehicles.length).toLocaleString() : 0} icon={Gauge} color="blue" sublabel="miles" />
      </div>

      {/* Vehicle cards */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : !vehicles?.length ? (
        <Card><EmptyState icon={Car} title="No vehicles registered" description="Add your Tesla to start tracking repairs, claims, and diagnostics." action={canAdd && <Button onClick={() => setIsModalOpen(true)} size="sm"><Plus className="w-3.5 h-3.5" /> Register</Button>} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {vehicles.map((v, i) => {
            const specs = MODEL_SPECS[v.model] ?? MODEL_SPECS["Model 3"];
            const mColor = MODEL_COLORS[v.model] ?? "text-gold";
            return (
              <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card variant="gold" className="overflow-hidden">
                  {/* Header stripe */}
                  <div className="px-5 pt-5 pb-4 border-b border-border/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={cn("text-xl font-display font-bold", mColor)}>{v.model}</p>
                        <p className="text-sm text-muted-foreground">{v.year} · {v.color}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground font-mono">{v.vin}</p>
                        <p className="text-xs text-gold font-semibold mt-1">{v.licensePlate}</p>
                      </div>
                    </div>
                  </div>

                  <CardContent className="space-y-4">
                    {/* Specs grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Range",     value: specs.range,    icon: Zap },
                        { label: "0–60",      value: specs.accel,    icon: Activity },
                        { label: "Drivetrain",value: specs.motor,    icon: Cpu },
                        { label: "Mileage",   value: v.mileage ? `${v.mileage.toLocaleString()} mi` : "—", icon: Gauge },
                      ].map(s => (
                        <div key={s.label} className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                            <s.icon className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                            <p className="text-xs font-semibold text-foreground">{s.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ADAS / Diagnostic status */}
                    <div className="rounded-xl bg-muted/20 border border-border/50 divide-y divide-border/40">
                      {[
                        { label: "Autopilot Cameras",    status: "ok" },
                        { label: "Ultrasonic Sensors",   status: "ok" },
                        { label: "FSD Hardware",         status: v.model === "Model 3" ? "recalibration" : "ok" },
                      ].map(d => (
                        <div key={d.label} className="flex items-center justify-between px-3 py-2">
                          <span className="text-xs text-muted-foreground">{d.label}</span>
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider", d.status === "ok" ? "text-emerald-400" : "text-amber-400")}>
                            {d.status === "ok" ? "✓ OK" : "⚠ Needed"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Register Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Tesla Vehicle">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Model">
              <Select className="field-select" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value as CreateVehicleBodyModel })}>
                {Object.values(CreateVehicleBodyModel).map(m => <option key={m} value={m} className="bg-[#0d1220]">{m}</option>)}
              </Select>
            </FormField>
            <FormField label="Year">
              <Input type="number" required min="2012" max="2030" value={formData.year} onChange={e => setFormData({ ...formData, year: Number(e.target.value) })} />
            </FormField>
          </div>
          <FormField label="VIN (17 characters)">
            <Input required placeholder="5YJ3E1EA1PF123456" maxLength={17} value={formData.vin} onChange={e => setFormData({ ...formData, vin: e.target.value.toUpperCase() })} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Color">
              <Input required placeholder="Pearl White" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
            </FormField>
            <FormField label="License Plate">
              <Input required placeholder="ALSET01" value={formData.licensePlate} onChange={e => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })} />
            </FormField>
          </div>
          <FormField label="Current Mileage">
            <Input type="number" placeholder="Optional" value={formData.mileage} onChange={e => setFormData({ ...formData, mileage: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Register Vehicle</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
