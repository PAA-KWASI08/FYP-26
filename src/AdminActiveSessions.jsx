import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Armchair, CheckCircle2, Clock3, UsersRound } from "lucide-react";
import ConfirmationDialog from "./ConfirmationDialog";
import { formatAdminDuration, formatAdminTime, PROLONGED_SESSION_REVIEW_MS } from "./adminData";
import { getLibraryAvailability } from "./sections";
import { useStudentSession } from "./studentSession";
import { BALME_GEOFENCE, OUTSIDE_GEOFENCE_GRACE_MS } from "./lib/geofence";
import AdminGeofenceAlerts from "./AdminGeofenceAlerts";
import { releaseAdminGeofenceSession } from "./lib/seatService";

const locationStyles = {
  "Within Library": "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]",
  "Outside Library": "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
  "Location Not Verified": "border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]",
};

function LocationBadge({ status }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${locationStyles[status] ?? locationStyles["Location Not Verified"]}`}>
      {status}
    </span>
  );
}

function SummaryCard({ label, value, icon: Icon, tone }) {
  return (
    <article className="min-w-0 rounded-xl border border-[#DDE3F2] bg-white p-3 shadow-sm">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <p className="mt-2 text-3xl font-bold leading-none text-[#140B63] sm:text-4xl">{value}</p>
      <h3 className="mt-1 text-xs font-semibold text-gray-600">{label}</h3>
    </article>
  );
}

function SessionDetails({ item, sessionRecords, now, onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const history = sessionRecords.filter((record) => (
    record.userId === item.userId && record.sessionStatus === "completed"
  ));

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-details-heading"
        className="my-auto w-full max-w-xl rounded-xl border border-[#DDE3F2] bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="session-details-heading" className="text-xl font-bold text-[#140B63]">Session Details</h2>
            <p className="mt-1 text-sm text-gray-500">{item.section} · {item.seat}</p>
          </div>
          <span className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-xs font-semibold text-[#1D4ED8]">Active</span>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-3 rounded-lg border border-[#E7EAF3] bg-[#FCFCFF] p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-gray-500">Student</dt>
            <dd className="mt-0.5 font-semibold text-[#140B63]">{item.studentName || item.studentId}</dd>
            {item.studentName && <dd className="text-xs text-gray-500">{item.studentId}</dd>}
          </div>
          <div>
            <dt className="text-xs text-gray-500">Seat ID</dt>
            <dd className="mt-0.5 font-semibold text-[#140B63]">{item.seatId}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Section</dt>
            <dd className="mt-0.5 font-semibold text-[#140B63]">{item.section}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Check-in time</dt>
            <dd className="mt-0.5 font-semibold text-[#140B63]">{formatAdminTime(item.checkInTime)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Current study time</dt>
            <dd className="mt-0.5 font-semibold text-[#140B63]">
              {formatAdminDuration(Math.max(0, now - new Date(item.checkInTime).getTime()))}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Session status</dt>
            <dd className="mt-0.5 font-semibold text-[#1D4ED8]">Active</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-gray-500">Balme geofence status</dt>
            <dd className="mt-1"><LocationBadge status={item.locationStatus ?? "Location Not Verified"} /></dd>
          </div>
          {item.locationStatus === "Outside Library" && item.outsideSince && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-gray-500">Outside geofence since</dt>
              <dd className="mt-0.5 font-semibold text-[#140B63]">{formatAdminTime(item.outsideSince)}</dd>
            </div>
          )}
          {item.promptSentAt && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-gray-500">Student prompt</dt>
              <dd className="mt-0.5 font-semibold text-[#140B63]">Prompt sent at {formatAdminTime(item.promptSentAt)}</dd>
            </div>
          )}
        </dl>

        {item.locationStatus === "Outside Library" && (
          <p className="mt-4 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3 text-sm text-[#854D0E]">
            Device is outside the {BALME_GEOFENCE.name} geofence. An admin alert appears after 10 continuous minutes outside; the seat is released automatically after 15 minutes.
          </p>
        )}
        {item.locationStatus === "Location Not Verified" && (
          <p className="mt-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm text-gray-600">
            The browser is not currently providing a verifiable location. No new outside-geofence time is counted until location is verified again.
          </p>
        )}
        {item.locationStatusIsMock && (
          <p className="mt-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs text-gray-600">
            Location status is mock data and does not use live geofence verification.
          </p>
        )}

        <section aria-labelledby="session-history-heading" className="mt-5">
          <h3 id="session-history-heading" className="text-sm font-bold text-[#140B63]">Session History</h3>
          {history.length ? (
            <ul className="mt-2 space-y-2">
              {history.slice(0, 3).map((entry) => (
                <li key={entry.id} className="rounded-lg border border-[#E7EAF3] px-3 py-2 text-xs text-gray-600">
                  {entry.section} · {entry.seat} — {
                    entry.releaseReason === "outside-geofence" ? "seat released by admin" : "checked out"
                  } {formatAdminTime(entry.checkOutTime)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-gray-500">No completed sessions have been recorded for this student.</p>
          )}
        </section>

        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-[#DDE3F2] px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Close
          </button>
        </div>
      </section>
    </div>
  );
}

export default function AdminActiveSessions() {
  const {
    sections,
    adminSessions,
    adminSessionsError,
    adminSessionsLoading,
    catalogSyncError,
    locationVerificationEnabled,
    locationVerificationLoading,
    locationVerificationError,
    refreshAdminSessions,
    refreshSeatCatalog,
  } = useStudentSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [pendingRelease, setPendingRelease] = useState(null);
  const [promptMessage, setPromptMessage] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const activeSessions = useMemo(() => {
    return adminSessions
      .filter((item) => item.sessionStatus === "active")
      .map((item) => {
        const duration = Math.max(0, now - new Date(item.checkInTime).getTime());
        return {
          ...item,
          section: item.section ?? "Unknown section",
          seat: item.seat ?? "Unknown seat",
          duration,
          attentionRequired: duration >= PROLONGED_SESSION_REVIEW_MS,
          outsideGraceExpired: item.locationStatus === "Outside Library"
            && item.outsideSince
            && now - new Date(item.outsideSince).getTime() >= OUTSIDE_GEOFENCE_GRACE_MS,
          outsideGraceRemainingMs: item.locationStatus === "Outside Library" && item.outsideSince
            ? Math.max(0, OUTSIDE_GEOFENCE_GRACE_MS - (now - new Date(item.outsideSince).getTime()))
            : null,
        };
      });
  }, [adminSessions, now]);

  const filteredSessions = activeSessions.filter((item) => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const matchesQuery = !normalizedQuery
      || String(item.studentId ?? "").toLocaleLowerCase().includes(normalizedQuery)
      || String(item.seatId ?? "").toLocaleLowerCase().includes(normalizedQuery)
      || item.seat.toLocaleLowerCase().includes(normalizedQuery)
      || item.section.toLocaleLowerCase().includes(normalizedQuery);
    const matchesFilter = filter === "All"
      || (filter === "Active" && item.sessionStatus === "active")
      || (filter === "Prolonged" && item.attentionRequired)
      || (filter === "Outside 10 min" && item.outsideGraceExpired)
      || (filter === "Within Library" && item.locationStatus === "Within Library")
      || (filter === "Outside Library" && item.locationStatus === "Outside Library");
    return matchesQuery && matchesFilter;
  });

  const requestedSeat = searchParams.get("seat");
  const routeSession = activeSessions.find(
    (item) => item.seat === requestedSeat || item.seatId === requestedSeat,
  );
  const selectedSession = activeSessions.find((item) => item.id === selectedSessionId) ?? routeSession;
  const seatSummary = getLibraryAvailability(sections);
  const occupiedSeats = sections.reduce(
    (count, section) => count + section.seats.filter((seat) => seat.status === "Occupied").length,
    0,
  );
  const prolongedCount = activeSessions.filter((item) => item.attentionRequired).length;

  const confirmRelease = async () => {
    const { error: releaseError } = await releaseAdminGeofenceSession(pendingRelease?.id);
    if (releaseError) {
      console.error("Unable to release outside-geofence session:", releaseError.message);
      setError("The session could not be released. It may already have ended.");
    } else {
      const [sessionsResult, seatsResult] = await Promise.all([
        refreshAdminSessions(),
        refreshSeatCatalog(),
      ]);
      if (!sessionsResult.ok || !seatsResult.ok) {
        setError(`The seat was released, but the screen could not refresh all database data. ${seatsResult.error?.message ?? sessionsResult.error?.message ?? ""}`.trim());
        setPromptMessage("");
      } else {
        setPromptMessage(`Seat ${pendingRelease.seat} was released and made available.`);
        setError("");
      }
    }
    setPendingRelease(null);
  };

  const closeSessionDetails = () => {
    setSelectedSessionId(null);
    if (searchParams.has("seat")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("seat");
      setSearchParams(nextParams, { replace: true });
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 p-3 sm:gap-5 sm:p-5">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#140B63] sm:text-3xl">Active Sessions</h2>
          <p className="text-sm text-gray-600">Monitor students currently using library seats.</p>
        </div>
        <Link to="/admin/usage-analytics" className="text-sm font-semibold text-[#4B4FA3] hover:underline">
          View Usage &amp; Analytics →
        </Link>
      </header>

      <section aria-label="Active session summary" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryCard label="Active Sessions" value={adminSessionsLoading || adminSessionsError ? "—" : activeSessions.length} icon={UsersRound} tone="bg-[#EEF0FA] text-[#343A78]" />
        <SummaryCard label="Occupied Seats" value={catalogSyncError || !sections.length ? "—" : occupiedSeats} icon={Armchair} tone="bg-[#EFF6FF] text-[#1D4ED8]" />
        <SummaryCard label="Available Seats" value={catalogSyncError || !sections.length ? "—" : seatSummary.available} icon={CheckCircle2} tone="bg-[#F0FDF4] text-[#166534]" />
        <SummaryCard label="Prolonged Sessions" value={adminSessionsLoading || adminSessionsError ? "—" : prolongedCount} icon={Clock3} tone="bg-[#FFFBEB] text-[#854D0E]" />
      </section>

      <p className="rounded-lg border border-[#E7EAF3] bg-white px-3 py-2.5 text-xs text-gray-600">
        Prolonged sessions are flagged for administrative review after {formatAdminDuration(PROLONGED_SESSION_REVIEW_MS)}. This is an attention threshold, not a study limit; sessions remain active until the student checks out.
      </p>
      <p data-tour-anchor="admin-session-geofence" className="rounded-lg border border-[#E7EAF3] bg-white px-3 py-2.5 text-xs text-gray-600">
        {locationVerificationLoading
          ? "Loading location-verification settings…"
          : locationVerificationError
            ? locationVerificationError
            : locationVerificationEnabled
              ? `Geofence: ${BALME_GEOFENCE.name}, ${BALME_GEOFENCE.radiusMeters} m radius. Admins are alerted after 10 continuous minutes outside; seats are automatically released after 15 minutes.`
              : "Location verification is temporarily disabled for testing. Geofence alerts and automatic seat release are paused."}
      </p>

      <AdminGeofenceAlerts onReleased={refreshSeatCatalog} />

      {adminSessionsLoading && <p role="status" className="rounded-lg border border-[#DDE3F2] bg-white px-3 py-2 text-sm text-gray-600">Loading recorded sessions…</p>}
      {adminSessionsError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{adminSessionsError}</p>}
      {catalogSyncError && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{catalogSyncError}</p>}
      {error && <p role="alert" className="rounded-lg border border-[#F0D9CE] bg-[#FBF1EC] px-3 py-2 text-sm text-[#8A4934]">{error}</p>}
      {promptMessage && <p role="status" className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-sm text-[#1E3A8A]">{promptMessage}</p>}

      <section data-tour-anchor="admin-session-filters" aria-label="Active session filters" className="flex flex-col gap-3 rounded-xl border border-[#DDE3F2] bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Search active sessions</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Student ID, Seat ID, or Section"
            className="min-h-11 w-full rounded-lg border border-[#DDE3F2] bg-[#FCFCFF] px-3 py-2 text-sm text-[#140B63] outline-none placeholder:text-gray-400 focus:border-[#8B8FD1] focus:ring-2 focus:ring-[#E7E8F8]"
          />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm text-gray-600">
          <span>Filter</span>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="min-h-11 min-w-44 rounded-lg border border-[#DDE3F2] bg-white px-3 text-sm font-medium text-[#140B63] outline-none focus:border-[#8B8FD1] focus:ring-2 focus:ring-[#E7E8F8]"
          >
            {["All", "Active", "Prolonged", "Within Library", "Outside Library", "Outside 10 min"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </section>

      {adminSessionsLoading || adminSessionsError ? null : activeSessions.length === 0 ? (
        <section data-tour-anchor="admin-session-list" className="rounded-xl border border-dashed border-[#DDE3F2] bg-white px-4 py-10 text-center">
          <UsersRound className="mx-auto h-8 w-8 text-[#7A80BD]" aria-hidden="true" />
          <h3 className="mt-2 font-semibold text-[#140B63]">No active study sessions</h3>
          <p className="mt-1 text-sm text-gray-500">Students who check in will appear here.</p>
        </section>
      ) : filteredSessions.length === 0 ? (
        <section data-tour-anchor="admin-session-list" className="rounded-xl border border-dashed border-[#DDE3F2] bg-white px-4 py-10 text-center">
          <p className="font-semibold text-[#140B63]">No sessions match these filters</p>
          <p className="mt-1 text-sm text-gray-500">Try another search term or filter.</p>
        </section>
      ) : (
        <section data-tour-anchor="admin-session-list" aria-label="Active session records" className="min-w-0 overflow-hidden rounded-xl border border-[#DDE3F2] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1060px] border-collapse text-left text-sm">
              <thead className="bg-[#FCFCFF]">
                <tr className="border-b border-[#DDE3F2] text-xs text-gray-500">
                  <th className="px-3 py-3 font-semibold">Student</th>
                  <th className="px-3 py-3 font-semibold">Section</th>
                  <th className="px-3 py-3 font-semibold">Seat</th>
                  <th className="px-3 py-3 font-semibold">Check-in Time</th>
                  <th className="px-3 py-3 font-semibold">Study Time</th>
                  <th className="px-3 py-3 font-semibold">Location Status</th>
                  <th className="px-3 py-3 font-semibold">Session Status</th>
                  <th className="px-3 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((item) => (
                  <tr key={item.id} className="border-b border-[#EEF0F5] last:border-0">
                    <td className="whitespace-nowrap px-3 py-3 font-medium text-[#140B63]">
                      {item.studentName || item.studentId}
                      {item.studentName && <span className="block text-xs font-normal text-gray-500">{item.studentId}</span>}
                    </td>
                    <td className="px-3 py-3">{item.section}</td>
                    <td className="whitespace-nowrap px-3 py-3">{item.seat}</td>
                    <td className="whitespace-nowrap px-3 py-3">{formatAdminTime(item.checkInTime)}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span>{formatAdminDuration(item.duration)}</span>
                      {item.attentionRequired && <span className="ml-2 rounded-full bg-[#FFFBEB] px-2 py-1 text-[11px] font-semibold text-[#854D0E]">Extended session</span>}
                      {item.outsideGraceExpired && <span className="ml-2 rounded-full bg-rose-100 px-2 py-1 text-[11px] font-semibold text-rose-800">Outside 10+ min</span>}
                    </td>
                    <td className="px-3 py-3"><LocationBadge status={item.locationStatus ?? "Location Not Verified"} /></td>
                    <td className="px-3 py-3"><span className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-xs font-semibold text-[#1D4ED8]">Active</span></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setSelectedSessionId(item.id)} className="min-h-9 rounded-lg border border-[#DDE3F2] px-3 py-1.5 text-xs font-semibold text-[#140B63] hover:bg-[#F8F9FF]">View</button>
                        {item.outsideGraceExpired ? (
                          <button type="button" onClick={() => setPendingRelease(item)} className="min-h-9 whitespace-nowrap rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-800">Release Seat</button>
                        ) : item.locationStatus === "Outside Library" && item.outsideGraceRemainingMs !== null ? (
                          <span className="whitespace-nowrap text-xs font-medium text-amber-800">
                            Release in {formatAdminDuration(item.outsideGraceRemainingMs)}
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedSession && (
        <SessionDetails
          item={selectedSession}
          sessionRecords={adminSessions}
          now={now}
          onClose={closeSessionDetails}
        />
      )}

      {pendingRelease && (
        <ConfirmationDialog
          title="Release this seat?"
          message="The device has been outside the Balme Library geofence for at least 10 continuous minutes. Releasing will end the active session and make the seat available."
          details={[
            { label: "Student ID", value: pendingRelease.studentId },
            { label: "Seat", value: `${pendingRelease.section} · ${pendingRelease.seat}` },
          ]}
          confirmLabel="Release Seat"
          onConfirm={confirmRelease}
          onCancel={() => setPendingRelease(null)}
        />
      )}
    </div>
  );
}
