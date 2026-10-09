import { useEffect, useState } from "react";
import {
  Armchair,
  Users,
  AlertTriangle,
  Clock3,
  Library,
  CircleHelp,
  CheckCircle2,
  History,
  QrCode,
  ChevronRight,
  Bell,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useStudentSession } from "./studentSession";
import ConfirmationDialog from "./ConfirmationDialog";
import StudentProfileMenu from "./StudentProfileMenu";
import { getActiveAnnouncements } from "./announcementData";

function formatClock(totalSeconds) {
  const seconds = Math.max(0, totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    databaseSeats,
    catalogSyncError,
    session,
    lastSession,
    checkout,
    currentStudentId,
    student,
    announcements,
  } = useStudentSession();
  const [now, setNow] = useState(() => Date.now());
  const [pendingCheckoutSession, setPendingCheckoutSession] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState(
    () => (typeof Notification === "undefined" ? "unsupported" : Notification.permission),
  );
  const availability = !catalogSyncError && Array.isArray(databaseSeats)
    ? databaseSeats.reduce((counts, seat) => {
      counts.total += 1;
      if (seat.status === "available") counts.available += 1;
      else if (seat.status === "occupied") counts.occupied += 1;
      else if (seat.status === "unavailable") counts.unavailable += 1;
      return counts;
    }, { total: 0, available: 0, occupied: 0, unavailable: 0 })
    : null;
  const latestAnnouncement = getActiveAnnouncements(announcements, session?.sectionId)[0];

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
    const elapsedSeconds = Math.max(0, Math.floor((end - start) / 1000));
    return formatClock(elapsedSeconds);
  };

  const plannedEnd = session?.plannedDurationMinutes
    ? new Date(new Date(session.checkInTime).getTime() + session.plannedDurationMinutes * 60_000)
    : null;
  const plannedRemainingMs = plannedEnd ? plannedEnd.getTime() - now : null;
  const showPlannedReminder = plannedRemainingMs !== null && plannedRemainingMs <= 5 * 60_000;
  const enableBrowserNotifications = async () => {
    if (typeof Notification === "undefined") return;
    try {
      const permission = await Notification.requestPermission();
      setBrowserNotificationPermission(permission);
    } catch (error) {
      console.error("Unable to request browser study reminders:", error);
    }
  };

  const confirmCheckout = async () => {
    const result = await checkout(pendingCheckoutSession?.id, currentStudentId);
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
          <p className="dashboard-stats-note text-xs text-gray-500">
            {catalogSyncError || "Live seat status from the database"}
          </p>
          <div data-tour-anchor="student-availability" className="dashboard-stats mt-2 grid auto-rows-fr grid-cols-2 xl:grid-cols-4 gap-2 items-stretch">
            <div className="dashboard-stat-card order-1 min-h-[76px] bg-white p-3 rounded-xl border flex flex-col justify-between">
              <div className="flex items-start gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#E7E6EC] flex items-center justify-center flex-shrink-0">
                  <Armchair className="w-4 h-4 text-[#140B63]" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-3xl xl:text-4xl font-bold">{availability?.total ?? "—"}</h1>
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
                  <h1 className="text-3xl xl:text-4xl font-bold">{availability?.available ?? "—"}</h1>
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
                  <h1 className="text-3xl xl:text-4xl font-bold">{availability?.occupied ?? "—"}</h1>
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
                  <h1 className="text-3xl xl:text-4xl font-bold">{availability?.unavailable ?? "—"}</h1>
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
            data-tour-anchor="student-current-session"
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
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-stretch">
                <div className="flex flex-col justify-between gap-5 rounded-xl border border-[#DCE2F0] bg-white/80 p-4 sm:p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <Armchair className="h-9 w-9" aria-label="Seat occupied by your active session" />
                    </div>
                    <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500">Section</p>
                        <p className="truncate text-xl font-bold text-[#140B63] sm:text-2xl">{session.section}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500">Seat</p>
                        <p className="text-xl font-bold text-[#140B63] sm:text-2xl">{session.seat}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-[#F5F6FC] p-3">
                      <p className="text-sm text-gray-500">Started</p>
                      <p className="text-base font-semibold text-[#140B63] sm:text-lg">{formatTime(session.checkInTime)}</p>
                    </div>
                    <div className="rounded-lg bg-[#F5F6FC] p-3">
                      <p className="text-sm text-gray-500">Study time</p>
                      <p className="text-lg font-bold tabular-nums text-[#140B63] sm:text-xl" aria-live="off">
                        {formatDuration(session.checkInTime, new Date(now))}
                      </p>
                    </div>
                  </div>
                  {plannedEnd && (
                    <div className="rounded-lg border border-[#DDE3F2] bg-[#F8F9FF] p-3">
                      <p className="text-sm text-gray-500">Planned study time</p>
                      <p className="mt-1 text-sm font-semibold text-[#140B63]">
                        {session.plannedDurationMinutes} minutes · ends at {formatTime(plannedEnd)}
                      </p>
                      {showPlannedReminder && (
                        <p className={`mt-2 text-sm font-semibold ${
                          plannedRemainingMs <= 0 ? "text-rose-800" : "text-amber-900"
                        }`} role="status" aria-live="polite">
                          {plannedRemainingMs <= 0
                            ? "Your planned study time has ended. Your seat is still checked in; check out when you are ready."
                            : `Your planned study time ends in ${formatClock(Math.ceil(plannedRemainingMs / 1000))}. Check out when you are ready.`}
                        </p>
                      )}
                      {browserNotificationPermission === "default" && (
                        <button
                          type="button"
                          onClick={enableBrowserNotifications}
                          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#140B63] underline underline-offset-2"
                        >
                          <Bell className="h-4 w-4" aria-hidden="true" />
                          Enable browser reminders
                        </button>
                      )}
                      {browserNotificationPermission === "denied" && (
                        <p className="mt-2 text-xs text-gray-600">
                          Browser reminders are blocked. The reminder will appear here while the app is open.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutError("");
                    setPendingCheckoutSession(session);
                  }}
                  className="rounded-lg bg-[#140B63] px-5 py-3 text-base font-semibold text-white transition hover:bg-[#251b79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7] lg:self-center"
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
          <section data-tour-anchor="student-quick-actions" className="dashboard-quick-card h-full rounded-xl border border-[#DDE3F2] bg-[#FCFCFF] p-3 shadow-sm sm:p-4">
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
          <div data-tour-anchor="student-announcements" className="dashboard-announcements mt-2 rounded-xl border border-[#DDE3F2] bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#4B4FA3]" aria-hidden="true" />
                <h2 className="text-base font-bold xl:text-lg">Announcements</h2>
              </div>
              <Link to={session?.sectionId ? `/notifications?section=${encodeURIComponent(session.sectionId)}` : "/notifications"} className="shrink-0 text-xs font-semibold text-[#140B63] hover:underline">
                View All →
              </Link>
            </div>
            {latestAnnouncement ? (
              <article className="rounded-lg border border-[#E5E9F3] bg-[#FCFCFF] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="min-w-0 break-words text-sm font-semibold text-[#140B63]">{latestAnnouncement.title}</h3>
                  <span className="rounded-full bg-[#EEF0FA] px-2 py-0.5 text-[10px] font-semibold text-[#4B4FA3]">{latestAnnouncement.type}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-gray-600">{latestAnnouncement.message}</p>
              </article>
            ) : (
              <p className="rounded-lg border border-dashed border-[#E5E9F3] px-3 py-3 text-xs text-gray-500">
                No current announcements.
              </p>
            )}
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
