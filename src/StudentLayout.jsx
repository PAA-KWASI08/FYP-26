import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Home,
  Library,
  LogOut,
  BookOpen,
  Bell,
  QrCode,
} from "lucide-react";
import libraryImage from "./assets/images/balme-library.jpg";
import scan2seat from "./assets/images/scan2seat.png";
import { useStudentSession } from "./studentSession";
import AvailabilityReminder from "./AvailabilityReminder";

const navigationItems = [
  { label: "Home", to: "/dashboard", icon: Home, key: "home" },
  { label: "Sections", to: "/sections", icon: Library, key: "sections" },
  { label: "Check In", to: "/check-in", icon: QrCode, key: "check-in" },
  { label: "My Sessions", to: "/my-sessions", icon: BookOpen, key: "my-sessions" },
  { label: "Announcements", to: "/notifications", icon: Bell, key: "notifications" },
  { label: "How It Works", to: "/how-it-works", icon: CircleHelp, key: "how-it-works" },
];

export default function StudentLayout() {
  const [expanded, setExpanded] = useState(() => window.matchMedia("(min-width: 768px)").matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const updateForViewport = (event) => {
      if (!event.matches) setExpanded(false);
    };
    mediaQuery.addEventListener("change", updateForViewport);
    return () => mediaQuery.removeEventListener("change", updateForViewport);
  }, []);

  return <StudentLayoutFrame expanded={expanded} setExpanded={setExpanded} />;
}

function StudentLayoutFrame({ expanded, setExpanded }) {
  const location = useLocation();
  const [contentScrollTop, setContentScrollTop] = useState(0);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const contentRef = useRef(null);
  const warningRef = useRef(null);
  const pendingScrollRestore = useRef(null);
  const {
    session,
    checkInConfirmation,
    checkoutConfirmation,
    clearCheckInConfirmation,
    clearCheckoutConfirmation,
  } = useStudentSession();
  const activeSessionVisible = ["/dashboard", "/check-in", "/my-sessions"].includes(location.pathname);

  useLayoutEffect(() => {
    if (!warningDismissed || !pendingScrollRestore.current) return;

    const { scrollTop, warningHeight } = pendingScrollRestore.current;
    const restoredScrollTop = Math.max(0, scrollTop - warningHeight);
    if (contentRef.current) contentRef.current.scrollTop = restoredScrollTop;
    setContentScrollTop(restoredScrollTop);
    pendingScrollRestore.current = null;
  }, [warningDismissed]);

  useEffect(() => {
    if (!checkInConfirmation) return undefined;
    const timeout = window.setTimeout(() => {
      clearCheckInConfirmation();
      if (!session) setWarningDismissed(false);
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [checkInConfirmation, clearCheckInConfirmation, session]);

  useEffect(() => {
    if (!checkoutConfirmation) return undefined;
    const timeout = window.setTimeout(() => {
      clearCheckoutConfirmation();
      setWarningDismissed(false);
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [checkoutConfirmation, clearCheckoutConfirmation]);

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
                  <p className="text-sm text-white/75">Scan2Seat</p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  aria-label="Collapse sidebar"
                  aria-expanded="true"
                  title="Collapse sidebar"
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
              title="Expand sidebar"
              className="mt-5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}

          <nav aria-label="Student navigation" className="mt-6 flex min-h-0 shrink-0 flex-col gap-1">
            {navigationItems.map(({ label, to, icon: Icon, key }) => (
              <NavLink
                key={key}
                to={to}
                end={key === "home"}
                aria-label={label}
                title={expanded ? undefined : label}
                className={({ isActive }) => {
                  const selected = key === "sections"
                    ? location.pathname === "/sections" || location.pathname.startsWith("/seatmap/")
                    : isActive;
                  return `flex min-h-10 items-center rounded-lg text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                    expanded ? "gap-3 px-3" : "w-11 justify-center"
                  } ${
                    selected
                      ? "bg-[#5B5FC7] font-semibold text-white shadow-sm"
                      : "text-white/85 hover:bg-white/10 hover:text-white"
                  }`;
                }}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {expanded && <span className="min-w-0 truncate">{label}</span>}
                {expanded && key === "sections" && (
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-white/55" aria-hidden="true" />
                )}
              </NavLink>
            ))}
          </nav>

          <div className={`mt-auto border-t border-white/15 pt-3 ${expanded ? "" : "w-full"}`}>
            <button
              type="button"
              disabled
              aria-label="Logout is not available in this prototype"
              title={expanded ? undefined : "Logout unavailable"}
              className={`flex min-h-10 cursor-not-allowed items-center rounded-lg text-sm text-white/55 ${
                expanded ? "w-full gap-3 px-3" : "mx-auto w-11 justify-center"
              }`}
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              {expanded && <span>Logout unavailable</span>}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AvailabilityReminder
          session={session}
          checkInConfirmation={checkInConfirmation}
          checkoutConfirmation={checkoutConfirmation}
          activeSessionVisible={activeSessionVisible}
          contentScrollTop={contentScrollTop}
          warningDismissed={warningDismissed}
          warningRef={warningRef}
        />
        <div
          ref={contentRef}
          className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto"
          onScroll={(event) => {
            const scrollTop = event.currentTarget.scrollTop;
            if (
              !warningDismissed
              && !session
              && !checkInConfirmation
              && !checkoutConfirmation
              && scrollTop > Math.max(64, warningRef.current?.offsetHeight ?? 0)
            ) {
              pendingScrollRestore.current = {
                scrollTop,
                warningHeight: warningRef.current?.offsetHeight ?? 0,
              };
              setWarningDismissed(true);
            } else if (warningDismissed && scrollTop === 0) {
              setWarningDismissed(false);
            }
            setContentScrollTop(scrollTop);
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
