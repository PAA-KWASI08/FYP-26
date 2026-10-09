import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Armchair, Archive, Pencil, Plus, Printer, Search } from "lucide-react";
import { Link } from "react-router-dom";
import ConfirmationDialog from "./ConfirmationDialog";
import AdminSectionStatus from "./AdminSectionStatus";
import { useStudentSession } from "./studentSession";
import { createSection, deactivateSection, getSections, updateSection } from "./lib/sectionService";
import {
  getAdminSeatQrLabels,
  getSeatCountsForSection,
  getSeatQrLabelErrorMessage,
} from "./lib/seatService";
import SeatQrPrintDialog from "./SeatQrPrintDialog";

const inputClassName = "min-h-11 w-full rounded-lg border border-[#DDE3F2] bg-white px-3 py-2 text-sm text-[#140B63] outline-none focus:border-[#8B8FD1] focus:ring-2 focus:ring-[#E7E8F8]";

function SectionFormDialog({ section, busy, error, onCancel, onSubmit }) {
  const [name, setName] = useState(section?.name ?? "");
  const [description, setDescription] = useState(section?.description ?? "");
  const [status, setStatus] = useState(section?.status ?? "Open");
  const [initialSeatCount, setInitialSeatCount] = useState("0");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="section-form-title"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({ name, description, status, initialSeatCount: Number(initialSeatCount) });
        }}
        className="w-full max-w-lg rounded-xl border border-[#DDE3F2] bg-white p-5 shadow-xl sm:p-6"
      >
        <h2 id="section-form-title" className="text-lg font-bold text-[#140B63]">
          {section ? "Edit Section" : "Add Section"}
        </h2>
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Section Name
            <input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className={`mt-1 ${inputClassName}`} />
          </label>
          <label className="block text-sm font-semibold text-gray-700">
            Description
            <textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} className={`mt-1 min-h-24 ${inputClassName}`} />
          </label>
          <label className="block text-sm font-semibold text-gray-700">
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={`mt-1 ${inputClassName}`}>
              <option>Open</option>
              <option>Closed</option>
            </select>
          </label>
          {!section && (
            <label className="block text-sm font-semibold text-gray-700">
              Create how many seats now?
              <input
                type="number"
                min="0"
                max="1000"
                step="1"
                value={initialSeatCount}
                onChange={(event) => setInitialSeatCount(event.target.value)}
                className={`mt-1 ${inputClassName}`}
              />
              <span className="mt-1 block text-xs font-normal text-gray-500">
                Every seat receives a unique four-digit ID and QR code automatically.
              </span>
            </label>
          )}
        </div>
        {error && <p role="alert" className="mt-3 rounded-lg border border-[#F0D9CE] bg-[#FBF1EC] px-3 py-2 text-sm text-[#8A4934]">{error}</p>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={busy} className="min-h-11 rounded-lg border border-[#DDE3F2] px-4 py-2 text-sm font-semibold text-gray-700">Cancel</button>
          <button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-[#140B63] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Saving…" : section ? "Save Changes" : "Add Section"}
          </button>
        </div>
      </form>
    </div>
  );
}

function SectionCard({ section, databaseSeatCounts, onRequestStatusChange, onEdit, onRemove, onPrintLabels }) {
  const databaseCounts = getSeatCountsForSection(databaseSeatCounts, section.id);
  const nextStatus = section.status === "Open" ? "Closed" : "Open";

  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-[#DDE3F2] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-bold text-[#140B63]">{section.name}</h2>
          <p className="mt-1 text-xs text-gray-500">Section ID: <span className="font-medium text-gray-700">{section.id}</span></p>
        </div>
        <AdminSectionStatus status={section.status} />
      </div>

      <p className="mt-3 text-xs text-gray-600">
        Total seats: <span className="font-semibold text-[#140B63]">{databaseCounts ? databaseCounts.total : "Unavailable"}</span>
        {databaseCounts && <> · {databaseCounts.available} available</>}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-[#E7EAF3] bg-[#FCFCFF] p-3">
        <div className="rounded-md bg-[#EEF0FA] px-3 py-2">
          <p className="text-xs font-medium text-[#51427C]">Available</p>
          <p className="mt-0.5 text-3xl font-bold leading-none text-[#140B63] sm:text-4xl">{databaseCounts?.available ?? "—"}</p>
        </div>
        <div className="px-1 py-1 sm:px-2">
          <p className="text-xs text-gray-500">Occupied</p>
          <p className="mt-0.5 text-2xl font-bold text-[#140B63]">{databaseCounts?.occupied ?? "—"}</p>
        </div>
        <div className="px-1 py-1 sm:px-2">
          <p className="text-xs text-gray-500">Unavailable</p>
          <p className="mt-0.5 text-2xl font-bold text-[#140B63]">{databaseCounts?.unavailable ?? "—"}</p>
        </div>
      </div>

      <div data-tour-anchor="admin-section-list" className="mt-4 flex flex-col gap-2 border-t border-[#EEF0F5] pt-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onRequestStatusChange(section, nextStatus)} className="min-h-10 rounded-lg border border-[#DDE3F2] bg-white px-3 py-2 text-sm font-semibold text-[#140B63]">
            {section.status === "Open" ? "Close section" : "Open section"}
          </button>
          <button type="button" onClick={() => onEdit(section)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#DDE3F2] bg-white px-3 py-2 text-sm font-semibold text-[#140B63]">
            <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
          </button>
          <button type="button" onClick={() => onRemove(section)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#F0D9CE] bg-white px-3 py-2 text-sm font-semibold text-[#8A4934]">
            <Archive className="h-4 w-4" aria-hidden="true" /> Deactivate
          </button>
        </div>
        <Link
          to={`/admin/seats?section=${encodeURIComponent(section.id)}`}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#4B4FA3] transition hover:bg-[#F8F9FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
        >
          <Armchair className="h-4 w-4" aria-hidden="true" />
          Manage seats
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={() => onPrintLabels(section)}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#4B4FA3] transition hover:bg-[#F8F9FF]"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          Print section QR labels
        </button>
      </div>
    </article>
  );
}

export default function AdminSections() {
  const {
    sections: contextSections,
    databaseSeats,
    adminSessions,
    adminSessionsError,
    adminSessionsLoading,
    catalogSyncError,
    syncSectionRecord,
    syncSeatRecord,
  } = useStudentSession();
  const [databaseSections, setDatabaseSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingQrLabels, setLoadingQrLabels] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [pendingChange, setPendingChange] = useState(null);
  const [editingSection, setEditingSection] = useState(undefined);
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [qrLabels, setQrLabels] = useState(null);
  const [qrLabelsInitialSectionId, setQrLabelsInitialSectionId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loadSections = async () => {
      try {
        const result = await getSections();
        if (cancelled) return;
        if (result.error) {
          setError(`Unable to load sections from Supabase: ${result.error.message}`);
        } else {
          setError("");
          setDatabaseSections(result.data ?? []);
          result.data?.forEach(syncSectionRecord);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(`Unable to load sections from Supabase: ${loadError instanceof Error ? loadError.message : String(loadError)}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadSections();
    return () => {
      cancelled = true;
    };
  }, [syncSectionRecord]);

  const sections = databaseSections.map((record) => {
    const contextSection = contextSections.find((item) => item.id === record.id);
    return {
      ...contextSection,
      ...record,
      status: record.status?.toLocaleLowerCase() === "open" ? "Open" : "Closed",
      seats: contextSection?.seats ?? [],
    };
  });

  const visibleSections = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return sections
      .filter((section) => (
        (statusFilter === "All" || section.status === statusFilter)
        && (
          !normalizedQuery
          || section.name.toLocaleLowerCase().includes(normalizedQuery)
          || section.id.toLocaleLowerCase().includes(normalizedQuery)
        )
      ))
      .sort((sectionA, sectionB) => {
        const statusOrder = { Open: 0, Closed: 1 };
        return (statusOrder[sectionA.status] ?? 2) - (statusOrder[sectionB.status] ?? 2)
          || sectionA.name.localeCompare(sectionB.name);
      });
  }, [query, sections, statusFilter]);

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
        setError("There are no seats with QR labels to print.");
        return;
      }
      const labels = result.data.map((item) => ({
        id: item.id,
        sectionId: item.section_id,
        sectionName: item.section_name,
        seatCode: item.seat_code,
        qrIdentifier: item.qr_identifier,
      }));
      setQrLabels(labels);
      setQrLabelsInitialSectionId(sectionId);
    } catch (loadError) {
      console.error("Unable to request seat QR labels:", loadError);
      setError("Seat QR codes could not be loaded. Refresh and try again.");
    } finally {
      setLoadingQrLabels(false);
    }
  };

  const requestStatusChange = (section, status) => {
    setError("");
    setSuccess("");
    setPendingChange({ section, status });
  };

  const saveSection = async (values) => {
    setSaving(true);
    setError("");
    const result = editingSection
      ? await updateSection(editingSection.id, values)
      : await createSection(values);
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    const savedSection = result.data.section ?? result.data;
    syncSectionRecord(savedSection);
    (result.data.seats ?? []).forEach((seat) => syncSeatRecord(seat));
    setDatabaseSections((current) => editingSection
      ? current.map((item) => item.id === savedSection.id ? savedSection : item)
      : [...current, savedSection].sort((a, b) => a.name.localeCompare(b.name)));
    setEditingSection(undefined);
    setSuccess(editingSection
      ? "Section updated."
      : `Section created with ${(result.data.seats ?? []).length} seats and unique QR IDs.`);
    if (!editingSection && result.data.seats?.length) {
      setQrLabels(result.data.seats.map((seat) => ({
        id: seat.id,
        sectionId: savedSection.id,
        sectionName: savedSection.name,
        seatCode: seat.seat_code,
        qrIdentifier: seat.qr_identifier,
      })));
      setQrLabelsInitialSectionId(savedSection.id);
    }
  };

  const confirmStatusChange = async () => {
    setSaving(true);
    const result = await updateSection(pendingChange.section.id, { status: pendingChange.status });
    setSaving(false);
    setPendingChange(null);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    syncSectionRecord(result.data);
    setDatabaseSections((current) => current.map((item) => item.id === result.data.id ? result.data : item));
    setSuccess(`Section ${pendingChange.status.toLocaleLowerCase()}.`);
  };

  const confirmRemoval = async () => {
    if (adminSessionsLoading || adminSessionsError) {
      setError("Cannot verify recorded active sessions right now. Refresh and try again.");
      setPendingRemoval(null);
      return;
    }
    if (adminSessions.some((item) => item.sessionStatus === "active" && item.sectionId === pendingRemoval.id)) {
      setError("This section has an active seat session and cannot be deactivated.");
      setPendingRemoval(null);
      return;
    }
    setSaving(true);
    const result = await deactivateSection(pendingRemoval.id);
    setSaving(false);
    setPendingRemoval(null);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    syncSectionRecord(result.data);
    setDatabaseSections((current) => current.map((item) => item.id === result.data.id ? result.data : item));
    setSuccess("Section safely deactivated (closed). No seats or session history were deleted.");
  };

  const cancelStatusChange = () => setPendingChange(null);
  const isClosing = pendingChange?.status === "Closed";
  const statusAction = isClosing ? "Close" : "Open";

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 p-3 sm:gap-5 sm:p-5">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#140B63] sm:text-3xl">Library Sections</h2>
            <p className="text-sm text-gray-600">Manage library sections and monitor their current availability.</p>
          </div>
          <button data-tour-anchor="admin-section-create" type="button" onClick={() => { setError(""); setEditingSection(null); }} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#140B63] px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" aria-hidden="true" /> Add Section
          </button>
          <button
            data-tour-anchor="admin-section-labels"
            type="button"
            onClick={() => void printSeatQrLabels()}
            disabled={loadingQrLabels || loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#DDE3F2] bg-white px-4 py-2 text-sm font-semibold text-[#140B63] disabled:opacity-50"
          >
            <Printer className="h-4 w-4" aria-hidden="true" /> {loadingQrLabels ? "Loading QR Labels…" : "Print All QR Labels"}
          </button>
        </div>
      </header>

      {loading && <p role="status" className="text-sm text-gray-500">Loading sections…</p>}
      {error && (
        <p role="alert" className="rounded-lg border border-[#F0D9CE] bg-[#FBF1EC] px-3 py-2 text-sm text-[#8A4934]">
          {error}
        </p>
      )}
      {catalogSyncError && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{catalogSyncError} Seat counts are unavailable.</p>}
      {adminSessionsError && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{adminSessionsError} Active-session checks are unavailable.</p>}
      {success && <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{success}</p>}

      <section data-tour-anchor="admin-section-filters" aria-label="Section filters" className="flex flex-col gap-3 rounded-xl border border-[#DDE3F2] bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search sections</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search section name or ID"
            className="min-h-10 w-full rounded-lg border border-[#DDE3F2] bg-[#FCFCFF] py-2 pl-9 pr-3 text-sm text-[#140B63] outline-none transition placeholder:text-gray-400 focus:border-[#8B8FD1] focus:ring-2 focus:ring-[#E7E8F8]"
          />
        </label>
        <label className="flex min-h-10 items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="min-h-10 min-w-32 rounded-lg border border-[#DDE3F2] bg-white px-3 text-sm font-medium text-[#140B63] outline-none focus:border-[#8B8FD1] focus:ring-2 focus:ring-[#E7E8F8]"
          >
            <option>All</option>
            <option>Open</option>
            <option>Closed</option>
          </select>
        </label>
      </section>

      {!loading && visibleSections.length > 0 ? (
        <section aria-label="Library sections" className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {visibleSections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              databaseSeatCounts={catalogSyncError ? null : databaseSeats}
              onRequestStatusChange={requestStatusChange}
              onPrintLabels={(item) => void printSeatQrLabels(item.id)}
              onEdit={(item) => { setError(""); setEditingSection(item); }}
              onRemove={(item) => { setError(""); setPendingRemoval(item); }}
            />
          ))}
        </section>
      ) : !loading && (
        <section data-tour-anchor="admin-section-list" className="rounded-xl border border-dashed border-[#DDE3F2] bg-white px-4 py-10 text-center">
          <p className="font-semibold text-[#140B63]">{databaseSections.length ? "No sections match your search" : "No sections have been loaded"}</p>
          <p className="mt-1 text-sm text-gray-500">{databaseSections.length ? "Try another name or status filter." : "Sections will appear here when the Supabase query succeeds."}</p>
        </section>
      )}

      {editingSection !== undefined && (
        <SectionFormDialog
          section={editingSection}
          busy={saving}
          error={error}
          onCancel={() => setEditingSection(undefined)}
          onSubmit={saveSection}
        />
      )}

      {pendingChange && (
        <ConfirmationDialog
          title={`${statusAction} ${pendingChange.section.name}?`}
          message={isClosing
            ? "This will prevent new check-ins to this section. Existing active sessions will not be automatically ended."
            : "This will allow students to check in to available seats in this section."}
          details={[
            { label: "Section ID", value: pendingChange.section.id },
            { label: "Current status", value: pendingChange.section.status },
          ]}
          confirmLabel={`Confirm ${statusAction}`}
          onConfirm={confirmStatusChange}
          onCancel={cancelStatusChange}
        />
      )}
      {pendingRemoval && (
        <ConfirmationDialog
          title={`Deactivate ${pendingRemoval.name}?`}
          message="This will close the section so students cannot check in. Seats and historical session records are never deleted. Sections with active sessions cannot be deactivated."
          details={[{ label: "Section ID", value: pendingRemoval.id }]}
          confirmLabel={saving ? "Checking…" : "Confirm Deactivation"}
          onConfirm={confirmRemoval}
          onCancel={() => setPendingRemoval(null)}
        />
      )}
      {qrLabels && (
        <SeatQrPrintDialog
          labels={qrLabels}
          title="Section seat QR labels"
          initialSectionId={qrLabelsInitialSectionId}
          onClose={() => setQrLabels(null)}
        />
      )}
    </div>
  );
}
