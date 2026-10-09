import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Camera, CheckCircle2, MapPin, QrCode, Search, X } from "lucide-react";
import { useStudentSession } from "./studentSession";
import ConfirmationDialog from "./ConfirmationDialog";
import { findSeatByQrIdentifier } from "./lib/seatService";
import {
  BALME_GEOFENCE,
  LOCATION_MAX_AGE_MS,
  classifyBalmeGeofencePosition,
} from "./lib/geofence";

function QrScanner({ onDetected, onError }) {
  const videoRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let controls;
    const cameraErrorMessage = (error) => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        return "Camera scanning requires a secure HTTPS address. Open the deployed HTTPS site, allow camera access, or enter the seat ID manually.";
      }

      switch (error?.name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
        case "SecurityError":
          return "Camera permission was denied. Allow camera access for this site in your browser settings, then try again.";
        case "NotFoundError":
        case "DevicesNotFoundError":
          return "No camera was found on this device. Enter the seat ID manually.";
        case "NotReadableError":
        case "TrackStartError":
          return "The camera is being used by another app or could not start. Close other camera apps and try again.";
        case "OverconstrainedError":
          return "The requested camera is not available. Try another camera or enter the seat ID manually.";
        default:
          return "The camera could not be opened. Check browser camera permissions and try again, or enter the seat ID manually.";
      }
    };

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      onError(cameraErrorMessage());
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      if (!cancelled) onError("QR code not recognized. Keep the code in view or enter the seat ID manually.");
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
    }).catch((error) => {
      if (!cancelled) onError(cameraErrorMessage(error));
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
        Scan the QR code attached to your desk to read its seat ID.
      </p>
    </div>
  );
}

export default function CheckIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    session,
    checkIn,
    checkout,
    currentStudentId,
    studentSessionsLoading,
    locationVerificationEnabled,
    locationVerificationLoading,
    locationVerificationError,
  } = useStudentSession();
  const [seatId, setSeatId] = useState("");
  const [identifiedSeat, setIdentifiedSeat] = useState(null);
  const [studyTimerEnabled, setStudyTimerEnabled] = useState(false);
  const [timerChoice, setTimerChoice] = useState("60");
  const [customDuration, setCustomDuration] = useState("1");
  const [customDurationUnit, setCustomDurationUnit] = useState("hours");
  const [confirmingCheckIn, setConfirmingCheckIn] = useState(false);
  const [confirmingCheckout, setConfirmingCheckout] = useState(false);
  const [savingCheckIn, setSavingCheckIn] = useState(false);
  const [savingCheckout, setSavingCheckout] = useState(false);
  const [identifyingSeat, setIdentifyingSeat] = useState(false);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [processingCameraPhoto, setProcessingCameraPhoto] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  const [now, setNow] = useState(() => Date.now());
  const [locationRetry, setLocationRetry] = useState(0);
  const [locationStatus, setLocationStatus] = useState(() => (
    navigator.geolocation
      ? { status: "checking" }
      : { status: "error", message: "This browser does not provide location services." }
  ));
  const processedQrValue = useRef("");
  const scannedQrValue = searchParams.get("seat") ?? "";

  useEffect(() => {
    if (locationVerificationLoading || locationVerificationError || !locationVerificationEnabled) return undefined;
    if (!navigator.geolocation) return undefined;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const status = classifyBalmeGeofencePosition(
          position.coords.latitude,
          position.coords.longitude,
          position.coords.accuracy,
        );
        setLocationStatus({
          status,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp || Date.now(),
        });
      },
      (locationError) => {
        setLocationStatus({
          status: "error",
          message: locationError.code === locationError.PERMISSION_DENIED
            ? "Allow location access in your browser to continue."
            : "Your location could not be verified. Check that location services are enabled and try again.",
        });
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [locationRetry, locationVerificationEnabled, locationVerificationError, locationVerificationLoading]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = (event) => setIsMobile(event.matches);
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const formatDuration = (start, end) => {
    const elapsedSeconds = Math.max(0, Math.floor((end - start) / 1000));
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
  };

  const locationIsVerified = !locationVerificationLoading
    && !locationVerificationError
    && (!locationVerificationEnabled
      || (locationStatus.status === "inside"
        && now - locationStatus.timestamp <= LOCATION_MAX_AGE_MS));

  const identifySeat = useCallback(async (value) => {
    let seatIdentifier = value.trim();
    try {
      const scannedUrl = new URL(seatIdentifier);
      seatIdentifier = scannedUrl.searchParams.get("seat") ?? seatIdentifier;
    } catch {
      // A manually entered or in-app scanned QR ID is not a URL.
    }
    const normalizedSeatId = seatIdentifier.toUpperCase().replace(/\s+/g, "");
    setSeatId(normalizedSeatId);
    setError("");
    setScanning(false);
    setIdentifiedSeat(null);

    if (!/^#[0-9]{4}$/.test(normalizedSeatId)) {
      setError("This QR code does not contain a valid seat ID. Ask library staff to replace the label.");
      return;
    }

    setIdentifyingSeat(true);
    try {
      const result = await findSeatByQrIdentifier(normalizedSeatId);
      if (result.error) {
        console.error("Unable to resolve the scanned seat QR ID:", result.error.message);
        setError(result.error.code === "42501"
          ? "Sign in with an active student account to use this seat QR code."
          : "This seat QR code could not be verified. Refresh and try again.");
        return;
      }
      if (!result.data?.seat_code) {
        setError("This seat QR code was not found. Ask library staff to print a replacement label.");
        return;
      }

      const seat = {
        seatCode: result.data.seat_code,
        sectionId: result.data.section_id,
        sectionName: result.data.section_name,
        status: result.data.seat_status,
        sectionStatus: result.data.section_status,
      };
      setIdentifiedSeat({
        qrIdentifier: normalizedSeatId,
        seat,
        action: session?.sessionStatus === "active"
          ? session.seat === seat.seatCode ? "checkout" : "active_elsewhere"
          : "checkin",
      });
    } catch (lookupError) {
      console.error("Unable to request the scanned seat QR ID:", lookupError);
      setError("This seat QR code could not be verified. Check your connection and try again.");
    } finally {
      setIdentifyingSeat(false);
    }
  }, [session]);

  useEffect(() => {
    if (!scannedQrValue || studentSessionsLoading || processedQrValue.current === scannedQrValue) return;
    processedQrValue.current = scannedQrValue;
    void identifySeat(scannedQrValue);
  }, [identifySeat, scannedQrValue, studentSessionsLoading]);

  const handleScanError = useCallback((message) => {
    setScanning(false);
    setError(message);
  }, []);

  const scanCameraPhoto = async (event) => {
    const imageFile = event.target.files?.[0];
    event.target.value = "";
    if (!imageFile) return;

    setError("");
    setProcessingCameraPhoto(true);
    const imageUrl = URL.createObjectURL(imageFile);
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const result = await new BrowserQRCodeReader().decodeFromImageUrl(imageUrl);
      await identifySeat(result.getText());
    } catch (cameraError) {
      if (cameraError?.name === "NotFoundException") {
        setError("No QR code was found in that photo. Retake the photo with the full code in focus.");
      } else {
        console.error("Unable to read a QR code from the camera photo:", cameraError);
        setError("The QR code photo could not be read. Try again or enter the seat ID manually.");
      }
    } finally {
      URL.revokeObjectURL(imageUrl);
      setProcessingCameraPhoto(false);
    }
  };

  const findSeat = (event) => {
    event.preventDefault();
    void identifySeat(seatId);
  };

  const confirmCheckIn = async () => {
    if (!identifiedSeat) return;
    const duration = timerChoice === "custom"
      ? Number(customDuration) * (customDurationUnit === "hours" ? 60 : 1)
      : Number(timerChoice);
    if (studyTimerEnabled && (!Number.isInteger(duration) || duration < 1 || duration > 1440)) {
      setError("Choose a valid study duration up to 24 hours, or skip the timer.");
      return;
    }
    if (locationVerificationEnabled && !locationIsVerified) {
      setError("Your location is no longer verified inside the Balme Library geofence. Check your location and try again.");
      setConfirmingCheckIn(false);
      return;
    }
    setSavingCheckIn(true);
    try {
      const result = await checkIn(
        identifiedSeat.qrIdentifier,
        locationVerificationEnabled ? locationStatus : null,
        studyTimerEnabled ? duration : null,
      );
      if (!result.ok) {
        setError(result.message);
        setIdentifiedSeat(null);
        setConfirmingCheckIn(false);
        return;
      }
      setConfirmingCheckIn(false);
      navigate("/dashboard#current-session");
    } finally {
      setSavingCheckIn(false);
    }
  };

  const confirmCheckOut = async () => {
    if (!session || identifiedSeat?.action !== "checkout") return;
    setSavingCheckout(true);
    try {
      const result = await checkout(session.id, currentStudentId);
      if (!result.ok) {
        setError(result.message);
        setConfirmingCheckout(false);
        return;
      }
      setConfirmingCheckout(false);
      navigate("/dashboard");
    } finally {
      setSavingCheckout(false);
    }
  };

  const plannedDurationMinutes = timerChoice === "custom"
    ? Number(customDuration) * (customDurationUnit === "hours" ? 60 : 1)
    : Number(timerChoice);
  const plannedDurationLabel = timerChoice === "custom"
    ? `${customDuration} ${customDurationUnit === "hours" ? "hour" : "minute"}${Number(customDuration) === 1 ? "" : "s"}`
    : `${Number(timerChoice) / 60} ${Number(timerChoice) === 60 ? "hour" : "hours"}`;
  const seatCanBeUsed = Boolean(identifiedSeat?.qrIdentifier);
  const studyDurationIsInvalid = studyTimerEnabled
    && (!Number.isInteger(plannedDurationMinutes)
      || plannedDurationMinutes < 1
      || plannedDurationMinutes > 1440);

  return (
    <div className="min-h-full w-full min-w-0 bg-[#F5F5F5] p-3 sm:p-4">
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-4">
        <header className="border-b border-black/10 pb-3">
          <h1 data-tour-anchor="student-checkin-overview" className="text-2xl font-bold text-[#140B63] sm:text-3xl">Check In to a Seat</h1>
          <p className="mt-1 text-sm text-gray-600">
            Identify the seat you are currently using to start your study session.
          </p>
        </header>

        {!session && (
          <section
            data-tour-anchor="student-location-check"
            className={`rounded-xl border p-4 ${
              !locationVerificationEnabled && !locationVerificationLoading && !locationVerificationError
                ? "border-blue-200 bg-blue-50"
                : locationIsVerified
                ? "border-emerald-200 bg-emerald-50"
                : locationStatus.status === "outside"
                  ? "border-rose-200 bg-rose-50"
                  : "border-amber-200 bg-amber-50"
            }`}
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <MapPin className={`mt-0.5 h-5 w-5 shrink-0 ${
                !locationVerificationEnabled && !locationVerificationLoading && !locationVerificationError
                  ? "text-blue-700"
                  : locationIsVerified ? "text-emerald-700" : "text-amber-700"
              }`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-[#140B63]">
                  {locationVerificationLoading
                    ? "Loading check-in settings…"
                    : locationVerificationError
                      ? "Check-in settings unavailable"
                      : !locationVerificationEnabled
                        ? "Location verification is temporarily disabled for testing"
                        : locationStatus.status === "checking"
                    ? "Checking your location…"
                    : locationIsVerified
                      ? "Location verified inside Balme Library"
                      : locationStatus.status === "outside"
                        ? "You are outside the Balme Library check-in area"
                        : locationStatus.status === "uncertain"
                          ? "Your location is too imprecise to verify"
                          : "Location access is required"}
                </h2>
                <p className="mt-1 text-sm text-gray-700">
                  {locationVerificationError
                    || (locationVerificationLoading
                      ? "Please wait while the secure check-in settings are loaded."
                      : !locationVerificationEnabled
                        ? "Testing mode: check-in does not verify your location, and geofence alerts and automatic seat release are paused."
                        : `Check-in requires enabled location services and a verified position within ${BALME_GEOFENCE.radiusMeters} m of Balme Library.`)}
                  {locationVerificationEnabled && Number.isFinite(locationStatus.accuracy) && ` Location accuracy: about ${Math.round(locationStatus.accuracy)} m.`}
                </p>
                {locationVerificationEnabled && locationStatus.message && (
                  <p className="mt-1 text-sm text-amber-900" role="alert">{locationStatus.message}</p>
                )}
              </div>
              {locationVerificationEnabled && !locationVerificationLoading && !locationVerificationError && locationStatus.status !== "checking" && (
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setLocationStatus({ status: "checking" });
                    setLocationRetry((value) => value + 1);
                  }}
                  className="min-h-10 shrink-0 rounded-lg border border-[#DDE3F2] bg-white px-3 py-2 text-xs font-semibold text-[#140B63] hover:bg-gray-50"
                >
                  Retry
                </button>
              )}
            </div>
          </section>
        )}

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
                {identifyingSeat && (
                  <p role="status" className="mt-3 text-sm text-gray-600">Verifying scanned seat QR code…</p>
                )}
                {identifiedSeat?.action === "checkout" && (
                  <div className="mt-4 rounded-lg border border-[#DDE3F2] bg-[#F8F9FF] p-3">
                    <p className="text-sm font-semibold text-[#140B63]">
                      This QR code matches your active seat: {identifiedSeat.seat.sectionName} · {identifiedSeat.seat.seatCode}.
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Confirm below when you are leaving this seat.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setConfirmingCheckout(true);
                      }}
                      className="mt-3 rounded-lg bg-[#140B63] px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      Confirm Check Out
                    </button>
                  </div>
                )}
                {identifiedSeat?.action === "active_elsewhere" && (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">
                    Your active session is at {session.section} · {session.seat}. Check out from that seat’s QR code or use My Sessions.
                  </p>
                )}
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
          <div data-tour-anchor="student-qr-checkin" className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {isMobile && (
              <section className="rounded-xl border bg-white p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-[#140B63]" />
                  <h2 className="font-bold text-[#140B63]">Scan Seat QR Code</h2>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  Scan the QR code attached to your desk, or enter the seat ID printed beside it.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Live camera scanning requires HTTPS and browser permission. If it cannot open, use the phone camera option below or scan the label using your phone’s camera app.
                </p>
                <label className="mt-3 inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#5B5FC7] bg-white px-4 py-2 text-sm font-semibold text-[#140B63]">
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  {processingCameraPhoto ? "Reading QR code…" : "Use phone camera"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) => void scanCameraPhoto(event)}
                    disabled={processingCameraPhoto}
                    className="sr-only"
                    aria-label="Take a photo of the seat QR code"
                  />
                </label>
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

            <section data-tour-anchor="student-manual-checkin" className="rounded-xl border bg-white p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-[#140B63]" />
                <h2 className="font-bold text-[#140B63]">Enter Seat ID Manually</h2>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {isMobile
                ? "Enter the ID printed on your seat label if scanning is unavailable."
                : "Enter the ID printed on your seat label."}
              </p>
              <form onSubmit={findSeat} className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700" htmlFor="seat-id">
                  Seat ID
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
                  placeholder="Enter the ID printed on your seat"
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

        {identifyingSeat && !session && (
          <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900" role="status">
            Verifying the seat QR code…
          </p>
        )}

        {identifiedSeat && !session && (
          <section className="rounded-xl border bg-white p-4 sm:p-5" aria-live="polite">
            <h2 className="text-lg font-bold text-[#140B63]">Seat Found</h2>
            <p className="mt-2 text-sm font-semibold text-gray-700">
              {identifiedSeat.seat.sectionName} · {identifiedSeat.seat.seatCode}
            </p>
            <p className="mt-2 text-lg font-semibold text-[#140B63]">{identifiedSeat.qrIdentifier}</p>
            <p className="mt-3 text-sm text-gray-600">
              Confirm only after you have physically occupied the seat displaying this ID. The database will verify that it is available.
            </p>
            {seatCanBeUsed && (
              <div className="mt-4 rounded-lg border border-[#DDE3F2] bg-[#F8F9FF] p-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#140B63]">
                  <input
                    type="checkbox"
                    checked={studyTimerEnabled}
                    onChange={(event) => setStudyTimerEnabled(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 accent-[#140B63]"
                  />
                  Set a study timer (optional)
                </label>
                {studyTimerEnabled ? (
                  <div className="mt-3">
                    <label htmlFor="planned-study-preset" className="block text-sm font-medium text-gray-700">
                      Planned study time
                    </label>
                    <select
                      id="planned-study-preset"
                      value={timerChoice}
                      onChange={(event) => {
                        setTimerChoice(event.target.value);
                        setError("");
                      }}
                      className="mt-1 min-h-10 w-full rounded-lg border border-[#DDE3F2] bg-white px-3 text-sm text-[#140B63] outline-none focus:border-[#5B5FC7] focus:ring-2 focus:ring-[#5B5FC7]/20 sm:max-w-xs"
                    >
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                      <option value="180">3 hours</option>
                      <option value="240">4 hours</option>
                      <option value="custom">Set a custom time</option>
                    </select>
                    {timerChoice === "custom" && (
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                        <label htmlFor="custom-study-duration" className="text-sm font-medium text-gray-700">
                          Custom duration
                          <input
                            id="custom-study-duration"
                            type="number"
                            min="1"
                            max={customDurationUnit === "hours" ? "24" : "1440"}
                            step="1"
                            required
                            value={customDuration}
                            onChange={(event) => {
                              setCustomDuration(event.target.value);
                              setError("");
                            }}
                            aria-invalid={studyDurationIsInvalid}
                            aria-describedby="planned-study-duration-help"
                            className="mt-1 h-10 w-full rounded-lg border px-3 outline-none focus:border-[#5B5FC7] focus:ring-2 focus:ring-[#5B5FC7]/20 sm:w-36"
                          />
                        </label>
                        <label htmlFor="custom-study-duration-unit" className="text-sm font-medium text-gray-700">
                          Unit
                          <select
                            id="custom-study-duration-unit"
                            value={customDurationUnit}
                            onChange={(event) => {
                              setCustomDurationUnit(event.target.value);
                              setError("");
                            }}
                            className="mt-1 min-h-10 w-full rounded-lg border border-[#DDE3F2] bg-white px-3 text-sm text-[#140B63] sm:w-36"
                          >
                            <option value="minutes">Minutes</option>
                            <option value="hours">Hours</option>
                          </select>
                        </label>
                      </div>
                    )}
                    <p id="planned-study-duration-help" className="mt-1 text-xs text-gray-600">
                      Choose 1–4 hours or set a custom time (up to 24 hours). You’ll get a reminder 5 minutes before the time ends.
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 pl-6 text-xs text-gray-600">Skip this to study without a planned end time.</p>
                )}
              </div>
            )}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  if (studyDurationIsInvalid) {
                    setError("Choose a valid study duration up to 24 hours, or skip the timer.");
                    return;
                  }
                  setError("");
                  setConfirmingCheckIn(true);
                }}
                disabled={!locationIsVerified}
                className="rounded-lg bg-[#140B63] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#251b79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirm Check In
              </button>
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
        { label: "Seat ID", value: identifiedSeat.qrIdentifier },
            {
              label: "Study timer",
              value: studyTimerEnabled ? plannedDurationLabel : "Not set",
            },
          ]}
          confirmLabel={savingCheckIn ? "Saving…" : "Confirm Check-In"}
          busy={savingCheckIn}
          onConfirm={confirmCheckIn}
          onCancel={() => {
            if (!savingCheckIn) setConfirmingCheckIn(false);
          }}
        />
      )}
      {confirmingCheckout && session && identifiedSeat?.action === "checkout" && (
        <ConfirmationDialog
          title="Confirm Check-Out"
          message="Are you leaving this seat now? The seat will become available to other students."
          details={[
            { label: "Section", value: identifiedSeat.seat.sectionName },
            { label: "Seat", value: identifiedSeat.seat.seatCode },
            { label: "Unique QR ID", value: identifiedSeat.qrIdentifier },
          ]}
          confirmLabel={savingCheckout ? "Saving…" : "Confirm Check-Out"}
          busy={savingCheckout}
          onConfirm={confirmCheckOut}
          onCancel={() => {
            if (!savingCheckout) setConfirmingCheckout(false);
          }}
        />
      )}
    </div>
  );
}
