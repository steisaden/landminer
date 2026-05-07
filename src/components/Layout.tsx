import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Toaster } from "./ui/sonner";
import { GlobalSearch } from "./GlobalSearch";

export function Layout() {
  return (
    <div className="flex bg-slate-50 overflow-hidden font-sans text-slate-900 w-full h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-slate-200 bg-white flex-shrink-0">
          <div className="flex-1 max-w-2xl">
            <GlobalSearch />
          </div>
          {/* We can put user profile / notifications here later */}
        </header>
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 min-w-0 p-4 sm:p-8 relative">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  );
}
