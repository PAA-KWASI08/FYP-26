import { useNavigate } from "react-router-dom";
import {
  Armchair,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Library,
  MapPin,
  QrCode,
  ScanLine,
} from "lucide-react";

const steps = [
  {
    title: "Check availability",
    description: "View current recorded availability on the Dashboard, then open Sections to see each library area.",
    icon: ScanLine,
  },
  {
    title: "Choose a section",
    description: "Choose Reference Hall, Students’ Reference, Africana, IAC, or E-Resources to view its seat map.",
    icon: Library,
  },
  {
    title: "Go to the library",
    description: "Go to the section and physically occupy an available seat. Viewing a seat does not claim it.",
    icon: MapPin,
  },
  {
    title: "Identify your seat",
    description: "On a phone, scan the desk QR code. On a computer, enter the seat ID manually.",
    icon: QrCode,
  },
  {
    title: "Check in",
    description: "The system checks the seat status. If it is available and you have no active session, confirm check-in.",
    icon: CheckCircle2,
  },
  {
    title: "Study",
    description: "Your Dashboard shows the section, seat, start time, and elapsed study time for your current session.",
    icon: Clock3,
  },
  {
    title: "Check out",
    description: "When you finish, check out. The session is completed and the seat returns to available in the recorded status.",
    icon: Armchair,
  },
];

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full w-full min-w-0 bg-[#F5F5F5] p-3 sm:p-4">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <header className="flex flex-col gap-3 border-b border-black/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#140B63]">Scan2Seat guide</p>
            <h1 className="mt-1 text-2xl font-bold text-[#140B63] sm:text-3xl">How Scan2Seat Works</h1>
            <p className="mt-1 text-sm text-gray-600">A simple walk-in flow from availability to checkout.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-[#5B5FC7] bg-white px-4 py-2 text-sm font-semibold text-[#140B63] transition hover:bg-[#F2F2FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </header>

        <aside className="rounded-xl border border-[#C9C8EC] bg-[#ECEBFA] p-3 text-sm font-medium text-[#140B63] sm:p-4">
          Scan2Seat is designed for walk-in seat use. Viewing a seat does not reserve or claim it.
        </aside>

        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {steps.map(({ title, description, icon: Icon }, index) => (
            <li key={title} className="rounded-xl border bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EEF8] text-[#140B63]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#5B5FC7]">
                    Step {index + 1}
                  </p>
                  <h2 className="mt-0.5 font-bold text-[#140B63]">{title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{description}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
