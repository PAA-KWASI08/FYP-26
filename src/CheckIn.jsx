import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, CheckCircle2, QrCode, Search, X } from "lucide-react";
import { useStudentSession } from "./studentSession";
import ConfirmationDialog from "./ConfirmationDialog";

function QrScanner({ onDetected, onError }) {
  const videoRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let controls;
    const timeout = window.setTimeout(() => {
      if (!cancelled) onError("QR code not recognized. Enter the seat ID manually.");
    }, 20000);

    import("@zxing/browser").then(({ BrowserQRCodeReader }) =>
      new BrowserQRCodeReader().decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (!result || cancelled) return;
        cancelled = true;
        window.clearTimeout(timeout);
        controls?.stop();
        onDetected(result.getText());
      })
    ).then((scannerControls) => {
      if (cancelled) scannerControls.stop();
      else controls = scannerControls;
    }).catch(() => {
      if (!cancelled) onError("Camera access was not available.");
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controls?.stop();
    };
  }, [onDetected, onError]);

  return (
    <div className="overflow-hidden rounded-xl border border-[#DDE4DE] bg-black">
      <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
      <p className="bg-white px-3 py-2 text-center text-xs text-gray-600">
        Scan the QR code attached to your desk.
      </p>
    </div>
  );
}

export default function CheckIn() {
  const navigate = useNavigate();
  const { sections, session, checkIn } = useStudentSession();
  const [seatId, setSeatId] = useState("");
  const [identifiedSeat, setIdentifiedSeat] = useState(null);
  const [confirmingCheckIn, setConfirmingCheckIn] = useState(false);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = (event) => setIsMobile(event.matches);
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (session?.sessionStatus !== "active") return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [session]);

  const formatDuration = (start, end) => {
    const minutes = Math.max(0, Math.floor((end - start) / 60000));
    const hours = Math.floor(minutes / 60);
    return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
  };

  const identifySeat = useCallback((value) => {
    const normalizedSeatId = value.trim().toUpperCase().replace(/\s+/g, "");
    setSeatId(normalizedSeatId);
    setError("");
    setScanning(false);

    const section = sections.find((item) =>
      item.seats.some((seat) => seat.seatCode === normalizedSeatId),
    );
    const seat = section?.seats.find((item) => item.seatCode === normalizedSeatId);

    if (!section || !seat) {
      setIdentifiedSeat(null);
      setError("Seat not found. Check the seat ID and try again.");
      return;
    }

    setIdentifiedSeat({ section, seat });
  }, [sections]);

  const handleScanError = useCallback((message) => {
    setScanning(false);
    setError(message);
  }, []);

  const findSeat = (event) => {
    event.preventDefault();
    setIdentifiedSeat(null);
    identifySeat(seatId);
  };

  const confirmCheckIn = () => {
    if (!identifiedSeat) return;
    const result = checkIn(identifiedSeat.seat.seatCode);
    if (!result.ok) {
      setError(result.message);
      setIdentifiedSeat(null);
      setConfirmingCheckIn(false);
      return;
    }
    setConfirmingCheckIn(false);
    navigate("/dashboard#current-session");
  };

  const seatCanBeUsed = identifiedSeat?.section.status === "Open"
    && identifiedSeat.seat.status === "Available";

  return (
    <div className="min-h-full w-full min-w-0 bg-[#F5F5F5] p-3 sm:p-4">
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-4">
        <header className="border-b border-black/10 pb-3">
          <h1 className="text-2xl font-bold text-[#140B63] sm:text-3xl">Check In to a Seat</h1>
          <p className="mt-1 text-sm text-gray-600">
            Identify the seat you are currently using to start your study session.
          </p>
        </header>

        {session?.sessionStatus === "active" ? (
          <section className="rounded-xl border bg-white p-4 sm:p-6" aria-live="polite">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
              <div>
                <h2 className="font-bold text-[#140B63]">You already have an active study session.</h2>
                <p className="mt-2 text-sm text-gray-700">{session.section} · {session.seat}</p>
                <p className="mt-1 text-sm text-gray-600">
                  Study time: {formatDuration(session.checkInTime, new Date(now))}
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard#current-session")}
                  className="mt-4 rounded-lg bg-[#140B63] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#251b79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
                >
                  View Current Session
                </button>
              </div>
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {isMobile && (
              <section className="rounded-xl border bg-white p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-[#140B63]" />
                  <h2 className="font-bold text-[#140B63]">Scan Seat QR Code</h2>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  A QR code identifies the seat only; it does not detect occupancy.
                </p>
                {scanning ? (
                  <div className="mt-4 space-y-3">
                    <QrScanner onDetected={identifySeat} onError={handleScanError} />
                    <button
                      type="button"
                      onClick={() => setScanning(false)}
                      className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      <X className="h-4 w-4" />
                      Cancel scan
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setIdentifiedSeat(null);
                      setScanning(true);
                    }}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#140B63] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#251b79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
                  >
                    <Camera className="h-4 w-4" />
                    Scan QR Code
                  </button>
                )}
              </section>
            )}

            <section className="rounded-xl border bg-white p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-[#140B63]" />
                <h2 className="font-bold text-[#140B63]">Enter Seat ID Manually</h2>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {isMobile
                  ? "You can enter the ID shown on your desk if scanning is unavailable."
                  : "On a computer, enter the seat ID shown on your desk."}
              </p>
              <form onSubmit={findSeat} className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700" htmlFor="seat-id">
                  Enter seat ID
                </label>
                <input
                  id="seat-id"
                  type="text"
                  value={seatId}
                  onChange={(event) => {
                    setSeatId(event.target.value);
                    setIdentifiedSeat(null);
                    setError("");
                  }}
                  placeholder="RH-024"
                  autoComplete="off"
                  className="h-11 w-full rounded-lg border px-3 outline-none focus:border-[#5B5FC7] focus:ring-2 focus:ring-[#5B5FC7]/20"
                />
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#5B5FC7] px-4 py-2.5 text-sm font-semibold text-[#140B63] transition hover:bg-[#F2F2FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
                >
                  <Search className="h-4 w-4" />
                  Find Seat
                </button>
              </form>
            </section>
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
            {error}
          </p>
        )}

        {identifiedSeat && !session && (
          <section className="rounded-xl border bg-white p-4 sm:p-5" aria-live="polite">
            <h2 className="text-lg font-bold text-[#140B63]">Seat Found</h2>
            <p className="mt-2 text-sm text-gray-700">{identifiedSeat.section.name}</p>
            <p className="text-lg font-semibold text-[#140B63]">{identifiedSeat.seat.seatCode}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Status</span>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
                seatCanBeUsed
                  ? "bg-emerald-100 text-emerald-800"
                  : identifiedSeat.seat.status === "Occupied"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-900"
              }`}>
                {identifiedSeat.seat.status.toUpperCase()}
              </span>
            </div>
            {!seatCanBeUsed && (
              <p className="mt-3 text-sm text-gray-700">
                {identifiedSeat.section.status !== "Open"
                  ? "This section is closed. Choose another seat."
                  : identifiedSeat.seat.status === "Occupied"
                    ? "This seat is currently occupied. Please choose another seat."
                    : "This seat is currently unavailable."}
              </p>
            )}
            {seatCanBeUsed && (
              <p className="mt-3 text-sm text-gray-600">
                Confirm only after you have physically occupied this seat.
              </p>
            )}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {seatCanBeUsed && (
                <button
                  type="button"
                  onClick={() => setConfirmingCheckIn(true)}
                  className="rounded-lg bg-[#140B63] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#251b79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
                >
                  Confirm Check In
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIdentifiedSeat(null);
                  setSeatId("");
                  setError("");
                }}
                className="rounded-lg border px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Choose another seat
              </button>
            </div>
          </section>
        )}
      </div>
      {confirmingCheckIn && identifiedSeat && (
        <ConfirmationDialog
          title="Confirm Check-In"
          message="Are you currently sitting at this seat?"
          details={[
            { label: "Seat ID", value: identifiedSeat.seat.seatCode },
            { label: "Section", value: identifiedSeat.section.name },
          ]}
          confirmLabel="Confirm Check-In"
          onConfirm={confirmCheckIn}
          onCancel={() => setConfirmingCheckIn(false)}
        />
      )}
    </div>
  );
}
