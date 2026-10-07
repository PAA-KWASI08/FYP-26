import { useMemo, useState } from "react";
import { ArrowRight, Armchair, Search } from "lucide-react";
import { Link } from "react-router-dom";
import ConfirmationDialog from "./ConfirmationDialog";
import AdminSectionStatus from "./AdminSectionStatus";
import { getSectionAvailability } from "./sections";
import { useStudentSession } from "./studentSession";

function SectionCard({ section, onRequestStatusChange }) {
  const availability = getSectionAvailability(section);
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

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-[#E7EAF3] bg-[#FCFCFF] p-3 sm:grid-cols-4">
        <div className="col-span-2 rounded-md bg-[#EEF0FA] px-3 py-2 sm:col-span-1 sm:row-span-2 sm:flex sm:flex-col sm:justify-center">
          <p className="text-xs font-medium text-[#51427C]">Available</p>
          <p className="mt-0.5 text-2xl font-bold leading-none text-[#140B63]">{availability.available}</p>
        </div>
        <div className="px-1 py-1 sm:px-2">
          <p className="text-xs text-gray-500">Total seats</p>
          <p className="mt-0.5 font-semibold text-[#140B63]">{availability.total}</p>
        </div>
        <div className="px-1 py-1 sm:px-2">
          <p className="text-xs text-gray-500">Occupied</p>
          <p className="mt-0.5 font-semibold text-[#140B63]">{availability.occupied}</p>
        </div>
        <div className="col-span-2 px-1 py-1 sm:col-span-2 sm:px-2">
          <p className="text-xs text-gray-500">Unavailable</p>
          <p className="mt-0.5 font-semibold text-[#140B63]">{availability.unavailable}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-[#EEF0F5] pt-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => onRequestStatusChange(section, nextStatus)}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#DDE3F2] bg-white px-3 py-2 text-sm font-semibold text-[#140B63] transition hover:border-[#C9C8EC] hover:bg-[#F8F9FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
        >
          {section.status === "Open" ? "Close section" : "Open section"}
        </button>
        <Link
          to={`/admin/seats?section=${encodeURIComponent(section.id)}`}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#4B4FA3] transition hover:bg-[#F8F9FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
        >
          <Armchair className="h-4 w-4" aria-hidden="true" />
          Manage seats
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export default function AdminSections() {
  const { sections, setSectionStatus } = useStudentSession();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [pendingChange, setPendingChange] = useState(null);
  const [error, setError] = useState("");

  const visibleSections = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return sections.filter((section) => (
      (statusFilter === "All" || section.status === statusFilter)
      && (
        !normalizedQuery
        || section.name.toLocaleLowerCase().includes(normalizedQuery)
        || section.id.toLocaleLowerCase().includes(normalizedQuery)
      )
    ));
  }, [query, sections, statusFilter]);

  const requestStatusChange = (section, status) => {
    setError("");
    setPendingChange({ section, status });
  };

  const confirmStatusChange = () => {
    const result = setSectionStatus(pendingChange.section.id, pendingChange.status);
    if (!result.ok) {
      setError(result.message);
      setPendingChange(null);
      return;
    }
    setPendingChange(null);
  };

  const cancelStatusChange = () => setPendingChange(null);
  const isClosing = pendingChange?.status === "Closed";
  const statusAction = isClosing ? "Close" : "Open";

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 p-3 sm:gap-5 sm:p-5">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-[#140B63] sm:text-3xl">Library Sections</h2>
        <p className="text-sm text-gray-600">Manage library sections and monitor their current availability.</p>
      </header>

      {error && (
        <p role="alert" className="rounded-lg border border-[#F0D9CE] bg-[#FBF1EC] px-3 py-2 text-sm text-[#8A4934]">
          {error}
        </p>
      )}

      <section aria-label="Section filters" className="flex flex-col gap-3 rounded-xl border border-[#DDE3F2] bg-white p-3 shadow-sm sm:flex-row sm:items-center">
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

      {visibleSections.length > 0 ? (
        <section aria-label="Library sections" className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {visibleSections.map((section) => (
            <SectionCard key={section.id} section={section} onRequestStatusChange={requestStatusChange} />
          ))}
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-[#DDE3F2] bg-white px-4 py-10 text-center">
          <p className="font-semibold text-[#140B63]">No sections match your search</p>
          <p className="mt-1 text-sm text-gray-500">Try another name or status filter.</p>
        </section>
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
    </div>
  );
}
