import { useEffect, useState } from "react";
import {
  Armchair,
  Users,
  AlertTriangle,
  Clock3,
  Library,
  Info,
  CircleHelp,
  CheckCircle2,
  History,
  QrCode,
  ChevronRight,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { getLibraryAvailability } from "./sections";
import { useStudentSession } from "./studentSession";
import ConfirmationDialog from "./ConfirmationDialog";
import StudentProfileMenu from "./StudentProfileMenu";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sections, session, lastSession, checkout, currentStudentId, student } = useStudentSession();
  const [now, setNow] = useState(() => Date.now());
  const [pendingCheckoutSession, setPendingCheckoutSession] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");
  const availability = getLibraryAvailability(sections);

  useEffect(() => {
    if (session?.sessionStatus !== "active") return undefined;

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [session]);

  useEffect(() => {
    if (location.hash === "#current-session") {
      requestAnimationFrame(() => {
        document.getElementById("current-session")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [location.hash]);

  const formatTime = (date) =>
    new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);

  const formatDuration = (start, end) => {
    const minutes = Math.max(0, Math.floor((end - start) / 60000));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
  };

  const confirmCheckout = () => {
    const result = checkout(pendingCheckoutSession?.id, currentStudentId);
    if (!result.ok) setCheckoutError(result.message);
    setPendingCheckoutSession(null);
  };

  const quickActions = [
    {
      title: "View Sections",
      description: "Check availability by library section.",
      icon: Library,
      iconTone: "bg-[#EEF2FF] text-[#373B83]",
      onClick: () => navigate("/sections"),
    },
    {
      title: "Check In",
      description: "Scan your seat code or enter the seat ID to start your study session.",
      icon: QrCode,
      iconTone: "bg-[#EAF3FA] text-[#244A70]",
      onClick: () => navigate("/check-in"),
    },
    {
      title: "Study History",
      description: "View your previous study sessions.",
      icon: History,
      iconTone: "bg-[#EDF4F3] text-[#315C5B]",
      onClick: () => navigate("/my-sessions"),
    },
    {
      title: "How Scan2Seat Works",
      description: "Learn how to find and check in to an available seat.",
      icon: CircleHelp,
      iconTone: "bg-[#F1EEFA] text-[#51427C]",
      tooltip: "See how to find an available seat, check in, study and check out.",
      onClick: () => navigate("/how-it-works"),
    },
  ];

  return (
    <div className="dashboard-page flex min-h-full w-full min-w-0 flex-col bg-[#F5F5F5]">
      <div className="dashboard-content flex flex-1 w-full min-w-0 flex-col p-3 sm:p-4 pb-5">
        <div className="dashboard-stack flex flex-1 flex-col gap-3">
          {/* TOP BAR */}
          <div className="dashboard-topbar flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-[10px] uppercase tracking-[0.16em] text-[#140B63]">
                Welcome Back,
              </h2>

              <h1 className="text-3xl sm:text-4xl font-bold mt-1 truncate" title={student.fullName}>{student.fullName}</h1>
            </div>

            <StudentProfileMenu />
          </div>

          <div className="dashboard-divider mt-2 border-b border-black/10" />

          {/* STATS */}
          <h2 className="dashboard-stats-heading mt-2 text-lg font-bold text-[#140B63]">Current Availability</h2>
          <p className="dashboard-stats-note text-xs text-gray-500">Mock availability figures for the prototype</p>
          <div className="dashboard-stats mt-2 grid auto-rows-fr grid-cols-2 xl:grid-cols-4 gap-2 items-stretch">
            <div className="dashboard-stat-card order-1 min-h-[76px] bg-white p-3 rounded-xl border flex flex-col justify-between">
              <div className="flex items-start gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#E7E6EC] flex items-center justify-center flex-shrink-0">
                  <Armchair className="w-4 h-4 text-[#140B63]" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-2xl xl:text-3xl font-bold">{availability.total}</h1>
                  <h2 className="font-bold text-base xl:text-lg line-clamp-1">Total Seats</h2>
                </div>
              </div>
            </div>

            <div className="dashboard-stat-card order-2 min-h-[76px] bg-white p-3 rounded-xl border flex flex-col justify-between">
              <div className="flex items-start gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#DDE4DE] flex items-center justify-center flex-shrink-0">
                  <Armchair className="w-4 h-4 text-[#140B63]" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-2xl xl:text-3xl font-bold">{availability.available}</h1>
                  <h2 className="font-bold text-base xl:text-lg line-clamp-1">Available</h2>
                </div>
              </div>
            </div>

            <div className="dashboard-stat-card order-3 min-h-[76px] bg-white p-3 rounded-xl border flex flex-col justify-between">
              <div className="flex items-start gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#F1DADA] flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-[#140B63]" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-2xl xl:text-3xl font-bold">{availability.occupied}</h1>
                  <h2 className="font-bold text-base xl:text-lg line-clamp-1">Occupied Seats</h2>
                  <p className="text-gray-500 text-sm line-clamp-2">Currently in use</p>
                </div>
              </div>
            </div>

            <div className="dashboard-stat-card order-4 min-h-[76px] bg-white p-3 rounded-xl border flex flex-col justify-between">
              <div className="flex items-start gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#ECE7CF] flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-[#140B63]" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-2xl xl:text-3xl font-bold">{availability.unavailable}</h1>
                  <h2 className="font-bold text-base xl:text-lg line-clamp-1">Unavailable</h2>
                  <p className="text-gray-500 text-sm line-clamp-2">Not available for use</p>
                </div>
              </div>
            </div>

          </div>

          <div className="dashboard-session-grid mt-2 grid grid-cols-1 gap-3 items-stretch">
            {/* CURRENT SESSION */}
            <section
            id="current-session"
            className={`dashboard-session-card h-full rounded-xl border p-3 shadow-sm transition-colors sm:p-4 ${
              session
                ? "border-[#C9C8EC] bg-[#F8F9FF] shadow-[#140B63]/5"
                : "border-[#DDE3F2] bg-[#FCFCFF]"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base xl:text-lg font-bold">My Current Session</h2>
              <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                session
                  ? "bg-[#E8EAF8] text-[#343A78]"
                  : "bg-slate-100 text-slate-600"
              }`}>
                {session ? "Active" : "No active session"}
              </span>
            </div>

            {session ? (
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="rounded-xl border border-[#DCE2F0] bg-white/80 p-3">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Section</p>
                      <p className="font-semibold text-[#140B63]">{session.section}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Seat</p>
                      <p className="font-semibold text-[#140B63]">{session.seat}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Started</p>
                      <p className="font-semibold text-[#140B63]">{formatTime(session.checkInTime)}</p>
                    </div>
                    <div className="ml-auto">
                      <p className="text-xs text-gray-500">Study time</p>
                      <p className="text-lg font-bold text-[#140B63]">
                        {formatDuration(session.checkInTime, new Date(now))}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Frontend demo session; this is not saved.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutError("");
                    setPendingCheckoutSession(session);
                  }}
                  className="rounded-lg bg-[#140B63] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#251b79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
                >
                  Check Out
                </button>
              </div>
            ) : (
              <div className="dashboard-empty-session mt-3 flex flex-col gap-3">
                <div className="dashboard-empty-session-content flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div                     className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#EEF0FA] text-[#140B63]">
                      {lastSession ? <CheckCircle2 className="h-6 w-6" /> : <Clock3 className="h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className="font-semibold">No active session</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Start by checking in to an available seat.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/sections")}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#5B5FC7] px-4 py-2 text-sm font-semibold text-[#140B63] transition hover:bg-[#F2F2FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
                  >
                    View Available Seats
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {checkoutError && (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
                {checkoutError}
              </p>
            )}

            {lastSession && !session && (
              <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <h3 className="font-semibold">Last session completed</h3>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                  <p><span className="text-gray-500">Location:</span> {lastSession.section} · {lastSession.seat}</p>
                  <p><span className="text-gray-500">Study time:</span> {formatDuration(lastSession.checkInTime, lastSession.checkOutTime)}</p>
                  <p><span className="text-gray-500">Checked out:</span> {formatTime(lastSession.checkOutTime)}</p>
                </div>
              </div>
            )}
          </section>

          {/* QUICK ACTIONS */}
          <section className="dashboard-quick-card h-full rounded-xl border border-[#DDE3F2] bg-[#FCFCFF] p-3 shadow-sm sm:p-4">
            <h2 className="text-base xl:text-lg font-bold mb-2">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {quickActions.map(({ title, description, icon: Icon, iconTone, onClick, tooltip }) => (
                <button
                  key={title}
                  type="button"
                  onClick={onClick}
                  className="dashboard-quick-action group relative min-h-[92px] rounded-lg border border-[#E5E9F3] bg-white p-3 text-left shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-[#C9C8EC] hover:bg-[#F8F9FF] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
                >
                  <div className="flex items-center gap-2">
                    <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${iconTone}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="font-semibold text-base line-clamp-1">{title}</h3>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 line-clamp-2">{description}</p>
                  {tooltip && (
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 translate-y-1 rounded-lg bg-[#140B63] px-3 py-2 text-center text-xs font-medium text-white opacity-0 shadow-lg transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
                    >
                      {tooltip}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
          </div>

          {/* ANNOUNCEMENTS */}
          <div className="dashboard-announcements bg-white p-2 rounded-xl border mt-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base xl:text-lg font-bold">Library Announcements</h2>
              <button className="text-[#140B63] font-semibold text-[11px] hover:underline">
                View all
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="flex items-start gap-2 rounded-xl border border-[#E5E8E5] p-2 bg-[#F8FAFC] min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#F0EEF8] flex items-center justify-center text-[#4C3D9A] flex-shrink-0">
                  <Info className="w-4 h-4" />
                </div>
                <p className="font-semibold text-sm xl:text-base line-clamp-3">Group study rooms are offline for maintenance.</p>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-[#E5E8E5] p-2 bg-[#F8FAFC] min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#F0EEF8] flex items-center justify-center text-[#4C3D9A] flex-shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <p className="font-semibold text-sm xl:text-base line-clamp-3">Silent study area rules are active.</p>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-[#E5E8E5] p-2 bg-[#F8FAFC] min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#F0EEF8] flex items-center justify-center text-[#4C3D9A] flex-shrink-0">
                  <Clock3 className="w-4 h-4" />
                </div>
                <p className="font-semibold text-sm xl:text-base line-clamp-3">Exam hours are active until 10:00 PM.</p>              </div>
            </div>
          </div>
        </div>
      </div>
      {pendingCheckoutSession && (
        <ConfirmationDialog
          title="Confirm Check-Out"
          message="Are you finished studying at this seat?"
          details={[
            { label: "Seat ID", value: pendingCheckoutSession.seat },
            { label: "Section", value: pendingCheckoutSession.section },
            { label: "Current study time", value: formatDuration(pendingCheckoutSession.checkInTime, new Date(now)) },
          ]}
          confirmLabel="Confirm Check-Out"
          onConfirm={confirmCheckout}
          onCancel={() => setPendingCheckoutSession(null)}
        />
      )}
    </div>
  );
}
