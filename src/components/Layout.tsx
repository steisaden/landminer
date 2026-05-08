import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar, SidebarNav } from "./Sidebar";
import { Toaster } from "./ui/sonner";
import { GlobalSearch } from "./GlobalSearch";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Menu } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { Brand } from "./Brand";

export function Layout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { planId } = useAppStore();

  return (
    <div className="flex bg-slate-50 overflow-hidden font-sans text-slate-900 w-full min-h-dvh">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex flex-col gap-3 px-4 sm:px-8 py-3 border-b border-slate-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-3 sm:hidden">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger
                render={
                  <Button variant="outline" size="icon" className="shrink-0 bg-white">
                    <Menu className="h-4 w-4" />
                  </Button>
                }
              />
              <SheetContent side="left" className="w-[84vw] max-w-sm bg-slate-900 text-white border-slate-800 p-0">
                <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                  <Brand variant="icon" className="min-w-0" />
                  <div>
                    <p className="font-semibold text-white">Navigate</p>
                  </div>
                </div>
                <SidebarNav
                  onNavigate={() => setMobileNavOpen(false)}
                  className="flex-1 px-4 py-4 space-y-1 overflow-y-auto"
                  linkClassName="text-slate-200 hover:bg-slate-800"
                />
                <div className="p-4 border-t border-slate-800">
                  <p className="text-xs text-blue-300 font-semibold mb-1">{planId === "free" ? "FREE PLAN" : `${planId.toUpperCase()} PLAN`}</p>
                  <p className="text-sm text-slate-300">
                    {planId === "free"
                      ? "Limited access — upgrade to Foundation for AI follow-ups and more capacity."
                      : planId === "foundation"
                        ? "Foundation active — upgrade to Operator for more throughput."
                        : planId === "operator"
                          ? "Operator active — upgrade to Atlas for the deepest workflow."
                          : "Atlas active — the top workflow tier is enabled."}
                  </p>
                </div>
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <Brand variant="icon" className="items-center" />
              <h1 className="sr-only">Mobile navigation</h1>
            </div>
          </div>

          <div className="flex-1 sm:max-w-2xl">
            <GlobalSearch />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 min-w-0 p-4 sm:p-8 relative">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  );
}
