import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useListServices, useCreateAppointment } from "@workspace/api-client-react";
import { Calendar, Car, Info, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(10, "Valid phone number required"),
  serviceId: z.coerce.number().min(1, "Please select a service"),
  vehicleMake: z.string().min(2, "Vehicle make is required"),
  vehicleModel: z.string().min(1, "Vehicle model is required"),
  vehicleYear: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  preferredDate: z.string().min(1, "Please select a date"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function BookAppointment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: services, isLoading: servicesLoading } = useListServices();
  const createAppointment = useCreateAppointment();
  const [isSuccess, setIsSuccess] = useState(false);

  // Parse service from URL if passed
  const searchParams = new URLSearchParams(window.location.search);
  const defaultServiceId = searchParams.get("service") ? parseInt(searchParams.get("service")!) : 0;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      serviceId: defaultServiceId,
      vehicleMake: "",
      vehicleModel: "",
      vehicleYear: new Date().getFullYear(),
      preferredDate: "",
      notes: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await createAppointment.mutateAsync({ data });
      setIsSuccess(true);
      toast({
        title: "Appointment Booked!",
        description: "We'll be in touch shortly to confirm your slot.",
      });
      setTimeout(() => setLocation("/"), 3000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: "There was an error booking your appointment. Please try again.",
      });
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center bg-background">
        <div className="bg-card p-12 rounded-3xl border border-border text-center max-w-lg mx-4">
          <div className="w-20 h-20 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black font-display mb-4">REQUEST RECEIVED</h2>
          <p className="text-muted-foreground mb-8">
            Thank you for choosing LevelUpAuto. Our service team will review your request and contact you to confirm the exact time.
          </p>
          <div className="text-sm text-muted-foreground">Redirecting to homepage...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background relative">
      <div className="absolute top-0 left-0 w-full h-96 bg-card border-b border-border -z-10" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black font-display mb-4">BOOK <span className="text-primary">APPOINTMENT</span></h1>
          <p className="text-muted-foreground">Fill out the form below to request a service slot.</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-2xl">
          {/* Section 1: Vehicle */}
          <div className="mb-12">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <Car className="text-primary w-6 h-6" />
              <h2 className="text-xl font-bold font-display">Vehicle Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Make</label>
                <input
                  {...form.register("vehicleMake")}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. Porsche"
                />
                {form.formState.errors.vehicleMake && <p className="text-destructive text-sm mt-1">{form.formState.errors.vehicleMake.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Model</label>
                <input
                  {...form.register("vehicleModel")}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. 911 GT3"
                />
                {form.formState.errors.vehicleModel && <p className="text-destructive text-sm mt-1">{form.formState.errors.vehicleModel.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Year</label>
                <input
                  type="number"
                  {...form.register("vehicleYear")}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. 2022"
                />
                {form.formState.errors.vehicleYear && <p className="text-destructive text-sm mt-1">{form.formState.errors.vehicleYear.message}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Service & Date */}
          <div className="mb-12">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <Calendar className="text-primary w-6 h-6" />
              <h2 className="text-xl font-bold font-display">Service Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Requested Service</label>
                <select
                  {...form.register("serviceId")}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                  disabled={servicesLoading}
                >
                  <option value={0}>Select a service...</option>
                  {services?.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>
                  ))}
                </select>
                {form.formState.errors.serviceId && <p className="text-destructive text-sm mt-1">{form.formState.errors.serviceId.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Preferred Date</label>
                <input
                  type="date"
                  {...form.register("preferredDate")}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                {form.formState.errors.preferredDate && <p className="text-destructive text-sm mt-1">{form.formState.errors.preferredDate.message}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Personal Info */}
          <div className="mb-12">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <Info className="text-primary w-6 h-6" />
              <h2 className="text-xl font-bold font-display">Contact Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Full Name</label>
                <input
                  {...form.register("customerName")}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="John Doe"
                />
                {form.formState.errors.customerName && <p className="text-destructive text-sm mt-1">{form.formState.errors.customerName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Phone Number</label>
                <input
                  type="tel"
                  {...form.register("customerPhone")}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="(555) 123-4567"
                />
                {form.formState.errors.customerPhone && <p className="text-destructive text-sm mt-1">{form.formState.errors.customerPhone.message}</p>}
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">Email Address</label>
              <input
                type="email"
                {...form.register("customerEmail")}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="john@example.com"
              />
              {form.formState.errors.customerEmail && <p className="text-destructive text-sm mt-1">{form.formState.errors.customerEmail.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Additional Notes (Optional)</label>
              <textarea
                {...form.register("notes")}
                rows={4}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                placeholder="Any specific issues or requests?"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createAppointment.isPending}
            className="w-full py-5 rounded-xl bg-primary text-white font-black text-xl hover:bg-primary/90 transition-all active:scale-[0.98] box-glow disabled:opacity-50 disabled:pointer-events-none"
          >
            {createAppointment.isPending ? "Submitting Request..." : "CONFIRM BOOKING REQUEST"}
          </button>
        </form>
      </div>
    </div>
  );
}
