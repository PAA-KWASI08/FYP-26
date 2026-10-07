import { CheckCircle2, Clock3 } from "lucide-react";

export default function AvailabilityReminder({
  session,
  checkInConfirmation,
  checkoutConfirmation,
  activeSessionVisible,
  contentScrollTop,
  warningDismissed,
  warningRef,
}) {
  if (checkoutConfirmation) {
    return (
      <aside
        className="mb-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 sm:px-4"
        role="status"
      >
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          Checked out successfully. Your session at {checkoutConfirmation.seat} is complete and the seat is available again.
        </p>
      </aside>
    );
  }

  if (checkInConfirmation) {
    return (
      <aside
        className="mb-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 sm:px-4"
        role="status"
      >
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          Check-in successful. Your study session at {checkInConfirmation.section} · {checkInConfirmation.seat} has started.
        </p>
      </aside>
    );
  }

  if (session?.sessionStatus === "active") {
    if (activeSessionVisible) return null;

    return (
      <aside className="mb-3 flex items-start gap-2 rounded-xl border border-[#C9C8EC] bg-[#ECEBFA] px-3 py-2.5 text-sm text-[#140B63] sm:px-4">
        <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          <span className="font-semibold">Active session:</span> {session.section} · {session.seat}
        </p>
      </aside>
    );
  }

  const warningOpacity = Math.max(0, 1 - contentScrollTop / 64);
  const warningHidden = warningDismissed;

  if (warningHidden) return null;

  return (
    <aside
      ref={warningRef}
      className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-800 sm:px-4"
      style={{ opacity: warningOpacity, transition: "opacity 300ms ease-out" }}
    >
      <p>⚠️ Please check in before studying and check out when you finish. This keeps seat availability accurate.</p>
    </aside>
  );
}
