import { useEffect } from "react";

export default function ConfirmationDialog({
  title,
  message,
  details,
  confirmLabel,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-message"
        className="w-full max-w-md rounded-xl border bg-white p-5 shadow-xl sm:p-6"
      >
        <h2 id="confirmation-dialog-title" className="text-lg font-bold text-[#140B63]">
          {title}
        </h2>
        <p id="confirmation-dialog-message" className="mt-2 text-sm text-gray-700">
          {message}
        </p>
        {details?.length > 0 && (
          <dl className="mt-4 space-y-2 rounded-lg bg-[#F8FAFC] p-3">
            {details.map(({ label, value }) => (
              <div key={label} className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-semibold text-[#140B63]">{value}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-[#140B63] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#251b79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
