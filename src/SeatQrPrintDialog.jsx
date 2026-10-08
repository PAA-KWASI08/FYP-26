import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Printer, Search, X } from "lucide-react";

export default function SeatQrPrintDialog({
  labels,
  title = "Seat QR labels",
  initialSectionId = null,
  onClose,
}) {
  const [sectionFilter, setSectionFilter] = useState(initialSectionId ?? "all");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => labels
    .filter((label) => !initialSectionId || label.sectionId === initialSectionId)
    .map((label) => label.id));
  const [showPreview, setShowPreview] = useState(false);
  const sections = useMemo(() => (
    [...new Map(labels.map((label) => [label.sectionId, {
      id: label.sectionId,
      name: label.sectionName,
    }])).values()].sort((left, right) => left.name.localeCompare(right.name))
  ), [labels]);
  const visibleLabels = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return labels.filter((label) => (
      (sectionFilter === "all" || label.sectionId === sectionFilter)
      && (
        !normalizedQuery
        || label.seatCode.toLocaleLowerCase().includes(normalizedQuery)
        || label.sectionName.toLocaleLowerCase().includes(normalizedQuery)
        || label.qrIdentifier.toLocaleLowerCase().includes(normalizedQuery)
      )
    ));
  }, [labels, query, sectionFilter]);
  const selectedLabels = useMemo(() => (
    labels.filter((label) => selectedIds.includes(label.id))
  ), [labels, selectedIds]);
  const seatCheckInUrl = (qrIdentifier) => {
    const url = new URL("/check-in", window.location.origin);
    url.searchParams.set("seat", qrIdentifier);
    return url.toString();
  };

  const toggleLabel = (id) => {
    setSelectedIds((current) => (
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    ));
  };

  const selectVisible = (select) => {
    setSelectedIds((current) => {
      const visibleIds = new Set(visibleLabels.map((label) => label.id));
      const remaining = current.filter((id) => !visibleIds.has(id));
      return select ? [...remaining, ...visibleIds] : remaining;
    });
  };
  const selectWholeSection = () => {
    const sectionIds = new Set(labels
      .filter((label) => sectionFilter === "all" || label.sectionId === sectionFilter)
      .map((label) => label.id));
    setSelectedIds((current) => [...new Set([...current, ...sectionIds])]);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-5">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .seat-qr-print-dialog, .seat-qr-print-dialog * { visibility: visible !important; }
          .seat-qr-print-dialog {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          .seat-qr-print-controls, .seat-qr-selection { display: none !important; }
          .seat-qr-print-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          .seat-qr-label { break-inside: avoid; }
        }
      `}</style>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="seat-qr-print-title"
        className="seat-qr-print-dialog my-auto max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-[#DDE3F2] bg-white p-4 shadow-xl sm:p-6"
      >
        <div className="seat-qr-print-controls mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="seat-qr-print-title" className="text-xl font-bold text-[#140B63]">
              {showPreview ? "Preview selected QR labels" : title}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {showPreview
                ? `${selectedLabels.length} label${selectedLabels.length === 1 ? "" : "s"} ready to print. Check the QR codes and unique IDs below.`
                : "Select a whole section or individual seats. Scanning a printed QR code opens this site for sign-in and check-in or check-out confirmation."}
            </p>
          </div>
          <div className="flex gap-2">
            {showPreview && (
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#DDE3F2] px-3 py-2 text-sm font-semibold text-gray-700"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to selection
              </button>
            )}
            {showPreview && (
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#140B63] px-3 py-2 text-sm font-semibold text-white"
              >
                <Printer className="h-4 w-4" aria-hidden="true" /> Print labels
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#DDE3F2] px-3 py-2 text-sm font-semibold text-gray-700"
            >
              <X className="h-4 w-4" aria-hidden="true" /> Close
            </button>
          </div>
        </div>

        {!showPreview ? (
          <div className="seat-qr-selection space-y-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <label className="text-sm font-semibold text-gray-700">
                Section
                <select
                  value={sectionFilter}
                  onChange={(event) => setSectionFilter(event.target.value)}
                  className="mt-1 min-h-11 w-full rounded-lg border border-[#DDE3F2] bg-white px-3 text-sm font-medium text-[#140B63]"
                >
                  <option value="all">All sections</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>{section.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-gray-700">
                Search seats
                <span className="relative mt-1 block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Seat code, section, or unique QR ID"
                    className="min-h-11 w-full rounded-lg border border-[#DDE3F2] bg-white py-2 pl-9 pr-3 text-sm font-normal text-[#140B63]"
                  />
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-gray-600">
                {selectedLabels.length} of {labels.length} labels selected
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectWholeSection}
                  disabled={!labels.some((label) => sectionFilter === "all" || label.sectionId === sectionFilter)}
                  className="min-h-9 rounded-lg border border-[#DDE3F2] px-3 py-1.5 text-sm font-semibold text-[#140B63] disabled:opacity-50"
                >
                  {sectionFilter === "all" ? "Select all sections" : "Select whole section"}
                </button>
                <button
                  type="button"
                  onClick={() => selectVisible(true)}
                  disabled={!visibleLabels.length}
                  className="min-h-9 rounded-lg border border-[#DDE3F2] px-3 py-1.5 text-sm font-semibold text-[#140B63] disabled:opacity-50"
                >
                  Select visible ({visibleLabels.length})
                </button>
                <button
                  type="button"
                  onClick={() => selectVisible(false)}
                  disabled={!visibleLabels.some((label) => selectedIds.includes(label.id))}
                  className="min-h-9 rounded-lg border border-[#DDE3F2] px-3 py-1.5 text-sm font-semibold text-gray-700 disabled:opacity-50"
                >
                  Clear visible
                </button>
              </div>
            </div>

            <div className="max-h-[48vh] overflow-y-auto rounded-lg border border-[#DDE3F2]">
              {visibleLabels.length ? visibleLabels.map((label) => (
                <label
                  key={label.id}
                  className="flex min-h-12 cursor-pointer items-center gap-3 border-b border-[#EEF0F5] px-3 py-2 last:border-b-0 hover:bg-[#F8F9FF]"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(label.id)}
                    onChange={() => toggleLabel(label.id)}
                    className="h-4 w-4 accent-[#140B63]"
                  />
                  <span className="min-w-0 flex-1 text-sm font-semibold text-[#140B63]">
                    {label.sectionName} · {label.seatCode}
                  </span>
                  <span className="text-sm font-bold tracking-wide text-gray-700">{label.qrIdentifier}</span>
                </label>
              )) : (
                <p className="px-3 py-6 text-center text-sm text-gray-500">No seats match this search.</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                disabled={!selectedLabels.length}
                className="min-h-11 rounded-lg bg-[#140B63] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Preview {selectedLabels.length} label{selectedLabels.length === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        ) : (
          <div className="seat-qr-print-grid grid grid-cols-2 gap-3 sm:grid-cols-3">
            {selectedLabels.map((label) => (
              <article
                key={label.id}
                className="seat-qr-label flex min-w-0 flex-col items-center rounded-lg border border-dashed border-gray-400 p-3 text-center"
              >
                <QRCodeSVG
                  value={seatCheckInUrl(label.qrIdentifier)}
                  size={150}
                  level="H"
                  includeMargin
                  aria-label={`QR code link for ${label.sectionName} seat ${label.seatCode}`}
                />
                <p className="mt-2 text-xl font-bold tracking-wide text-black">{label.qrIdentifier}</p>
                <p className="mt-1 text-xs text-gray-700">{label.sectionName} · {label.seatCode}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
