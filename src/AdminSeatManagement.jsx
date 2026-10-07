import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Armchair, Search } from "lucide-react";
import AdminSectionStatus from "./AdminSectionStatus";
import ConfirmationDialog from "./ConfirmationDialog";
import { getSectionAvailability } from "./sections";
import { formatAdminDuration, formatAdminTime } from "./adminData";
import { useStudentSession } from "./studentSession";

const seatStatusStyles = {
  Available: {
    badge: "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]",
    dot: "bg-[#16A34A]",
    tile: "border-[#BBF7D0] bg-[#F0FDF4] hover:bg-[#E7F9ED]",
  },
  Occupied: {
    badge: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
    dot: "bg-[#2563EB]",
    tile: "border-[#BFDBFE] bg-[#EFF6FF] hover:bg-[#E5F0FF]",
  },
  Unavailable: {
    badge: "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
    dot: "bg-[#DC2626]",
    tile: "border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE8E8]",
  },
};

const unavailableReasons = [
  "Maintenance",
  "Damaged",
  "Temporarily unavailable",
  "Other",
];

function SeatStatus({ status }) {
  const styles = seatStatusStyles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} aria-hidden="true" />
      {status}
    </span>
  );
}

function SummaryCard({ label, value, status }) {
  const style = status ? seatStatusStyles[status] : null;
  return (
    <article className="min-w-0 rounded-xl border border-[#DDE3F2] bg-white p-3 shadow-sm">
      <p className="text-xs font-semibold text-gray-600">{label}</p>
      <p className={`mt-1 text-2xl font-bold leading-none ${style ? style.badge.split(" ").at(-1) : "text-[#140B63]"}`}>
        {value}
      </p>
    </article>
  );
}

function SeatDetailsDialog({
  seat,
  section,
  activeSession,
  studentId,
  now,
  unavailableReason,
  setUnavailableReason,
  otherReason,
  setOtherReason,
  onBeginMarkUnavailable,
  onMakeAvailable,
  onClose,
  navigate,
}) {
  const [showReasonForm, setShowReasonForm] = useState(false);
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  const sessionMatchesSeat = activeSession?.sessionStatus === "active"
    && activeSession.sectionId === section.id
    && activeSession.seatId === seat.id;
  const selectedReason = unavailableReason === "Other" ? otherReason.trim() : unavailableReason;

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
        aria-labelledby="seat-details-heading"
        className="my-auto w-full max-w-lg rounded-xl border border-[#DDE3F2] bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="seat-details-heading" className="text-xl font-bold text-[#140B63]">{seat.seatCode}</h2>
            <p className="mt-1 text-sm text-gray-500">{section.name}</p>
          </div>
          <SeatStatus status={seat.status} />
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-3 rounded-lg border border-[#E7EAF3] bg-[#FCFCFF] p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-gray-500">Seat ID</dt>
            <dd className="mt-0.5 font-semibold text-[#140B63]">{seat.id}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Seat Code</dt>
            <dd className="mt-0.5 font-semibold text-[#140B63]">{seat.seatCode}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">QR Identifier</dt>
            <dd className="mt-0.5 font-semibold text-[#140B63]">{seat.qrIdentifier ?? seat.seatCode}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Section Status</dt>
            <dd className="mt-0.5"><AdminSectionStatus status={section.status} /></dd>
          </div>
          {seat.status === "Unavailable" && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-gray-500">Reason</dt>
              <dd className="mt-0.5 font-semibold text-[#140B63]">{seat.unavailableReason || "Not specified"}</dd>
            </div>
          )}
          {seat.status === "Occupied" && sessionMatchesSeat && (
            <>
              <div>
                <dt className="text-xs text-gray-500">Student ID</dt>
                <dd className="mt-0.5 font-semibold text-[#140B63]">{studentId}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Check-in</dt>
                <dd className="mt-0.5 font-semibold text-[#140B63]">{formatAdminTime(activeSession.checkInTime)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-gray-500">Current study duration</dt>
                <dd className="mt-0.5 font-semibold text-[#140B63]">
                  {formatAdminDuration(Math.max(0, now - new Date(activeSession.checkInTime).getTime()))}
                </dd>
              </div>
            </>
          )}
        </dl>

        {seat.status === "Occupied" && (
          <div className="mt-4 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] p-3">
            <p className="text-sm text-[#1E3A8A]">
              {sessionMatchesSeat
                ? "This seat is associated with the active student session."
                : "This mock occupied-seat record has no associated active session details."}
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/admin/active-sessions?seat=${encodeURIComponent(seat.seatCode)}`);
              }}
              className="mt-2 min-h-10 rounded-lg border border-[#BFDBFE] bg-white px-3 py-2 text-sm font-semibold text-[#1D4ED8] hover:bg-[#F8FBFF]"
            >
              View Active Session
            </button>
          </div>
        )}

        {seat.status !== "Occupied" && !showReasonForm && (
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-[#DDE3F2] px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Close
            </button>
            {seat.status === "Available" ? (
              <button
                type="button"
                onClick={() => setShowReasonForm(true)}
                className="min-h-11 rounded-lg bg-[#140B63] px-4 py-2 text-sm font-semibold text-white hover:bg-[#251b79]"
              >
                Mark Unavailable
              </button>
            ) : (
              <button
                type="button"
                onClick={onMakeAvailable}
                className="min-h-11 rounded-lg bg-[#140B63] px-4 py-2 text-sm font-semibold text-white hover:bg-[#251b79]"
              >
                Make Available
              </button>
            )}
          </div>
        )}

        {seat.status === "Available" && showReasonForm && (
          <div className="mt-5 rounded-lg border border-[#DDE3F2] bg-[#FCFCFF] p-4">
            <label className="block text-sm font-semibold text-gray-700" htmlFor="unavailable-reason">
              Reason for unavailability
            </label>
            <select
              id="unavailable-reason"
              value={unavailableReason}
              onChange={(event) => setUnavailableReason(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-[#DDE3F2] bg-white px-3 py-2 text-sm outline-none focus:border-[#8B8FD1] focus:ring-2 focus:ring-[#E7E8F8]"
            >
              <option value="">Choose a reason</option>
              {unavailableReasons.map((reason) => <option key={reason}>{reason}</option>)}
            </select>
            {unavailableReason === "Other" && (
              <label className="mt-3 block text-sm font-semibold text-gray-700" htmlFor="other-unavailable-reason">
                Specify reason
                <input
                  id="other-unavailable-reason"
                  maxLength={120}
                  value={otherReason}
                  onChange={(event) => setOtherReason(event.target.value)}
                  placeholder="Enter a short reason"
                  className="mt-1 min-h-11 w-full rounded-lg border border-[#DDE3F2] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[#8B8FD1] focus:ring-2 focus:ring-[#E7E8F8]"
                />
              </label>
            )}
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setShowReasonForm(false)} className="min-h-11 rounded-lg border border-[#DDE3F2] px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Back
              </button>
              <button
                type="button"
                disabled={!selectedReason}
                onClick={() => onBeginMarkUnavailable(selectedReason)}
                className="min-h-11 rounded-lg bg-[#140B63] px-4 py-2 text-sm font-semibold text-white hover:bg-[#251b79] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {seat.status === "Occupied" && (
          <div className="mt-5 flex justify-end">
            <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-[#DDE3F2] px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Close
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default function AdminSeatManagement() {
  const { sections, session, student, setSeatAvailability } = useStudentSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const sectionFilter = searchParams.get("section") ?? "all";
  const [query, setQuery] = useState("");
  const [selectedSeatRef, setSelectedSeatRef] = useState(null);
  const [unavailableReason, setUnavailableReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (session?.sessionStatus !== "active") return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, [session?.id, session?.sessionStatus]);

  const selectedSection = sections.find((section) => section.id === sectionFilter);
  const activeSectionFilter = sectionFilter === "all" || selectedSection ? sectionFilter : "all";
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const displaySections = useMemo(() => sections
    .filter((section) => activeSectionFilter === "all" || section.id === activeSectionFilter)
    .map((section) => ({
      ...section,
      totalSeatCount: section.seats.length,
      seats: section.seats.filter((seat) => (
        !normalizedQuery
        || seat.id.toLocaleLowerCase().includes(normalizedQuery)
        || seat.seatCode.toLocaleLowerCase().includes(normalizedQuery)
        || section.name.toLocaleLowerCase().includes(normalizedQuery)
      )),
    }))
    .filter((section) => section.seats.length > 0), [activeSectionFilter, normalizedQuery, sections]);

  const displayedSeats = displaySections.flatMap((section) => section.seats);
  const summary = displayedSeats.reduce((totals, seat) => {
    totals.total += 1;
    if (seat.status === "Available") totals.available += 1;
    else if (seat.status === "Occupied") totals.occupied += 1;
    else totals.unavailable += 1;
    return totals;
  }, { total: 0, available: 0, occupied: 0, unavailable: 0 });

  const selectedSeat = selectedSeatRef
    ? sections.find((section) => section.id === selectedSeatRef.sectionId)
      ?.seats.find((seat) => seat.id === selectedSeatRef.seatId)
    : null;
  const selectedSeatSection = selectedSeat
    ? sections.find((section) => section.id === selectedSeatRef.sectionId)
    : null;

  const chooseSection = (sectionId) => {
    const next = new URLSearchParams(searchParams);
    if (sectionId === "all") next.delete("section");
    else next.set("section", sectionId);
    setSearchParams(next);
  };

  const openSeatDetails = (sectionId, seatId) => {
    setError("");
    setUnavailableReason("");
    setOtherReason("");
    setSelectedSeatRef({ sectionId, seatId });
  };

  const confirmSeatStatusChange = () => {
    const result = setSeatAvailability(
      pendingAction.sectionId,
      pendingAction.seatId,
      pendingAction.status,
      pendingAction.reason,
    );
    if (!result.ok) {
      setError(result.message);
      setPendingAction(null);
      return;
    }
    setPendingAction(null);
    setSelectedSeatRef(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 p-3 sm:gap-5 sm:p-5">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-[#140B63] sm:text-3xl">Seat Management</h2>
        <p className="text-sm text-gray-600">View and manage individual library seats.</p>
      </header>

      {error && (
        <p role="alert" className="rounded-lg border border-[#F0D9CE] bg-[#FBF1EC] px-3 py-2 text-sm text-[#8A4934]">
          {error}
        </p>
      )}

      <section aria-label="Seat filters" className="flex flex-col gap-3 rounded-xl border border-[#DDE3F2] bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search seats</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search seat ID, code, or section"
            className="min-h-11 w-full rounded-lg border border-[#DDE3F2] bg-[#FCFCFF] py-2 pl-9 pr-3 text-sm text-[#140B63] outline-none transition placeholder:text-gray-400 focus:border-[#8B8FD1] focus:ring-2 focus:ring-[#E7E8F8]"
          />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm text-gray-600">
          <span>Section</span>
          <select
            value={selectedSection ? sectionFilter : "all"}
            onChange={(event) => chooseSection(event.target.value)}
            className="min-h-11 min-w-48 rounded-lg border border-[#DDE3F2] bg-white px-3 text-sm font-medium text-[#140B63] outline-none focus:border-[#8B8FD1] focus:ring-2 focus:ring-[#E7E8F8]"
          >
            <option value="all">All Sections</option>
            {sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
          </select>
        </label>
      </section>

      <section aria-label="Displayed seat summary" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryCard label="Total Seats" value={summary.total} />
        <SummaryCard label="Available" value={summary.available} status="Available" />
        <SummaryCard label="Occupied" value={summary.occupied} status="Occupied" />
        <SummaryCard label="Unavailable" value={summary.unavailable} status="Unavailable" />
      </section>

      <section aria-label="Seat status legend" className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-[#DDE3F2] bg-white px-4 py-3 shadow-sm">
        <span className="text-xs font-semibold text-gray-600">Seat status</span>
        {["Available", "Occupied", "Unavailable"].map((status) => (
          <SeatStatus key={status} status={status} />
        ))}
      </section>

      {displaySections.length ? (
        <div className="space-y-4">
          {displaySections.map((section) => {
            const counts = getSectionAvailability(section);
            return (
              <section key={section.id} aria-label={`${section.name} seats`} className="min-w-0 rounded-xl border border-[#DDE3F2] bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex flex-col gap-2 border-b border-[#EEF0F5] pb-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-bold text-[#140B63]">{section.name}</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {counts.total} displayed of {section.totalSeatCount} seats · {counts.available} available · {counts.occupied} occupied · {counts.unavailable} unavailable
                    </p>
                  </div>
                  <AdminSectionStatus status={section.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 2xl:grid-cols-12">
                  {section.seats.map((seat) => (
                    <button
                      key={seat.id}
                      type="button"
                      onClick={() => openSeatDetails(section.id, seat.id)}
                      aria-label={`${seat.seatCode}, ${seat.status}`}
                      className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7] ${seatStatusStyles[seat.status].tile}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${seatStatusStyles[seat.status].dot}`} aria-hidden="true" />
                      <span className="break-all text-center text-[#140B63]">{seat.seatCode}</span>
                      <span className="text-[10px] font-medium text-gray-600">{seat.status}</span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <section className="rounded-xl border border-dashed border-[#DDE3F2] bg-white px-4 py-10 text-center">
          <Armchair className="mx-auto h-7 w-7 text-[#7A80BD]" aria-hidden="true" />
          <p className="mt-2 font-semibold text-[#140B63]">No seats match your search</p>
          <p className="mt-1 text-sm text-gray-500">Try another seat code or section name.</p>
        </section>
      )}

      {selectedSeat && selectedSeatSection && (
        <SeatDetailsDialog
          seat={selectedSeat}
          section={selectedSeatSection}
          activeSession={session}
          studentId={student.studentId}
          now={now}
          unavailableReason={unavailableReason}
          setUnavailableReason={setUnavailableReason}
          otherReason={otherReason}
          setOtherReason={setOtherReason}
          onBeginMarkUnavailable={(reason) => setPendingAction({
            sectionId: selectedSeatSection.id,
            seatId: selectedSeat.id,
            status: "Unavailable",
            reason,
          })}
          onMakeAvailable={() => setPendingAction({
            sectionId: selectedSeatSection.id,
            seatId: selectedSeat.id,
            status: "Available",
            reason: null,
          })}
          onClose={() => setSelectedSeatRef(null)}
          navigate={navigate}
        />
      )}

      {pendingAction && (
        <ConfirmationDialog
          title={pendingAction.status === "Unavailable"
            ? `Mark ${selectedSeat?.seatCode} as unavailable?`
            : `Make ${selectedSeat?.seatCode} available?`}
          message={pendingAction.status === "Unavailable"
            ? "Students will no longer be able to check in to this seat."
            : "This will allow students to check in to this seat when the section is open."}
          details={pendingAction.status === "Unavailable"
            ? [{ label: "Reason", value: pendingAction.reason }]
            : undefined}
          confirmLabel="Confirm"
          onConfirm={confirmSeatStatusChange}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  );
}
