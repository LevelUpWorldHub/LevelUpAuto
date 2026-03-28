import React, { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Card ───────────────────────────────────────────────────────────────────

export function Card({ className, children, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "gold" | "metric" }) {
  return (
    <div
      className={cn(
        "card-4d",
        variant === "gold" && "card-gold",
        variant === "metric" && "card-metric",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4 border-b border-border/60 flex items-center justify-between gap-4", className)}>{children}</div>;
}

export function CardTitle({ className, children }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-display font-semibold tracking-tight text-foreground", className)}>{children}</h3>;
}

export function CardContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function CardFooter({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-3.5 border-t border-border/60 bg-black/10", className)}>{children}</div>;
}

// ─── Button ──────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "gold";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({ className, variant = "primary", size = "md", loading, children, disabled, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 select-none";
  const variants = {
    primary:     "bg-gold text-background hover:bg-gold-bright shadow-md shadow-gold/20",
    gold:        "bg-gold text-background hover:bg-gold-bright shadow-md shadow-gold/20",
    secondary:   "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline:     "border border-border hover:border-gold/35 hover:bg-gold/5 text-foreground",
    ghost:       "hover:bg-white/[0.05] text-muted-foreground hover:text-foreground",
    destructive: "bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25",
  };
  const sizes = { xs: "px-2.5 py-1 text-xs", sm: "px-3.5 py-1.5 text-xs", md: "px-5 py-2.5 text-sm", lg: "px-7 py-3.5 text-base" };
  return (
    <button disabled={disabled || loading} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {loading && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────

export const Input = React.forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn("field-input", className)} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn("field-textarea min-h-[80px]", className)} {...props} />
  )
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn("field-select", className)} {...props}>{children}</select>
  )
);
Select.displayName = "Select";

// ─── Badge / Status ──────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, string> = {
  // claims
  submitted:      "badge-blue",
  "under-review": "badge-amber",
  approved:       "badge-green",
  paid:           "badge-green",
  denied:         "badge-red",
  closed:         "badge-silver",
  // work orders
  pending:        "badge-silver",
  assigned:       "badge-blue",
  "in-progress":  "badge-amber",
  "awaiting-parts":"badge-amber",
  completed:      "badge-green",
  cancelled:      "badge-red",
  // towing
  requested:      "badge-blue",
  "en-route":     "badge-amber",
  arrived:        "badge-purple",
  // rentals
  confirmed:      "badge-green",
  active:         "badge-green",
  returned:       "badge-silver",
  // priority
  high:           "badge-red",
  medium:         "badge-amber",
  low:            "badge-silver",
  critical:       "badge-red",
  // generic
  success:        "badge-green",
  warning:        "badge-amber",
  danger:         "badge-red",
  info:           "badge-blue",
  neutral:        "badge-silver",
  gold:           "badge-gold",
  default:        "badge-silver",
};

export function Badge({ children, variant, status, className }: { children: React.ReactNode; variant?: string; status?: string; className?: string }) {
  const key = status ?? variant ?? "default";
  const cls = STATUS_MAP[key] ?? "badge-silver";
  return <span className={cn(cls, className)}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge status={status} className="capitalize">{status.replace(/-/g, " ")}</Badge>;
}

// ─── Label ───────────────────────────────────────────────────────────────────

export function Label({ children, className }: React.HTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("field-label", className)}>{children}</label>;
}

// ─── Form Field ──────────────────────────────────────────────────────────────

export function FormField({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export function Modal({ isOpen, onClose, title, children, size = "md" }: {
  isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: "sm" | "md" | "lg" | "xl";
}) {
  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className={cn("fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2", widths[size])}>
            <div className="card-4d card-gold p-0 overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                <h2 className="font-display font-bold text-lg text-foreground">{title}</h2>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="px-6 py-5">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Alert ───────────────────────────────────────────────────────────────────

export function Alert({ type = "info", title, children }: { type?: "info" | "success" | "warning" | "error"; title?: string; children: React.ReactNode }) {
  const cfg = {
    info:    { cls: "bg-blue-500/10 border-blue-500/20 text-blue-300",   Icon: Info },
    success: { cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300", Icon: CheckCircle },
    warning: { cls: "bg-amber-500/10 border-amber-500/20 text-amber-300", Icon: AlertCircle },
    error:   { cls: "bg-red-500/10 border-red-500/20 text-red-300", Icon: AlertCircle },
  }[type];
  return (
    <div className={cn("flex gap-3 rounded-xl border p-4 text-sm", cfg.cls)}>
      <cfg.Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div>{title && <p className="font-semibold mb-1">{title}</p>}{children}</div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted/60", className)} />;
}

export function SkeletonCard() {
  return (
    <div className="card-4d p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

export function EmptyState({ icon: Icon, title, description, action }: { icon?: React.ComponentType<any>; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      {Icon && <div className="p-4 rounded-2xl bg-muted/30 text-muted-foreground"><Icon className="w-8 h-8" /></div>}
      <div>
        <p className="font-display font-semibold text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

export function StatCard({ label, value, icon: Icon, trend, color = "gold", sublabel }: {
  label: string; value: string | number; icon?: React.ComponentType<any>; trend?: { value: number; label: string };
  color?: "gold" | "blue" | "green" | "red" | "amber" | "purple"; sublabel?: string;
}) {
  const colors = {
    gold:   "text-gold bg-gold/10 border-gold/20",
    blue:   "text-blue-400 bg-blue-500/10 border-blue-500/20",
    green:  "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    red:    "text-red-400 bg-red-500/10 border-red-500/20",
    amber:  "text-amber-400 bg-amber-500/10 border-amber-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };
  return (
    <div className="card-4d card-metric p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        {Icon && <div className={cn("p-2 rounded-xl border", colors[color])}><Icon className="w-4 h-4" /></div>}
      </div>
      <p className="text-3xl font-display font-bold text-foreground">{value}</p>
      {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
      {trend && (
        <p className={cn("text-xs font-semibold mt-2", trend.value >= 0 ? "text-emerald-400" : "text-red-400")}>
          {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

export function SectionHeader({ title, icon: Icon, action, className }: { title: string; icon?: React.ComponentType<any>; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <h2 className="text-sm font-display font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
        {Icon && <Icon className="w-4 h-4 text-gold" />}
        {title}
      </h2>
      {action}
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

export function Divider({ className, gold }: { className?: string; gold?: boolean }) {
  return <div className={cn(gold ? "divider-gold" : "divider", className)} />;
}

// ─── Progress Bar ────────────────────────────────────────────────────────────

export function ProgressBar({ value, max = 100, className }: { value: number; max?: number; className?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={cn("progress", className)}>
      <div className="progress-bar" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Gold Line Accent ────────────────────────────────────────────────────────

export function GoldLine() {
  return <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent my-1" />;
}

// ─── Tooltip (basic) ─────────────────────────────────────────────────────────

export function Dot({ color = "gold" }: { color?: "gold" | "green" | "red" | "blue" | "amber" }) {
  const colors = { gold: "bg-gold", green: "bg-emerald-400", red: "bg-red-400", blue: "bg-blue-400", amber: "bg-amber-400" };
  return <span className={cn("inline-block w-2 h-2 rounded-full flex-shrink-0", colors[color])} />;
}
