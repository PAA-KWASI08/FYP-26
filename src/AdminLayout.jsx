import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Armchair,
  ChevronLeft,
  ChevronRight,
  History,
  LayoutDashboard,
  Library,
  LogOut,
  UsersRound,
} from "lucide-react";
import libraryImage from "./assets/images/balme-library.jpg";
import scan2seat from "./assets/images/scan2seat.png";

const navigationItems = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Sections", to: "/admin/sections", icon: Library },
  { label: "Seats", to: "/admin/seats", icon: Armchair },
  { label: "Active Sessions", to: "/admin/active-sessions", icon: UsersRound },
  { label: "Usage & Analytics", to: "/admin/usage-analytics", icon: History },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(() => window.matchMedia("(min-width: 768px)").matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const updateForViewport = (event) => {
      if (!event.matches) setExpanded(false);
    };
    mediaQuery.addEventListener("change", updateForViewport);
    return () => mediaQuery.removeEventListener("change", updateForViewport);
  }, []);

  return (
    <div className="flex h-dvh w-full min-w-0 overflow-hidden bg-[#F5F5F5]">
      <aside
        className={`relative isolate flex h-full shrink-0 flex-col overflow-hidden border-r border-white/10 bg-cover bg-center text-white transition-[width] duration-200 ease-out ${
          expanded ? "w-[248px]" : "w-[68px]"
        }`}
        style={{ backgroundImage: `url(${libraryImage})` }}
      >
        <div className="absolute inset-0 z-0 bg-[#140B63]/90" aria-hidden="true" />
        <div className={`relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto ${expanded ? "p-4" : "items-center px-2 py-4"}`}>
          <div className={`flex items-center ${expanded ? "min-w-0 justify-between gap-2" : "justify-center"}`}>
            <img
              src={scan2seat}
              alt="Scan2Seat"
              className="h-12 w-12 shrink-0 rounded-full border border-white/30 object-cover"
            />
            {expanded && (
              <>
                <div className="min-w-0 flex-1">
                  <h1 className="text-3xl font-bold leading-none">SLM</h1>
                  <p className="mt-1 truncate text-sm font-medium">Student Library System</p>
                  <p className="text-sm text-white/75">Scan2Seat · Admin</p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  aria-label="Collapse sidebar"
                  aria-expanded="true"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
              </>
            )}
          </div>

          {!expanded && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label="Expand sidebar"
              aria-expanded="false"
              className="mt-5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}

          <nav aria-label="Admin navigation" className="mt-6 flex min-h-0 shrink-0 flex-col gap-1">
            {navigationItems.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                aria-label={label}
                title={expanded ? undefined : label}
                className={({ isActive }) => `flex min-h-10 items-center rounded-lg text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  expanded ? "gap-3 px-3" : "w-11 justify-center"
                } ${
                  isActive
                    ? "bg-[#5B5FC7] font-semibold text-white shadow-sm"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {expanded && <span className="min-w-0 truncate">{label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className={`mt-auto border-t border-white/15 pt-3 ${expanded ? "" : "w-full"}`}>
            <button
              type="button"
              onClick={() => navigate("/")}
              aria-label="Logout"
              title={expanded ? undefined : "Logout"}
              className={`flex min-h-10 items-center rounded-lg text-sm text-white/85 transition hover:bg-white/10 hover:text-white ${
                expanded ? "w-full gap-3 px-3" : "mx-auto w-11 justify-center"
              }`}
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              {expanded && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-black/10 bg-white px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5B5FC7]">Administration</p>
            <h1 className="text-lg font-bold text-[#140B63]">{navigationItems.find((item) => item.to === location.pathname)?.label ?? "Dashboard"}</h1>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-[#DDE3F2] bg-[#FCFCFF] px-3 py-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#140B63] text-sm font-semibold text-white" aria-hidden="true">
              A
            </span>
            <span className="hidden sm:block">
              <span className="block text-sm font-bold text-[#140B63]">Admin</span>
              <span className="block text-xs text-gray-500">Library Administrator</span>
            </span>
          </div>
        </header>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
