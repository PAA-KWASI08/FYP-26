import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Armchair,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Library,
  MapPin,
  Timer,
} from "lucide-react";
import { useStudentSession } from "./studentSession";
import {
  formatSessionDate,
  formatSessionDuration,
  formatSessionTime,
  getSessionDurationMinutes,
} from "./sessionUtils";
import ConfirmationDialog from "./ConfirmationDialog";

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

export default function MySessions() {
  const navigate = useNavigate();
  const { session, completedSessions, checkout, currentStudentId } = useStudentSession();
  const [now, setNow] = useState(() => Date.now());
  const [pendingCheckoutSession, setPendingCheckoutSession] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    if (session?.sessionStatus !== "active") return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [session]);

  const completedDurations = completedSessions.map((item) => getSessionDurationMinutes(item));
  const totalMinutes = completedDurations.reduce((total, duration) => total + duration, 0);
  const longestMinutes = completedDurations.length ? Math.max(...completedDurations) : 0;
  const sectionCounts = completedSessions.reduce((counts, item) => {
    counts[item.section] = (counts[item.section] ?? 0) + 1;
    return counts;
  }, {});
  const mostUsedSection = Object.entries(sectionCounts).sort((first, second) => second[1] - first[1])[0]?.[0];

  const confirmCheckout = () => {
    const result = checkout(pendingCheckoutSession?.id, currentStudentId);
    if (!result.ok) setCheckoutError(result.message);
    setPendingCheckoutSession(null);
  };

  return (
    <div className="min-h-full w-full min-w-0 bg-[#F5F5F5] p-3 sm:p-4">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <header className="flex flex-col gap-3 border-b border-black/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#140B63]">Study sessions</p>
            <h1 className="mt-1 text-2xl font-bold text-[#140B63] sm:text-3xl">My Sessions</h1>
            <p className="mt-1 text-sm text-gray-600">Review your current and completed study sessions.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-[#5B5FC7] bg-white px-4 py-2 text-sm font-semibold text-[#140B63] transition hover:bg-[#F2F2FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </header>

        <section aria-labelledby="current-session-heading">
          <div className="mb-2 flex items-center gap-2">
            <h2 id="current-session-heading" className="text-lg font-bold text-[#140B63]">Current Session</h2>
            {session && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                Active
              </span>
            )}
          </div>
          {session ? (
            <div className="rounded-xl border border-[#DDE4DE] bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-start gap-2">
                    <Library className="mt-0.5 h-4 w-4 shrink-0 text-[#5B5FC7]" />
                    <div>
                      <p className="text-xs text-gray-500">Section</p>
                      <p className="font-semibold text-[#140B63]">{session.section}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Armchair className="mt-0.5 h-4 w-4 shrink-0 text-[#5B5FC7]" />
                    <div>
                      <p className="text-xs text-gray-500">Seat</p>
                      <p className="font-semibold text-[#140B63]">{session.seat}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#5B5FC7]" />
                    <div>
                      <p className="text-xs text-gray-500">Started</p>
                      <p className="font-semibold text-[#140B63]">{formatSessionTime(session.checkInTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Timer className="mt-0.5 h-4 w-4 shrink-0 text-[#5B5FC7]" />
                    <div>
                      <p className="text-xs text-gray-500">Study time</p>
                      <p className="font-semibold text-[#140B63]">
                        {formatSessionDuration(session.checkInTime, new Date(now))}
                      </p>
                    </div>
                  </div>
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
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EEF8] text-[#140B63]">
                  <Clock3 className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-[#140B63]">No active session</p>
                  <p className="text-sm text-gray-600">You do not have an active study session.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/check-in")}
                className="rounded-lg bg-[#140B63] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#251b79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
              >
                Check In
              </button>
            </div>
          )}
          {checkoutError && (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
              {checkoutError}
            </p>
          )}
        </section>

        {completedSessions.length > 0 && (
          <section aria-label="Session analysis" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-white p-3">
              <p className="text-xs text-gray-500">Completed sessions</p>
              <p className="mt-1 text-xl font-bold text-[#140B63]">{completedSessions.length}</p>
            </div>
            <div className="rounded-xl border bg-white p-3">
              <p className="text-xs text-gray-500">Total study time</p>
              <p className="mt-1 text-xl font-bold text-[#140B63]">{formatMinutes(totalMinutes)}</p>
            </div>
            <div className="rounded-xl border bg-white p-3">
              <p className="text-xs text-gray-500">Average session</p>
              <p className="mt-1 text-xl font-bold text-[#140B63]">
                {formatMinutes(Math.round(totalMinutes / completedSessions.length))}
              </p>
            </div>
            <div className="rounded-xl border bg-white p-3">
              <p className="text-xs text-gray-500">Longest session</p>
              <p className="mt-1 text-xl font-bold text-[#140B63]">{formatMinutes(longestMinutes)}</p>
            </div>
            {mostUsedSection && (
              <div className="col-span-2 flex items-center gap-2 rounded-xl border bg-white p-3 lg:col-span-4">
                <MapPin className="h-4 w-4 text-[#5B5FC7]" />
                <p className="text-sm text-gray-600">
                  Most used section: <span className="font-semibold text-[#140B63]">{mostUsedSection}</span>
                </p>
              </div>
            )}
          </section>
        )}

        <section aria-labelledby="session-history-heading">
          <h2 id="session-history-heading" className="mb-2 text-lg font-bold text-[#140B63]">Session History</h2>
          {completedSessions.length ? (
            <ol className="space-y-2">
              {completedSessions.map((item) => (
                <li key={item.id} className="rounded-xl border bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="font-bold text-[#140B63]">{item.section}</h3>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          Completed
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Armchair className="h-4 w-4 text-[#5B5FC7]" />
                          {item.seat}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4 text-[#5B5FC7]" />
                          {formatSessionDate(item.checkInTime)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-4 w-4 text-[#5B5FC7]" />
                          {formatSessionTime(item.checkInTime)} – {formatSessionTime(item.checkOutTime)}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 sm:text-right">
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-bold text-[#140B63]">
                        {formatSessionDuration(item.checkInTime, item.checkOutTime)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EEF8] text-[#140B63]">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-[#140B63]">No completed sessions yet.</p>
                  <p className="text-sm text-gray-600">Completed study sessions will appear here.</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
      {pendingCheckoutSession && (
        <ConfirmationDialog
          title="Confirm Check-Out"
          message="Are you finished studying at this seat?"
          details={[
            { label: "Seat ID", value: pendingCheckoutSession.seat },
            { label: "Section", value: pendingCheckoutSession.section },
            { label: "Current study time", value: formatSessionDuration(pendingCheckoutSession.checkInTime, new Date(now)) },
          ]}
          confirmLabel="Confirm Check-Out"
          onConfirm={confirmCheckout}
          onCancel={() => setPendingCheckoutSession(null)}
        />
      )}
    </div>
  );
}
