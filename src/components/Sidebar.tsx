import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Trello,
  Settings,
  Home,
  CalendarCheck,
  Upload,
  LogOut,
  Map as MapIcon,
  Sparkles,
  Camera,
  FileText,
  MessageSquare,
} from "lucide-react";
import { cn } from "../lib/utils";
import { logout } from "../lib/firebase";

const navSections = [
  {
    label: "Overview",
    items: [{ name: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "Lead Ops",
    items: [
      { name: "Lead Inbox", href: "/leads", icon: Users },
      { name: "Pipeline", href: "/pipeline", icon: Trello },
      { name: "Follow-Ups", href: "/follow-ups", icon: CalendarCheck },
    ],
  },
  {
    label: "Deal Discovery",
    items: [
      { name: "Opportunities", href: "/opportunities", icon: Sparkles },
      { name: "Property Map", href: "/map", icon: MapIcon },
      { name: "Drive for Dollars", href: "/drive-for-dollars", icon: Camera },
      { name: "Import", href: "/import", icon: Upload },
    ],
  },
  {
    label: "AI & Docs",
    items: [
      { name: "Chat with Pipeline", href: "/ask", icon: MessageSquare },
      { name: "Contracts & Docs", href: "/contracts", icon: FileText },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="w-64 bg-slate-900 flex flex-col shrink-0 h-full">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
          <Home className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">LandMiner CRM</span>
      </div>

      <nav className="flex-1 px-4 space-y-5 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label} className="space-y-1">
            <p className="px-3 text-[11px] uppercase tracking-[0.2em] text-slate-500">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== "/" && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                      isActive
                        ? "bg-slate-800 text-white font-medium"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 space-y-4">
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-blue-400 font-semibold mb-1">PRO PLAN</p>
          <p className="text-white text-xs">Unlimited Leads & AI Texting Active.</p>
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
