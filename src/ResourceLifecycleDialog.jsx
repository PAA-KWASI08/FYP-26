import { useState } from "react";

export default function ResourceLifecycleDialog({
  resourceType,
  name,
  isActive,
  busy,
  onCancel,
  onConfirm,
}) {
  const [action, setAction] = useState(isActive ? "deactivate" : "activate");
  const labels = {
    deactivate: "Deactivate temporarily",
    activate: "Activate",
    delete: "Delete permanently",
  };
  const descriptions = {
    deactivate: "Hide this item from students. You can activate it again later.",
    activate: "Make this item active again. Its regular open/closed or available status will remain unchanged.",
    delete: "Remove this item from the active catalog permanently. Its database record is archived so historical sessions remain linked.",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="resource-lifecycle-title"
        className="w-full max-w-md rounded-xl border border-[#DDE3F2] bg-white p-5 shadow-xl sm:p-6"
      >
        <h2 id="resource-lifecycle-title" className="text-lg font-bold text-[#140B63]">
          Manage {resourceType}: {name}
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          Choose what to do with this {resourceType.toLocaleLowerCase()}.
        </p>
        <fieldset className="mt-4 space-y-2">
          <legend className="sr-only">Choose an action</legend>
          {[...(isActive ? ["deactivate"] : ["activate"]), "delete"].map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#DDE3F2] p-3"
            >
              <input
                type="radio"
                name="resource-lifecycle-action"
                value={option}
                checked={action === option}
                onChange={() => setAction(option)}
                className="mt-1 accent-[#140B63]"
              />
              <span>
                <span className="block text-sm font-semibold text-[#140B63]">{labels[option]}</span>
                <span className="mt-0.5 block text-xs text-gray-600">{descriptions[option]}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-10 rounded-lg border border-[#DDE3F2] px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(action)}
            disabled={busy}
            className={`min-h-10 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
              action === "delete" ? "bg-[#9F2D20]" : "bg-[#140B63]"
            }`}
          >
            {busy ? "Saving…" : `Confirm ${labels[action]}`}
          </button>
        </div>
      </section>
    </div>
  );
}
