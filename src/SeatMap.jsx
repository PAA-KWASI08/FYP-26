import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  Search,
  X,
  ArrowLeft,
} from "lucide-react";
import { getSectionAvailability, getSeatStatus } from "./sections";
import { useStudentSession } from "./studentSession";
import StudentProfileMenu from "./StudentProfileMenu";
import { getSections } from "./lib/sectionService";
import { getSeatCountsForSection } from "./lib/seatService";

export default function SeatMap() {
  const navigate = useNavigate();
  const { sectionId } = useParams();
  const { sections: currentSections, databaseSeats, catalogSyncError } = useStudentSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedSeatId, setFocusedSeatId] = useState(null);
  const [supabaseSections, setSupabaseSections] = useState(null);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [sectionsError, setSectionsError] = useState(null);
  const selectedSection = currentSections.find((section) => section.id === sectionId);
  const orderedSections = supabaseSections
    ? [...supabaseSections].sort((left, right) => {
      const leftIsOpen = left.status?.toLowerCase() === "open";
      const rightIsOpen = right.status?.toLowerCase() === "open";
      if (leftIsOpen !== rightIsOpen) return leftIsOpen ? -1 : 1;
      return left.name.localeCompare(right.name);
    })
    : supabaseSections;

  const isMapView = Boolean(selectedSection);
  useEffect(() => {
    if (sectionId) return undefined;

    let cancelled = false;
    const loadSections = async () => {
      try {
        const result = await getSections();
        if (cancelled) return;
        if (result.error) {
          setSectionsError(result.error);
          setSupabaseSections(null);
        } else {
          setSectionsError(null);
          setSupabaseSections(result.data);
        }
      } catch (error) {
        if (cancelled) return;
        setSectionsError(error instanceof Error ? error : new Error(String(error)));
        setSupabaseSections(null);
      } finally {
        if (!cancelled) setSectionsLoading(false);
      }
    };

    void loadSections();
    return () => {
      cancelled = true;
    };
  }, [sectionId]);

  const normalizedQuery = searchQuery.trim().toUpperCase().replace(/\s+/g, "");
  const numericQuery = selectedSection && normalizedQuery.match(
    new RegExp(`^(?:${selectedSection.prefix})-?0*(\\d+)$`),
  );
  const matchingSeats = selectedSection && normalizedQuery
    ? selectedSection.seats.filter((seat) => {
      if (numericQuery) {
        return Number(seat.seatCode.slice(selectedSection.prefix.length + 1)) === Number(numericQuery[1]);
      }
      return seat.seatCode.includes(normalizedQuery);
    })
    : [];
  const firstMatchId = matchingSeats[0]?.id;
  const highlightedSeatId = matchingSeats.some((seat) => seat.id === focusedSeatId)
    ? focusedSeatId
    : firstMatchId;

  useEffect(() => {
    if (firstMatchId) {
      document.getElementById(`seat-${firstMatchId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [firstMatchId, selectedSection?.id]);

  if (sectionId && !selectedSection) {
    return <Navigate to="/sections" replace />;
  }

  const clearSearch = () => {
    setSearchQuery("");
    setFocusedSeatId(null);
  };

  const focusSeat = (seat) => {
    setFocusedSeatId(seat.id);
    document.getElementById(`seat-${seat.id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <div className={`sections-page min-h-full w-full min-w-0 bg-[#F5F5F5] p-2.5 sm:p-3 ${isMapView ? "seat-map-view" : ""}`}>
        <div className="sections-page-layout min-h-full min-w-0 flex flex-col">
          <div className="sections-header flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-[10px] uppercase tracking-[0.16em] text-[#140B63]">
                Welcome Back,
              </h2>

              <h1 data-tour-anchor="student-section-list" className="text-2xl sm:text-3xl font-bold mt-1 truncate">
                {isMapView ? selectedSection.name : "Sections"}
              </h1>
              <p className="text-gray-500 text-sm truncate">
                {isMapView ? "Section seat availability" : "View current availability by section"}
              </p>
            </div>

            <StudentProfileMenu compact />
          </div>

          <div className="sections-divider mt-2 border-b border-black/30" />

          <div className="sections-content mt-2 flex-1 overflow-y-auto pr-1">
            {catalogSyncError && (
              <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
                {catalogSyncError}
              </p>
            )}
            {isMapView ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => navigate("/sections")}
                  className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-[#5B5FC7] transition hover:bg-[#F2F2FF]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sections
                </button>

                {selectedSection.status === "Closed" ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <h2 className="font-bold">This section is closed</h2>
                    <p className="mt-1 text-sm">Seats in this section are unavailable while it is closed.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-xl border p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold">{selectedSection.name} Seat Availability</h2>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                          {Object.entries(getSectionAvailability(selectedSection)).map(([label, count]) => (
                            <p key={label} className={label === "available" ? "font-semibold text-[#140B63]" : "text-gray-600"}>
                              {count} {label === "total" ? "seats" : label}
                            </p>
                          ))}
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                        {selectedSection.status}
                      </span>
                    </div>

                    <div className="bg-white rounded-xl border p-3 sm:p-4 flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-[#DDE4DE] flex-shrink-0" aria-hidden="true" />
                        <span className="text-sm">Available</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-[#F1DADA] flex-shrink-0" aria-hidden="true" />
                        <span className="text-sm">Occupied</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-[#ECE7CF] flex-shrink-0" aria-hidden="true" />
                        <span className="text-sm">Unavailable</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border p-3 sm:p-4">
                      <p className="mb-4 text-center text-sm text-gray-600">
                        {catalogSyncError
                          ? "Database seat data could not be refreshed. Displayed statuses may be outdated."
                          : "Seat status is loaded from the database. Viewing a seat does not claim it."}
                      </p>

                      <label data-tour-anchor="student-seat-search" className="relative mb-4 block">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                          type="search"
                          value={searchQuery}
                          onChange={(event) => {
                            setSearchQuery(event.target.value);
                            setFocusedSeatId(null);
                          }}
                          placeholder="Search a seat by section seat label"
                          aria-label="Search seat label"
                          className="h-[42px] w-full rounded-lg border py-2 pl-9 pr-20 outline-none focus:border-[#5B5FC7]"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={clearSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                          >
                            <X className="h-3.5 w-3.5" />
                            Clear
                          </button>
                        )}
                      </label>

                      {normalizedQuery && (
                        <div className="mb-4 rounded-lg border bg-[#F8FAFC] p-3" aria-live="polite">
                          {matchingSeats.length > 0 ? (
                            <>
                              <p className="mb-2 text-sm font-semibold text-[#140B63]">
                                {matchingSeats.length} matching {matchingSeats.length === 1 ? "seat" : "seats"}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {matchingSeats.map((seat) => {
                                  const status = getSeatStatus(seat);
                                  const statusStyle = status === "Available"
                                    ? "bg-[#DDE4DE] text-[#233b28]"
                                    : status === "Occupied"
                                      ? "bg-[#F1DADA] text-[#713b3b]"
                                      : "bg-[#ECE7CF] text-[#554d2b]";

                                  return (
                                    <button
                                      key={seat.id}
                                      type="button"
                                      onClick={() => focusSeat(seat)}
                                      className={`rounded-md px-3 py-2 text-sm font-semibold ${statusStyle} ${
                                        highlightedSeatId === seat.id ? "ring-2 ring-[#5B5FC7] ring-offset-1" : ""
                                      }`}
                                    >
                                      {seat.seatCode} · {status.toUpperCase()}
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            <div>
                              <p className="font-semibold text-[#140B63]">Seat not found</p>
                              <p className="mt-1 text-sm text-gray-600">Check the seat number and try again.</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap justify-center gap-1 sm:gap-2 sm:gap-2.5">
                        {selectedSection.seats.map((seat) => {
                          const status = getSeatStatus(seat);
                          const bgColor = status === "Available"
                            ? "bg-[#DDE4DE]"
                            : status === "Occupied"
                              ? "bg-[#F1DADA]"
                              : "bg-[#ECE7CF]";

                          return (
                            <div
                              key={seat.id}
                              id={`seat-${seat.id}`}
                              role="img"
                              aria-label={`Seat ${seat.seatCode}: ${status}`}
                              title={`${seat.seatCode}: ${status}`}
                              className={`flex items-center justify-center min-h-9 min-w-12 px-1 rounded-lg text-[10px] sm:text-xs font-semibold ${bgColor} ${
                                matchingSeats.some((match) => match.id === seat.id)
                                  ? "ring-2 ring-[#5B5FC7] ring-offset-1"
                                  : ""
                              } ${
                                highlightedSeatId === seat.id ? "outline outline-2 outline-[#F47C5C] outline-offset-2" : ""
                              }`}
                            >
                              {seat.seatCode}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 bg-[#EFEFEF] h-[50px] rounded-xl flex items-center justify-center text-gray-500 font-semibold text-sm truncate">
                        WALKWAY
                      </div>

                      <div className="mt-3 border rounded-xl h-[60px] flex items-center justify-center text-lg font-bold">
                        ↑ ENTRANCE
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div>
                <p className="sections-intro mb-3 text-sm text-gray-600">
                  View an available seat, go to the library, occupy the seat, then check in.
                </p>
                {sectionsLoading && (
                  <p className="mb-3 text-xs text-gray-500" role="status">Loading library sections…</p>
                )}
                {sectionsError && (
                  <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
                    Unable to load library sections from Supabase: {sectionsError.message}
                  </p>
                )}
                {!sectionsLoading && !sectionsError && supabaseSections?.length === 0 && (
                  <p className="mb-3 rounded-lg border border-[#DDE3F2] bg-white p-3 text-sm text-gray-600">
                    No library sections were returned by Supabase.
                  </p>
                )}
                {!sectionsError && supabaseSections?.length > 0 && (
                  <div className="section-card-grid grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {orderedSections.map((section) => {
                    const seatSection = currentSections.find((item) => item.id === section.id);
                    const databaseCounts = getSeatCountsForSection(databaseSeats, section.id);
                    const isOpen = section.status?.toLowerCase() === "open";
                    const displayStatus = isOpen ? "Open" : "Closed";

                    return (
                      <button
                        key={section.id}
                        data-tour-section-route={`/seatmap/${section.id}`}
                        type="button"
                        disabled={!isOpen || !seatSection}
                        onClick={() => navigate(`/seatmap/${section.id}`)}
                        className="section-summary-card rounded-xl border bg-white p-4 text-left transition hover:border-[#5B5FC7] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="text-lg font-bold">{section.name}</h2>
                            {section.description && (
                              <p className="mt-1 text-sm text-gray-600">{section.description}</p>
                            )}
                          </div>
                          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
                            isOpen ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          }`}>
                            {displayStatus}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 sm:p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-emerald-800 sm:text-sm">Available Seats</p>
                            <p className="mt-1 text-4xl font-extrabold leading-none text-emerald-900 sm:text-5xl">{databaseCounts?.available ?? "—"}</p>
                          </div>
                          <div className="rounded-xl border border-[#DDE3F2] bg-[#FCFCFF] p-3 sm:p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-600 sm:text-sm">Total Seats</p>
                            <p className="mt-1 text-3xl font-bold leading-none text-[#140B63] sm:text-4xl">{databaseCounts?.total ?? "—"}</p>
                          </div>
                          <div className="rounded-lg border border-[#F1DADA] bg-[#FFF8F8] p-3">
                            <p className="text-xs font-semibold text-gray-600 sm:text-sm">Occupied</p>
                            <p className="mt-1 text-2xl font-bold leading-none text-[#713B3B] sm:text-3xl">{databaseCounts?.occupied ?? "—"}</p>
                          </div>
                          <div className="rounded-lg border border-[#ECE7CF] bg-[#FFFEF8] p-3">
                            <p className="text-xs font-semibold text-gray-600 sm:text-sm">Unavailable</p>
                            <p className="mt-1 text-2xl font-bold leading-none text-[#554D2B] sm:text-3xl">{databaseCounts?.unavailable ?? "—"}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm font-medium text-[#5B5FC7]">
                          {!seatSection
                            ? "Seat data is not available for this section"
                            : isOpen
                              ? "View seat map →"
                              : "This section is closed"}
                        </p>
                      </button>
                    );
                  })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
  );
}