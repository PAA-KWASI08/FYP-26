import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, MapPin } from "lucide-react";
import { getAdminGeofenceAlerts, releaseAdminGeofenceSession } from "./lib/seatService";
import { formatAdminTime } from "./adminData";

function formatReleaseCountdown(milliseconds) {
  if (milliseconds <= 0) return "automatic release is due";
  const minutes = Math.ceil(milliseconds / 60000);
  return `automatic release in ${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export default function AdminGeofenceAlerts({ onReleased }) {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [releasingId, setReleasingId] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const refreshAlerts = useCallback(async () => {
    try {
      const { data, error: requestError } = await getAdminGeofenceAlerts();
      if (requestError) {
        console.error("Unable to load Balme geofence alerts:", requestError.message);
        setError("Geofence alerts could not be loaded. Refresh the page or try again.");
        setLoading(false);
        setHasLoaded(true);
        return;
      }
      setAlerts(data ?? []);
      setError("");
      setLoading(false);
      setHasLoaded(true);
    } catch (requestError) {
      console.error("Unable to request Balme geofence alerts:", requestError);
      setError("Geofence alerts could not be loaded. Check your connection and try again.");
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refreshAlerts(), 0);
    const refreshTimer = window.setInterval(() => void refreshAlerts(), 15000);
    const clockTimer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(refreshTimer);
      window.clearInterval(clockTimer);
    };
  }, [refreshAlerts]);

  const releaseSeat = async (alert) => {
    setReleasingId(alert.session_id);
    setError("");
    try {
      const { error: releaseError } = await releaseAdminGeofenceSession(alert.session_id);
      if (releaseError) {
        console.error("Unable to release outside-geofence seat:", releaseError.message);
        setError("The seat could not be released. It may already have been released automatically.");
        await refreshAlerts();
        return;
      }
      await refreshAlerts();
      await onReleased?.();
    } catch (releaseError) {
      console.error("Unable to release outside-geofence seat:", releaseError);
      setError("The seat could not be released. Please try again.");
    } finally {
      setReleasingId(null);
    }
  };

  if (hasLoaded && !loading && !error && alerts.length === 0) return null;

  return (
    <section aria-labelledby="geofence-alerts-heading" className="rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 id="geofence-alerts-heading" className="text-base font-bold text-amber-950">
            Balme Library location alerts
          </h2>
          <p className="mt-1 text-sm text-amber-900">
            After 10 continuous minutes outside the 30 m geofence, admins have 5 minutes to release the seat. Otherwise it is released automatically.
          </p>
          {loading && <p className="mt-3 text-sm text-amber-900">Checking for location alerts…</p>}
          {error && <p role="alert" className="mt-3 text-sm font-medium text-rose-800">{error}</p>}
          {!loading && alerts.length > 0 && (
            <ul className="mt-3 space-y-2">
              {alerts.map((alert) => {
                const remaining = Math.max(0, new Date(alert.auto_release_at).getTime() - now);
                return (
                  <li key={alert.session_id} className="flex flex-col justify-between gap-3 rounded-lg border border-amber-200 bg-white p-3 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#140B63]">
                        {alert.student_name} · {alert.student_id} — {alert.section_name}, seat {alert.seat_code}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-1 text-xs text-gray-600">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        Outside since {formatAdminTime(alert.outside_since)} · {formatReleaseCountdown(remaining)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void releaseSeat(alert)}
                      disabled={releasingId === alert.session_id}
                      className="min-h-10 shrink-0 rounded-lg bg-[#140B63] px-3 py-2 text-sm font-semibold text-white hover:bg-[#27216F] disabled:cursor-wait disabled:opacity-60"
                    >
                      {releasingId === alert.session_id ? "Releasing…" : "Release seat now"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {!loading && !error && alerts.length === 0 && (
            <p className="mt-3 flex items-center gap-2 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              No seats currently need a geofence review.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
