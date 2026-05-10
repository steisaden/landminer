import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Trello, Settings, CalendarCheck, Upload, LogOut, Map as MapIcon, Sparkles, Camera, FileText, MessageSquare, Radar, BadgeDollarSign } from "lucide-react";
import { cn } from "../lib/utils";
import { logout } from "../lib/firebase";
import { useAppStore } from "../store/useAppStore";
import { Brand } from "./Brand";

export const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Lead Inbox", href: "/leads", icon: Users },
  { name: "Opportunities", href: "/opportunities", icon: Sparkles },
  { name: "Drive for Dollars", href: "/drive-for-dollars", icon: Camera },
  { name: "Property Map", href: "/map", icon: MapIcon },
  { name: "Contracts & Docs", href: "/contracts", icon: FileText },
  { name: "Signals & Outreach", href: "/signals", icon: Radar },
  { name: "Chat with Pipeline", href: "/ask", icon: MessageSquare },
  { name: "Pipeline", href: "/pipeline", icon: Trello },
  { name: "Follow-Ups", href: "/follow-ups", icon: CalendarCheck },
  { name: "Import", href: "/import", icon: Upload },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Pricing", href: "/pricing", icon: BadgeDollarSign },
];

type SidebarNavProps = {
  onNavigate?: () => void;
  className?: string;
  linkClassName?: string;
};

export function SidebarNav({ onNavigate, className, linkClassName }: SidebarNavProps) {
  const location = useLocation();

  return (
    <nav className={className ?? "flex-1 px-4 space-y-1"}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
              isActive
                ? "bg-slate-800 text-white font-medium"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50",
              linkClassName
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const { planId } = useAppStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="hidden lg:flex w-64 bg-slate-900 flex-col shrink-0 h-full">
      <div className="p-6">
        <Brand variant="logo" className="items-center" imageClassName="h-20 w-auto" />
      </div>
      <SidebarNav />
      <div className="p-4 space-y-4">
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-blue-400 font-semibold mb-1">{planId === "free" ? "FREE PLAN" : `${planId.toUpperCase()} PLAN`}</p>
          <p className="text-white text-xs">
            {planId === "free"
              ? "Limited access — upgrade to Foundation for AI follow-ups and more capacity."
              : planId === "foundation"
                ? "Foundation active — upgrade to Operator for more throughput."
                : planId === "operator"
                  ? "Operator active — upgrade to Atlas for the deepest workflow."
                  : "Atlas active — the top workflow tier is enabled."}
          </p>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-md transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
