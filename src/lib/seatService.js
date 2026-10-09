import { supabase } from "./supabase";

const selectSeatFields = "id, section_id, seat_code, status, unavailable_reason, is_active, deleted_at";

export function getSeatCountsForSection(
  seats,
  sectionId,
  sectionStatus = "open",
  { includeInactiveInTotal = false } = {},
) {
  if (!Array.isArray(seats)) return null;

  return seats.reduce((counts, seat) => {
    if (seat.section_id !== sectionId || seat.deleted_at) return counts;
    if (seat.is_active === false) {
      if (includeInactiveInTotal) counts.total += 1;
      return counts;
    }
    counts.total += 1;
    if (sectionStatus?.toLocaleLowerCase() === "closed") counts.unavailable += 1;
    else if (seat.status === "available") counts.available += 1;
    else if (seat.status === "occupied") counts.occupied += 1;
    else if (seat.status === "unavailable") counts.unavailable += 1;
    return counts;
  }, { total: 0, available: 0, occupied: 0, unavailable: 0 });
}

function normalizeSeatStatus(status) {
  return status?.toLocaleLowerCase();
}

function validateSeatValues({ seatCode, qrIdentifier, status, unavailableReason }) {
  if (!seatCode?.trim()) return new Error("Enter a seat code.");
  if (qrIdentifier !== undefined && !qrIdentifier?.trim()) return new Error("Enter a QR identifier.");
  if (!["Available", "Unavailable"].includes(status)) {
    return new Error("Seat occupancy is controlled by student check-in and check-out.");
  }
  if (status === "Unavailable" && !unavailableReason?.trim()) {
    return new Error("Provide a reason for an unavailable seat.");
  }
  return null;
}

export async function getSeats(sectionId) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };

  let query = supabase
    .from("seats")
    .select(selectSeatFields)
    .order("seat_code", { ascending: true });
  if (sectionId) query = query.eq("section_id", sectionId);

  const { data, error } = await query;
  return { data, error };
}

export async function getSeatCounts() {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };

  const { data, error } = await supabase
    .from("seats")
    .select("section_id, status, is_active, deleted_at");
  return { data, error };
}

export async function getSeatSessions(seatIds) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  if (!seatIds.length) return { data: [], error: null };

  const { data, error } = await supabase
    .from("seat_sessions")
    .select("id, seat_id, status, check_in_time, check_out_time")
    .in("seat_id", seatIds);
  return { data, error };
}

export async function getStudentSeatSessions(userId) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };

  const { data, error } = await supabase
    .from("seat_sessions")
    .select("id, user_id, seat_id, check_in_time, check_out_time, planned_duration_minutes, status, location_status, location_verified_at, outside_since, seats!inner(seat_code, section_id, sections!inner(name))")
    .eq("user_id", userId)
    .order("check_in_time", { ascending: false });
  return { data, error };
}

export async function getAdminSeatSessions() {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  return supabase.rpc("admin_list_seat_sessions");
}

export async function getLocationVerificationEnabled() {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  return supabase.rpc("location_verification_is_enabled");
}

export async function reportGeofencePosition(sessionId, location) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };

  const { data, error } = await supabase.rpc("student_report_geofence_position", {
    p_session_id: sessionId,
    p_latitude: location?.latitude ?? null,
    p_longitude: location?.longitude ?? null,
    p_accuracy_meters: location?.accuracy ?? null,
    p_location_captured_at: location?.timestamp
      ? new Date(location.timestamp).toISOString()
      : null,
  });
  return { data, error };
}

export async function getAdminGeofenceAlerts() {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  return supabase.rpc("admin_list_geofence_alerts");
}

export async function releaseAdminGeofenceSession(sessionId) {
  if (!supabase) return { error: new Error("Supabase is not configured.") };
  return supabase.rpc("admin_release_outside_geofence_session", {
    p_session_id: sessionId,
  });
}

export async function createSeat({ sectionId, seatCode, status, unavailableReason }) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  const validationError = validateSeatValues({ seatCode, status, unavailableReason });
  if (validationError) return { data: null, error: validationError };

  const { data, error } = await supabase.rpc("admin_create_seat", {
    p_section_id: sectionId,
    p_seat_code: seatCode.trim(),
    p_status: normalizeSeatStatus(status),
    p_unavailable_reason: status === "Unavailable" ? unavailableReason.trim() : null,
  }).maybeSingle();
  return { data, error };
}

export async function updateSeat(seatCode, updates) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  const validationError = validateSeatValues(updates);
  if (validationError) return { data: null, error: validationError };

  const { data, error } = await supabase.rpc("admin_manage_seats", {
    p_action: "update",
    p_previous_seat_code: seatCode,
    p_seat_code: updates.seatCode.trim(),
    p_qr_identifier: updates.qrIdentifier.trim(),
    p_status: normalizeSeatStatus(updates.status),
    p_unavailable_reason: updates.status === "Unavailable" ? updates.unavailableReason.trim() : null,
  }).maybeSingle();
  return { data, error };
}

export async function updateSeatLifecycle(seatCode, action) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  if (!["deactivate", "activate", "delete"].includes(action)) {
    return { data: null, error: new Error("Choose a valid seat action.") };
  }

  const { data, error } = await supabase.rpc("admin_manage_seats", {
    p_action: action,
    p_previous_seat_code: seatCode,
  }).maybeSingle();
  return { data, error };
}

export async function getAdminSeatQrLabels(sectionId) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  return supabase.rpc("admin_list_seat_qr_labels", {
    p_section_id: sectionId ?? null,
  });
}

export function getSeatQrLabelErrorMessage(error) {
  if (
    error?.code === "PGRST202"
    || error?.message?.includes("admin_list_seat_qr_labels")
  ) {
    return "Seat QR printing is not available in the connected database yet. Apply the pending Supabase migrations and try again.";
  }
  return `Seat QR codes could not be loaded. ${error?.message ?? "Refresh and try again."}`;
}

export async function regenerateSeatQr(seatId) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  return supabase.rpc("admin_regenerate_seat_qr", {
    p_seat_id: seatId,
  }).maybeSingle();
}

export async function findSeatByQrIdentifier(qrIdentifier) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  return supabase.rpc("student_find_seat_by_qr", {
    p_qr_identifier: qrIdentifier.trim().toUpperCase(),
  });
}
