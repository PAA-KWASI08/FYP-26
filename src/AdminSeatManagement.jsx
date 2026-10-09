import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Archive, Armchair, Pencil, Plus, Printer, QrCode, Search } from "lucide-react";
import AdminSectionStatus from "./AdminSectionStatus";
import ConfirmationDialog from "./ConfirmationDialog";
import { formatAdminDuration, formatAdminTime } from "./adminData";
import { useStudentSession } from "./studentSession";
import {
  createSeat,
  deactivateSeat,
  getAdminSeatQrLabels,
  getSeatCountsForSection,
  getSeatQrLabelErrorMessage,
  regenerateSeatQr,
  updateSeat,
} from "./lib/seatService";
import SeatQrPrintDialog from "./SeatQrPrintDialog";

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

const seatInputClassName = "min-h-11 w-full rounded-lg border border-[#DDE3F2] bg-white px-3 py-2 text-sm text-[#140B63] outline-none focus:border-[#8B8FD1] focus:ring-2 focus:ring-[#E7E8F8]";

function createNextSeatCode(section) {
  const prefix = section.prefix || section.name
    .split(/[\s'-]+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toLocaleUpperCase();
  const largest = section.seats.reduce((maximum, seat) => {
    const match = seat.seatCode.match(new RegExp(`^${prefix}-(\\d+)$`, "i"));
    return match ? Math.max(maximum, Number(match[1])) : maximum;
  }, 0);
  return `${prefix}-${String(largest + 1).padStart(3, "0")}`;
}

function SeatFormDialog({ sections, seat, initialSectionId, busy, error, onCancel, onSubmit }) {
  const [sectionId, setSectionId] = useState(seat?.sectionId ?? initialSectionId ?? sections[0]?.id ?? "");
  const selectedSection = sections.find((item) => item.id === sectionId);
  const [seatCode, setSeatCode] = useState(seat?.seatCode ?? (selectedSection ? createNextSeatCode(selectedSection) : ""));
  const [status, setStatus] = useState(seat?.status ?? "Available");
  const [unavailableReason, setUnavailableReason] = useState(seat?.unavailableReason ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="seat-form-title"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({
            sectionId,
            seatCode,
            qrIdentifier: seat?.qrIdentifier,
            status,
            unavailableReason,
          });
        }}
        className="my-auto w-full max-w-lg rounded-xl border border-[#DDE3F2] bg-white p-5 shadow-xl sm:p-6"
      >
        <h2 id="seat-form-title" className="text-lg font-bold text-[#140B63]">{seat ? "Edit Seat" : "Add Seat"}</h2>
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Section
            <select
              required
              disabled={Boolean(seat)}
              value={sectionId}
              onChange={(event) => {
                const nextSection = sections.find((item) => item.id === event.target.value);
                setSectionId(event.target.value);
                if (nextSection) {
                  const nextCode = createNextSeatCode(nextSection);
                  setSeatCode(nextCode);
                }
              }}
              className={`mt-1 ${seatInputClassName}`}
            >
              {sections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-gray-700">
            Seat Code
            <input required maxLength={40} value={seatCode} onChange={(event) => setSeatCode(event.target.value)} className={`mt-1 ${seatInputClassName}`} />
          </label>
          <p className="rounded-lg bg-[#F8F9FF] p-3 text-sm text-gray-600">
            {seat
              ? `Seat QR ID: ${seat.qrIdentifier ?? "Loading…"}`
              : "A unique four-digit seat ID and QR code will be generated automatically when you save."}
          </p>
          <label className="block text-sm font-semibold text-gray-700">
            Status
            <select
              value={status}
              disabled={Boolean(seat && seat.status === "Occupied")}
              onChange={(event) => setStatus(event.target.value)}
              className={`mt-1 ${seatInputClassName}`}
            >
              {seat?.status === "Occupied" && <option>Occupied</option>}
              <option>Available</option>
              <option>Unavailable</option>
            </select>
          </label>
          {seat?.status === "Occupied" && (
            <p className="text-xs text-gray-600">Occupied status can only be changed by the student check-out process.</p>
          )}
          {status === "Unavailable" && (
            <label className="block text-sm font-semibold text-gray-700">
              Unavailable Reason
              <input required maxLength={120} value={unavailableReason} onChange={(event) => setUnavailableReason(event.target.value)} className={`mt-1 ${seatInputClassName}`} />
            </label>
          )}
        </div>
        {error && <p role="alert" className="mt-3 rounded-lg border border-[#F0D9CE] bg-[#FBF1EC] px-3 py-2 text-sm text-[#8A4934]">{error}</p>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" disabled={busy} onClick={onCancel} className="min-h-11 rounded-lg border border-[#DDE3F2] px-4 py-2 text-sm font-semibold text-gray-700">Cancel</button>
          <button type="submit" disabled={busy || !sections.length || status === "Occupied"} className="min-h-11 rounded-lg bg-[#140B63] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Saving…" : seat ? "Save Changes" : "Add Seat"}
          </button>
        </div>
      </form>
    </div>
  );
}

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
      <p className={`mt-1 text-3xl font-bold leading-none sm:text-4xl ${style ? style.badge.split(" ").at(-1) : "text-[#140B63]"}`}>
        {value}
      </p>
    </article>
  );
}

function SeatDetailsDialog({
  seat,
  section,
  activeSession,
  now,
  unavailableReason,
  setUnavailableReason,
  otherReason,
  setOtherReason,
  onBeginMarkUnavailable,
  onMakeAvailable,
  onEdit,
  onRegenerateQr,
  onRemove,
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
            <dd className="mt-0.5 font-semibold text-[#140B63]">{seat.qrIdentifier ?? "Loading…"}</dd>
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
                <dt className="text-xs text-gray-500">Student</dt>
                <dd className="mt-0.5 font-semibold text-[#140B63]">{activeSession.studentName || activeSession.studentId}</dd>
                {activeSession.studentName && <dd className="text-xs text-gray-500">{activeSession.studentId}</dd>}
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
                : "No active database session is associated with this occupied seat."}
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

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onRegenerateQr} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#DDE3F2] bg-white px-3 py-2 text-sm font-semibold text-[#140B63]">
            <QrCode className="h-4 w-4" aria-hidden="true" /> Regenerate QR ID
          </button>
          <button type="button" onClick={onEdit} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#DDE3F2] bg-white px-3 py-2 text-sm font-semibold text-[#140B63]">
            <Pencil className="h-4 w-4" aria-hidden="true" /> Edit Seat
          </button>
          <button type="button" onClick={onRemove} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#F0D9CE] bg-white px-3 py-2 text-sm font-semibold text-[#8A4934]">
            <Archive className="h-4 w-4" aria-hidden="true" /> Remove / Deactivate
          </button>
        </div>

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
  const {
    sections,
    databaseSeats,
    catalogSyncError,
    adminSessions,
    adminSessionsError,
    adminSessionsLoading,
    setSeatAvailability,
    syncSeatRecord,
    removeSeatRecord,
  } = useStudentSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const sectionFilter = searchParams.get("section") ?? "all";
  const [query, setQuery] = useState("");
  const [selectedSeatRef, setSelectedSeatRef] = useState(null);
  const [unavailableReason, setUnavailableReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [seatForm, setSeatForm] = useState(null);
  const [qrIdentifiers, setQrIdentifiers] = useState({});
  const [qrIdentifiersLoading, setQrIdentifiersLoading] = useState(true);
  const [qrIdentifiersError, setQrIdentifiersError] = useState("");
  const [qrLabels, setQrLabels] = useState(null);
  const [qrLabelsInitialSectionId, setQrLabelsInitialSectionId] = useState(null);
  const [loadingQrLabels, setLoadingQrLabels] = useState(false);
  const [pendingQrRegeneration, setPendingQrRegeneration] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadQrIdentifiers = async () => {
      try {
        const result = await getAdminSeatQrLabels();
        if (cancelled) return;
        if (result.error) {
          console.error("Unable to load administrator seat QR identifiers:", result.error.message);
          setQrIdentifiersError(`Seat QR IDs could not be loaded. ${result.error.message}`);
          return;
        }
        setQrIdentifiers(Object.fromEntries(
          (result.data ?? []).map((item) => [item.id, item.qr_identifier]),
        ));
      } catch (loadError) {
        if (!cancelled) {
          console.error("Unable to request administrator seat QR identifiers:", loadError);
          setQrIdentifiersError("Seat QR IDs could not be loaded. Refresh and try again.");
        }
      } finally {
        if (!cancelled) setQrIdentifiersLoading(false);
      }
    };
    void loadQrIdentifiers();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSection = sections.find((section) => section.id === sectionFilter);
  const activeSectionFilter = sectionFilter === "all" || selectedSection ? sectionFilter : "all";
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const displaySections = useMemo(() => catalogSyncError ? [] : sections
    .filter((section) => activeSectionFilter === "all" || section.id === activeSectionFilter)
    .map((section) => ({
      ...section,
      seats: section.seats.filter((seat) => (
        !normalizedQuery
        || seat.id.toLocaleLowerCase().includes(normalizedQuery)
        || seat.seatCode.toLocaleLowerCase().includes(normalizedQuery)
        || section.name.toLocaleLowerCase().includes(normalizedQuery)
      )),
    }))
    .filter((section) => !normalizedQuery || section.seats.length > 0), [activeSectionFilter, catalogSyncError, normalizedQuery, sections]);

  const displayedSeatCodes = new Set(displaySections.flatMap((section) => section.seats.map((seat) => seat.seatCode)));
  const displayedDatabaseSeats = !catalogSyncError && Array.isArray(databaseSeats)
    ? databaseSeats.filter((seat) => displayedSeatCodes.has(seat.seat_code))
    : null;
  const summary = displayedDatabaseSeats?.reduce((totals, seat) => {
    totals.total += 1;
    if (seat.status === "available") totals.available += 1;
    else if (seat.status === "occupied") totals.occupied += 1;
    else if (seat.status === "unavailable") totals.unavailable += 1;
    return totals;
  }, { total: 0, available: 0, occupied: 0, unavailable: 0 }) ?? null;

  const selectedSeatRecord = !catalogSyncError && selectedSeatRef
    ? sections.find((section) => section.id === selectedSeatRef.sectionId)
      ?.seats.find((seat) => seat.id === selectedSeatRef.seatId)
    : null;
  const selectedSeat = selectedSeatRecord
    ? { ...selectedSeatRecord, qrIdentifier: qrIdentifiers[selectedSeatRecord.id] ?? selectedSeatRecord.qrIdentifier }
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

  const printSeatQrLabels = async (sectionId = null) => {
    setError("");
    setLoadingQrLabels(true);
    try {
      const result = await getAdminSeatQrLabels();
      if (result.error) {
        console.error("Unable to load seat QR labels:", result.error.message);
        setError(getSeatQrLabelErrorMessage(result.error));
        return;
      }
      if (!result.data?.length) {
        setError("There are no seats with QR labels to print in this selection.");
        return;
      }
      setQrIdentifiers(Object.fromEntries(result.data.map((item) => [item.id, item.qr_identifier])));
      setQrIdentifiersError("");
      setQrLabels(result.data.map((item) => ({
        id: item.id,
        sectionId: item.section_id,
        sectionName: item.section_name,
        seatCode: item.seat_code,
        qrIdentifier: item.qr_identifier,
      })));
      setQrLabelsInitialSectionId(sectionId);
    } catch (loadError) {
      console.error("Unable to request seat QR labels:", loadError);
      setError("Seat QR codes could not be loaded. Refresh and try again.");
    } finally {
      setLoadingQrLabels(false);
    }
  };

  const confirmQrRegeneration = async () => {
    if (!pendingQrRegeneration) return;
    setSaving(true);
    const result = await regenerateSeatQr(pendingQrRegeneration.id);
    setSaving(false);
    if (result.error) {
      console.error("Unable to regenerate the seat QR ID:", result.error.message);
      setError(`Seat QR ID could not be regenerated. ${result.error.message}`);
      setPendingQrRegeneration(null);
      return;
    }
    const updatedSeat = result.data;
    setQrIdentifiers((current) => ({ ...current, [updatedSeat.id]: updatedSeat.qr_identifier }));
    syncSeatRecord(updatedSeat);
    setPendingQrRegeneration(null);
    setQrLabels([{
      id: updatedSeat.id,
      sectionName: selectedSeatSection?.name ?? "Library section",
      seatCode: updatedSeat.seat_code,
      qrIdentifier: updatedSeat.qr_identifier,
    }]);
    setSuccess(`New QR ID ${updatedSeat.qr_identifier} generated. Print and attach it to ${updatedSeat.seat_code}.`);
  };

  const openSeatDetails = (sectionId, seatId) => {
    setError("");
    setUnavailableReason("");
    setOtherReason("");
    setSelectedSeatRef({ sectionId, seatId });
  };

  const confirmSeatStatusChange = async () => {
    const selected = selectedSeat;
    if (!selected || !pendingAction) return;
    setSaving(true);
    const databaseResult = await updateSeat(selected.seatCode, {
      seatCode: selected.seatCode,
      qrIdentifier: selected.qrIdentifier ?? selected.seatCode,
      status: pendingAction.status,
      unavailableReason: pendingAction.reason ?? "",
    });
    setSaving(false);
    if (databaseResult.error) {
      setError(databaseResult.error.message);
      setPendingAction(null);
      return;
    }
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
    syncSeatRecord(databaseResult.data, selected.seatCode);
    setPendingAction(null);
    setSelectedSeatRef(null);
    setError("");
    setSuccess(`Seat ${databaseResult.data.seat_code} updated.`);
  };

  const submitSeatForm = async (values) => {
    setSaving(true);
    setError("");
    const result = seatForm.seat
      ? await updateSeat(seatForm.seat.seatCode, values)
      : await createSeat(values);
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (result.data.qr_identifier) {
      setQrIdentifiers((current) => ({ ...current, [result.data.id]: result.data.qr_identifier }));
    }
    syncSeatRecord(result.data, seatForm.seat?.seatCode ?? null);
    setSeatForm(null);
    setError("");
    if (!seatForm.seat && result.data.qr_identifier) {
      setSuccess(`Seat added with unique ID ${result.data.qr_identifier}.`);
      setQrLabels([{
        id: result.data.id,
        sectionName: sections.find((item) => item.id === result.data.section_id)?.name ?? "Library section",
        seatCode: result.data.seat_code,
        qrIdentifier: result.data.qr_identifier,
      }]);
    } else {
      setSuccess(seatForm.seat ? "Seat updated." : "Seat added.");
    }
  };

  const confirmSeatRemoval = async () => {
    if (!pendingRemoval) return;
    const { seat, section } = pendingRemoval;
    if (adminSessionsLoading || adminSessionsError) {
      setError("Cannot verify recorded active sessions right now. Refresh and try again.");
      setPendingRemoval(null);
      return;
    }
    if (seat.status === "Occupied" || (
      adminSessions.some((item) => item.sessionStatus === "active"
        && item.sectionId === section.id
        && item.seatId === seat.id)
    )) {
      setError("This seat has an active or occupied session and cannot be removed.");
      setPendingRemoval(null);
      return;
    }
    setSaving(true);
    const result = await deactivateSeat(seat.seatCode);
    setSaving(false);
    setPendingRemoval(null);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (result.data) syncSeatRecord(result.data, seat.seatCode);
    else removeSeatRecord(section.id, seat.seatCode);
    setError("");
    setSuccess(result.data
      ? "Seat was safely marked unavailable. No historical session records were deleted."
      : "Seat removed. No historical session records were deleted.");
    setSelectedSeatRef(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 p-3 sm:gap-5 sm:p-5">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#140B63] sm:text-3xl">Seat Management</h2>
            <p className="text-sm text-gray-600">View and manage individual library seats.</p>
          </div>
          <button
            data-tour-anchor="admin-seat-create"
            type="button"
            disabled={!sections.length || Boolean(catalogSyncError)}
            onClick={() => {
              setError("");
              setSeatForm({ seat: null, sectionId: selectedSection?.id ?? sections[0]?.id });
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#140B63] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add Seat
          </button>
          <button
            data-tour-anchor="admin-seat-labels"
            type="button"
            onClick={() => void printSeatQrLabels(selectedSection?.id ?? null)}
            disabled={loadingQrLabels || !sections.length}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#DDE3F2] bg-white px-4 py-2 text-sm font-semibold text-[#140B63] disabled:opacity-50"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            {loadingQrLabels ? "Loading QR Labels…" : selectedSection ? "Print Section QR Labels" : "Print All QR Labels"}
          </button>
        </div>
      </header>

      {error && (
        <p role="alert" className="rounded-lg border border-[#F0D9CE] bg-[#FBF1EC] px-3 py-2 text-sm text-[#8A4934]">
          {error}
        </p>
      )}
      {catalogSyncError && (
        <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {catalogSyncError}
        </p>
      )}
      {adminSessionsError && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{adminSessionsError} Occupied-seat session details are unavailable.</p>}
      {success && <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{success}</p>}

      <section data-tour-anchor="admin-seat-filters" aria-label="Seat filters" className="flex flex-col gap-3 rounded-xl border border-[#DDE3F2] bg-white p-3 shadow-sm sm:flex-row sm:items-center">
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
      {qrIdentifiersError && (
        <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {qrIdentifiersError} Seat QR actions are disabled until the IDs can be loaded.
        </p>
      )}

      <section aria-label="Database seat summary" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryCard label="Total Seats" value={summary?.total ?? "—"} />
        <SummaryCard label="Available" value={summary?.available ?? "—"} status="Available" />
        <SummaryCard label="Occupied" value={summary?.occupied ?? "—"} status="Occupied" />
        <SummaryCard label="Unavailable" value={summary?.unavailable ?? "—"} status="Unavailable" />
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
            const databaseCounts = getSeatCountsForSection(catalogSyncError ? null : databaseSeats, section.id);
            return (
              <section key={section.id} aria-label={`${section.name} seats`} className="min-w-0 rounded-xl border border-[#DDE3F2] bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex flex-col gap-2 border-b border-[#EEF0F5] pb-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-bold text-[#140B63]">{section.name}</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {databaseCounts
                        ? `${databaseCounts.total} total seats · ${databaseCounts.available} available · ${databaseCounts.occupied} occupied · ${databaseCounts.unavailable} unavailable`
                        : "Database seat counts unavailable"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void printSeatQrLabels(section.id)}
                    disabled={loadingQrLabels}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#DDE3F2] px-3 py-2 text-sm font-semibold text-[#140B63]"
                  >
                    <Printer className="h-4 w-4" aria-hidden="true" /> Print section QR labels
                  </button>
                  <AdminSectionStatus status={section.status} />
                </div>
                {section.seats.length ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 2xl:grid-cols-12">
                    {section.seats.map((seat, index) => (
                    <button
                      key={seat.id}
                      data-tour-anchor={index === 0 ? "admin-seat-list" : undefined}
                      type="button"
                      onClick={() => openSeatDetails(section.id, seat.id)}
                      disabled={qrIdentifiersLoading || Boolean(qrIdentifiersError)}
                      aria-label={`${seat.seatCode}, ${seat.status}`}
                      className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7] ${seatStatusStyles[seat.status].tile}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${seatStatusStyles[seat.status].dot}`} aria-hidden="true" />
                      <span className="break-all text-center text-[#140B63]">{seat.seatCode}</span>
                      <span className="text-[10px] font-medium text-gray-600">{seat.status}</span>
                    </button>
                    ))}
                  </div>
                ) : (
                  <p data-tour-anchor="admin-seat-list" className="rounded-lg border border-dashed border-[#DDE3F2] px-4 py-6 text-center text-sm text-gray-500">
                    No seats have been added to this section yet.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <section data-tour-anchor="admin-seat-list" className="rounded-xl border border-dashed border-[#DDE3F2] bg-white px-4 py-10 text-center">
          <Armchair className="mx-auto h-7 w-7 text-[#7A80BD]" aria-hidden="true" />
          <p className="mt-2 font-semibold text-[#140B63]">No seats match your search</p>
          <p className="mt-1 text-sm text-gray-500">Try another seat code or section name.</p>
        </section>
      )}

      {selectedSeat && selectedSeatSection && (
        <SeatDetailsDialog
          seat={selectedSeat}
          section={selectedSeatSection}
          activeSession={adminSessions.find((item) => item.sessionStatus === "active"
            && item.sectionId === selectedSeatSection.id
            && item.seatId === selectedSeat.id)}
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
          onEdit={() => {
            setSeatForm({ seat: selectedSeat, sectionId: selectedSeatSection.id });
            setSelectedSeatRef(null);
          }}
          onRegenerateQr={() => setPendingQrRegeneration(selectedSeat)}
          onRemove={() => setPendingRemoval({ seat: selectedSeat, section: selectedSeatSection })}
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
      {seatForm && (
        <SeatFormDialog
          sections={sections}
          seat={seatForm.seat}
          initialSectionId={seatForm.sectionId}
          busy={saving}
          error={error}
          onCancel={() => setSeatForm(null)}
          onSubmit={submitSeatForm}
        />
      )}
      {pendingRemoval && (
        <ConfirmationDialog
          title={`Remove ${pendingRemoval.seat.seatCode}?`}
          message="The seat is checked for active and historical sessions first. Active seats cannot be removed; seats with history are marked unavailable instead of deleting usage records."
          details={[
            { label: "Section", value: pendingRemoval.section.name },
            { label: "Seat Status", value: pendingRemoval.seat.status },
          ]}
          confirmLabel={saving ? "Checking…" : "Confirm Remove"}
          onConfirm={confirmSeatRemoval}
          onCancel={() => setPendingRemoval(null)}
        />
      )}
      {pendingQrRegeneration && (
        <ConfirmationDialog
          title={`Regenerate QR ID for ${pendingQrRegeneration.seatCode}?`}
          message="The current printed QR ID will stop working immediately. Print and attach the replacement label before students use this seat."
          details={[{ label: "Current QR ID", value: pendingQrRegeneration.qrIdentifier }]}
          confirmLabel={saving ? "Generating…" : "Generate New ID"}
          busy={saving}
          onConfirm={confirmQrRegeneration}
          onCancel={() => {
            if (!saving) setPendingQrRegeneration(null);
          }}
        />
      )}
      {qrLabels && (
        <SeatQrPrintDialog
          labels={qrLabels}
          title="Seat QR labels"
          initialSectionId={qrLabelsInitialSectionId}
          onClose={() => setQrLabels(null)}
        />
      )}
    </div>
  );
}
