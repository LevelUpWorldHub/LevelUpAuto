import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Car, FileText, Wrench, Truck, CalendarDays,
  LogOut, ChevronLeft, ChevronRight, Bell, Settings, Hexagon,
  Shield, User, Building2
} from "lucide-react";
import { cn } from "./ui-elements";

const NAV_ITEMS = [
  { path: "/dashboard",   label: "Dashboard",         icon: LayoutDashboard, roles: ["owner","shop","insurer","towing","rental","admin"] },
  { path: "/vehicles",    label: "My Vehicles",        icon: Car,             roles: ["owner","admin"] },
  { path: "/claims",      label: "Insurance Claims",   icon: FileText,        roles: ["owner","insurer","admin"] },
  { path: "/work-orders", label: "Work Orders",        icon: Wrench,          roles: ["owner","shop","admin"] },
  { path: "/towing",      label: "Towing & Dispatch",  icon: Truck,           roles: ["owner","towing","admin"] },
  { path: "/rentals",     label: "Loaners & Rentals",  icon: CalendarDays,    roles: ["owner","rental","admin"] },
];

const ROLE_CONFIG: Record<string, { label: string; Icon: React.ComponentType<any>; color: string }> = {
  owner:   { label: "Tesla Owner",      Icon: User,      color: "text-gold" },
  shop:    { label: "Repair Shop",      Icon: Wrench,    color: "text-blue-400" },
  insurer: { label: "Insurance",        Icon: Shield,    color: "text-emerald-400" },
  towing:  { label: "Towing",           Icon: Truck,     color: "text-amber-400" },
  rental:  { label: "Rental Co.",       Icon: CalendarDays, color: "text-purple-400" },
  admin:   { label: "Administrator",    Icon: Building2, color: "text-red-400" },
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const role = user?.role ?? "owner";
  const items = NAV_ITEMS.filter(i => i.roles.includes(role));
  const roleInfo = ROLE_CONFIG[role] ?? ROLE_CONFIG.owner;
  const RoleIcon = roleInfo.Icon;

  return (
    <div className="min-h-screen bg-background text-foreground flex amb">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="flex-shrink-0 flex flex-col border-r border-border relative z-20"
        style={{ background: "linear-gradient(180deg, hsl(220 28% 6%) 0%, hsl(220 28% 5%) 100%)" }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-border/60 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{ background: "linear-gradient(135deg, hsl(var(--gold)) 0%, hsl(var(--gold-dim)) 100%)" }}>
            <Hexagon className="w-5 h-5 text-background fill-current opacity-70" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.18 }}
                className="font-display font-bold text-xl text-gradient-gold whitespace-nowrap">
                Alset
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {items.map(item => {
            const isActive = location === item.path || location.startsWith(item.path + "/");
            return (
              <Link key={item.path} href={item.path}>
                <div className={cn("nav-link group", isActive && "active")}>
                  <item.icon className={cn("icon flex-shrink-0", isActive ? "text-gold" : "text-muted-foreground group-hover:text-foreground")} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                        className="whitespace-nowrap overflow-hidden text-ellipsis">
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && <motion.div layoutId="nav-pill" className="absolute inset-0 rounded-xl bg-gold/10 border border-gold/18 -z-10" initial={false} transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-border/60 p-3 space-y-2">
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-2 py-2.5 rounded-xl bg-white/[0.03] border border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center bg-gold/10 flex-shrink-0")}>
                    <RoleIcon className={cn("w-3.5 h-3.5", roleInfo.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{roleInfo.label}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={logout}
            className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-all duration-200", collapsed && "justify-center")}>
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3.5 top-[72px] w-7 h-7 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-gold hover:border-gold/30 transition-all duration-200 z-30 shadow-lg">
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border/60 bg-background/80 backdrop-blur-xl flex-shrink-0">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">
              {items.find(i => i.path === location)?.label ?? "Alset Platform"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl hover:bg-white/[0.05] text-muted-foreground hover:text-foreground transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-gold" />
            </button>
            <button className="p-2 rounded-xl hover:bg-white/[0.05] text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <div className="ml-1 pl-3 border-l border-border/60 flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gold/15 border border-gold/25 flex items-center justify-center">
                <span className="text-xs font-bold text-gold">{user?.name?.[0] ?? "U"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div key={location} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
            className="p-6 lg:p-8 max-w-[1400px] mx-auto min-h-full">
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
