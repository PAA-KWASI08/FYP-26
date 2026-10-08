import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import { mockStudent } from "./studentData";
import { StudentSessionContext } from "./studentSession";
import { getSections } from "./lib/sectionService";
import {
  findSeatByQrIdentifier,
  getAdminSeatSessions,
  getLocationVerificationEnabled,
  getSeats,
  getStudentSeatSessions,
  reportGeofencePosition,
} from "./lib/seatService";
import { supabase } from "./lib/supabase";
import { getPublishedAnnouncements } from "./lib/announcementService";
import {
  LOCATION_MAX_AGE_MS,
  classifyBalmeGeofencePosition,
} from "./lib/geofence";

function mapDatabaseSession(record, studentId) {
  const seat = Array.isArray(record.seats) ? record.seats[0] : record.seats;
  const section = Array.isArray(seat?.sections) ? seat.sections[0] : seat?.sections;
  const seatCode = record.seat_code ?? seat?.seat_code;
  const sectionId = record.section_id ?? seat?.section_id;
  const sectionName = record.section_name ?? section?.name;
  if (!record.seat_id || !seatCode || !sectionId || !sectionName) return null;
  return {
    id: record.id,
    userId: record.user_id ?? studentId,
    studentId: record.student_id ?? studentId,
    studentName: record.student_name ?? null,
    sectionId,
    section: sectionName,
    seat: seatCode,
    seatId: record.seat_id,
    checkInTime: new Date(record.check_in_time),
    checkOutTime: record.check_out_time ? new Date(record.check_out_time) : null,
    plannedDurationMinutes: record.planned_duration_minutes ?? null,
    sessionStatus: record.status,
    locationStatus: record.location_status === "within_library"
      ? "Within Library"
      : record.location_status === "outside_library"
        ? "Outside Library"
        : "Location Not Verified",
    locationStatusIsMock: false,
    locationUpdatedAt: record.location_verified_at ? new Date(record.location_verified_at) : null,
    outsideSince: record.outside_since ? new Date(record.outside_since) : null,
    promptSentAt: null,
  };
}

export function StudentSessionProvider({ children }) {
  const { session: authSession, profile: authProfile } = useAuth();
  const isDatabaseStudent = Boolean(
    authSession && !authSession.isPrototype && authProfile?.role === "student",
  );
  const isDatabaseAdmin = Boolean(
    authSession && !authSession.isPrototype && authProfile?.role === "admin",
  );
  const isDatabaseUser = isDatabaseStudent || isDatabaseAdmin;
  const authUserId = authProfile?.id;
  const authStudentId = authProfile?.student_id;
  const [sections, setSections] = useState([]);
  const [session, setSession] = useState(null);
  const [studentSessionsLoading, setStudentSessionsLoading] = useState(true);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [checkInConfirmation, setCheckInConfirmation] = useState(null);
  const [checkoutConfirmation, setCheckoutConfirmation] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState("");
  const [catalogSyncError, setCatalogSyncError] = useState("");
  const [sessionSyncError, setSessionSyncError] = useState("");
  const [databaseSeats, setDatabaseSeats] = useState(null);
  const [adminSessions, setAdminSessions] = useState([]);
  const [adminSessionsError, setAdminSessionsError] = useState("");
  const [adminSessionsLoading, setAdminSessionsLoading] = useState(true);
  const [locationVerificationEnabled, setLocationVerificationEnabled] = useState(true);
  const [locationVerificationLoading, setLocationVerificationLoading] = useState(true);
  const [locationVerificationError, setLocationVerificationError] = useState("");
  const lastGeofenceReportAt = useRef(0);
  const notifiedStudyStages = useRef(new Set());

  const syncSectionRecord = useCallback((record) => {
    const section = {
      id: record.id,
      name: record.name,
      prefix: record.name
        .split(/[\s'-]+/)
        .filter(Boolean)
        .map((word) => word[0])
        .join("")
        .toLocaleUpperCase(),
      status: record.status?.toLocaleLowerCase() === "open" ? "Open" : "Closed",
      description: record.description ?? "",
      seats: [],
    };
    setSections((currentSections) => {
      const existing = currentSections.find((item) => item.id === section.id);
      return existing
        ? currentSections.map((item) => item.id === section.id
          ? { ...section, prefix: existing.prefix, seats: existing.seats }
          : item)
        : [...currentSections, section];
    });
  }, []);

  const syncSeatRecord = useCallback((record, previousSeatCode = null) => {
    setDatabaseSeats((currentSeats) => {
      if (currentSeats === null) return currentSeats;
      const existing = currentSeats.find((seat) => (
        seat.id === record.id || seat.seat_code === previousSeatCode || seat.seat_code === record.seat_code
      ));
      return existing
        ? currentSeats.map((seat) => seat === existing ? record : seat)
        : [...currentSeats, record];
    });
    setSections((currentSections) => currentSections.map((section) => {
      if (section.id !== record.section_id) return section;

      const existingSeat = section.seats.find((seat) => (
        seat.id === record.id || seat.seatCode === previousSeatCode || seat.seatCode === record.seat_code
      ));
      const seat = {
        id: record.id,
        seatCode: record.seat_code,
        qrIdentifier: record.qr_identifier,
        status: record.status?.toLocaleLowerCase() === "occupied"
          ? "Occupied"
          : record.status?.toLocaleLowerCase() === "unavailable"
            ? "Unavailable"
            : "Available",
        unavailableReason: record.unavailable_reason ?? null,
      };

      return {
        ...section,
        seats: existingSeat
          ? section.seats.map((item) => item === existingSeat ? seat : item)
          : [...section.seats, seat],
      };
    }));
  }, []);

  const refreshSeatCatalog = useCallback(async () => {
    const { data, error } = await getSeats();
    if (error) {
      console.error("Unable to refresh the database seat catalog:", error.message);
      setCatalogSyncError(`Database seat inventory could not be refreshed. ${error.message}`);
      return { ok: false, error };
    }

    const records = data ?? [];
    setDatabaseSeats(records);
    setSections((currentSections) => currentSections.map((section) => ({
      ...section,
      seats: records
        .filter((record) => record.section_id === section.id)
        .map((record) => ({
          id: record.id,
          seatCode: record.seat_code,
          qrIdentifier: record.qr_identifier,
          status: record.status?.toLocaleLowerCase() === "occupied"
            ? "Occupied"
            : record.status?.toLocaleLowerCase() === "unavailable"
              ? "Unavailable"
              : "Available",
          unavailableReason: record.unavailable_reason ?? null,
        })),
    })));
    setCatalogSyncError("");
    return { ok: true };
  }, []);

  const refreshAdminSessions = useCallback(async () => {
    const { data, error } = await getAdminSeatSessions();
    if (error) {
      console.error("Unable to load database seat-session history:", error.message);
      setAdminSessionsError("Recorded student sessions could not be loaded from the database.");
      return { ok: false, error };
    }
    setAdminSessions((data ?? []).map((record) => mapDatabaseSession(record, record.user_id)).filter(Boolean));
    setAdminSessionsError("");
    return { ok: true };
  }, []);

  useEffect(() => {
    if (!isDatabaseUser) {
      const timeout = window.setTimeout(() => {
        setLocationVerificationEnabled(true);
        setLocationVerificationLoading(false);
        setLocationVerificationError("");
      }, 0);
      return () => window.clearTimeout(timeout);
    }

    let cancelled = false;
    const loadLocationVerificationSetting = async () => {
      setLocationVerificationLoading(true);
      try {
        const { data, error } = await getLocationVerificationEnabled();
        if (cancelled) return;
        if (error || typeof data !== "boolean") {
          console.error("Unable to load the database location-verification setting:", error?.message ?? "Invalid response.");
          setLocationVerificationEnabled(true);
          setLocationVerificationError("The location-verification setting could not be loaded. Check-in is blocked until it can be verified.");
          return;
        }
        setLocationVerificationEnabled(data);
        setLocationVerificationError("");
      } catch (error) {
        if (cancelled) return;
        console.error("Unable to request the database location-verification setting:", error);
        setLocationVerificationEnabled(true);
        setLocationVerificationError("The location-verification setting could not be loaded. Check-in is blocked until it can be verified.");
      } finally {
        if (!cancelled) setLocationVerificationLoading(false);
      }
    };

    void loadLocationVerificationSetting();
    return () => {
      cancelled = true;
    };
  }, [isDatabaseUser]);

  const removeSeatRecord = useCallback((sectionId, seatCode) => {
    setDatabaseSeats((currentSeats) => (
      currentSeats === null
        ? currentSeats
        : currentSeats.filter((seat) => seat.seat_code !== seatCode)
    ));
    setSections((currentSections) => currentSections.map((section) => (
      section.id === sectionId
        ? { ...section, seats: section.seats.filter((seat) => seat.seatCode !== seatCode) }
        : section
    )));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadCatalog = async () => {
      try {
        const [sectionResult, seatResult] = await Promise.all([getSections(), getSeats()]);
        if (cancelled) return;
        const errors = [];
        const databaseSections = sectionResult.error ? null : sectionResult.data ?? [];
        if (sectionResult.error) {
          errors.push(`Sections: ${sectionResult.error.message}`);
        }
        if (seatResult.error) {
          errors.push(seatResult.error.code === "42501"
            ? "Seat totals are unavailable because public read access for seats is not configured."
            : `Seat totals are unavailable: ${seatResult.error.message}`);
          if (databaseSections) {
            setSections((currentSections) => {
              const nextSections = [...currentSections];
              databaseSections.forEach((record) => {
                const existingIndex = nextSections.findIndex((section) => section.id === record.id);
                const existing = existingIndex >= 0 ? nextSections[existingIndex] : null;
                const section = {
                  ...existing,
                  id: record.id,
                  name: record.name,
                  prefix: existing?.prefix ?? record.name
                    .split(/[\s'-]+/)
                    .filter(Boolean)
                    .map((word) => word[0])
                    .join("")
                    .toLocaleUpperCase(),
                  status: record.status?.toLocaleLowerCase() === "open" ? "Open" : "Closed",
                  description: record.description ?? "",
                  seats: existing?.seats ?? [],
                };
                if (existingIndex >= 0) nextSections[existingIndex] = section;
                else nextSections.push(section);
              });
              return nextSections;
            });
          }
        } else {
          setDatabaseSeats(seatResult.data ?? []);
          setSections((currentSections) => {
            const sourceSections = databaseSections
              ? databaseSections.map((record) => {
                const existing = currentSections.find((section) => section.id === record.id);
                return {
                  ...existing,
                  id: record.id,
                  name: record.name,
                  prefix: existing?.prefix ?? record.name
                    .split(/[\s'-]+/)
                    .filter(Boolean)
                    .map((word) => word[0])
                    .join("")
                    .toLocaleUpperCase(),
                  status: record.status?.toLocaleLowerCase() === "open" ? "Open" : "Closed",
                  description: record.description ?? "",
                };
              })
              : currentSections;

            return sourceSections.map((section) => ({
              ...section,
              seats: (seatResult.data ?? [])
                .filter((record) => record.section_id === section.id)
                .map((record) => ({
                  id: record.id,
                  seatCode: record.seat_code,
                  qrIdentifier: record.qr_identifier,
                  status: record.status?.toLocaleLowerCase() === "occupied"
                    ? "Occupied"
                    : record.status?.toLocaleLowerCase() === "unavailable"
                      ? "Unavailable"
                      : "Available",
                  unavailableReason: record.unavailable_reason ?? null,
                })),
            }));
          });
        }
        if (sectionResult.error || seatResult.error) {
          setSections([]);
          setDatabaseSeats(null);
        }
        setCatalogSyncError(errors.length ? `Supabase catalog sync unavailable. ${errors.join(" ")}` : "");
      } catch (error) {
        if (!cancelled) {
          setCatalogSyncError(`Supabase catalog sync unavailable: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    };
    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isDatabaseAdmin) {
      const timeout = window.setTimeout(() => {
        setAdminSessions([]);
        setAdminSessionsError("");
        setAdminSessionsLoading(false);
      }, 0);
      return () => window.clearTimeout(timeout);
    }

    let cancelled = false;
    const loadAdminSessions = async () => {
      try {
        if (!cancelled) await refreshAdminSessions();
      } catch (error) {
        if (!cancelled) {
          console.error("Unable to request database seat-session history:", error);
          setAdminSessionsError("Recorded student sessions could not be loaded from the database.");
        }
      } finally {
        if (!cancelled) setAdminSessionsLoading(false);
      }
    };

    void loadAdminSessions();
    const timer = window.setInterval(() => void loadAdminSessions(), 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isDatabaseAdmin, refreshAdminSessions]);

  useEffect(() => {
    if (!isDatabaseStudent || !authUserId) {
      const resetTimeout = window.setTimeout(() => {
        setSession(null);
        setStudentSessionsLoading(false);
        setCompletedSessions([]);
        setSessionSyncError("");
      }, 0);
      return () => window.clearTimeout(resetTimeout);
    }

    let cancelled = false;
    let previouslyActive = session?.sessionStatus === "active";
    const loadStudentSessions = async () => {
      let result;
      try {
        result = await getStudentSeatSessions(authUserId);
      } catch (error) {
        if (cancelled) return;
        setSessionSyncError("Your saved study sessions could not be loaded. Refresh and try again.");
        console.error("Unable to request the signed-in student's sessions:", error);
        setStudentSessionsLoading(false);
        return;
      }
      if (cancelled) return;
      if (result.error) {
        setSessionSyncError("Your saved study sessions could not be loaded. Refresh and try again.");
        console.error("Unable to load the signed-in student's sessions:", result.error.message);
        setStudentSessionsLoading(false);
        return;
      }
      const mapped = (result.data ?? []).map((record) => (
        mapDatabaseSession(record, authStudentId)
      ));
      if (mapped.some((item) => item === null)) {
        setSessionSyncError("Some saved sessions could not be displayed because seat details are missing.");
        setStudentSessionsLoading(false);
        return;
      }
      const validSessions = mapped.filter(Boolean);
      const activeSession = validSessions.find((item) => item.sessionStatus === "active") ?? null;
      if (previouslyActive && !activeSession) {
        try {
          await refreshSeatCatalog();
        } catch (error) {
          console.error("Unable to refresh the database seat catalog after check-out:", error);
        }
      }
      previouslyActive = Boolean(activeSession);
      setSession(activeSession);
      setCompletedSessions(validSessions.filter((item) => item.sessionStatus === "completed"));
      setSessionSyncError("");
      setStudentSessionsLoading(false);
    };
    void loadStudentSessions();
    const refreshTimer = window.setInterval(() => void loadStudentSessions(), 15000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [authStudentId, authUserId, isDatabaseStudent, refreshSeatCatalog, session?.id, session?.sessionStatus]);

  useEffect(() => {
    const duration = session?.plannedDurationMinutes;
    if (session?.sessionStatus !== "active" || !duration) return undefined;

    const checkStudyReminder = () => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const plannedEnd = new Date(session.checkInTime).getTime() + duration * 60_000;
      const remaining = plannedEnd - Date.now();
      const stage = remaining <= 0 ? "end" : remaining <= 5 * 60_000 ? "five-minute" : null;
      if (!stage) return;

      const key = `scan2seat-study-reminder-${session.id}-${stage}`;
      let wasSent = notifiedStudyStages.current.has(key);
      try {
        wasSent ||= window.sessionStorage.getItem(key) === "sent";
      } catch (error) {
        console.warn("Study reminder could not be persisted for this browser session:", error);
      }
      if (wasSent) return;

      const isEndReminder = stage === "end";
      try {
        new Notification(
          isEndReminder ? "Your planned study time has ended" : "Your study time ends soon",
          {
            body: isEndReminder
              ? "Your seat remains checked in. Check out when you are ready to leave."
              : `Your planned study time ends in ${Math.ceil(remaining / 60_000)} minutes.`,
            tag: key,
          },
        );
        notifiedStudyStages.current.add(key);
        try {
          window.sessionStorage.setItem(key, "sent");
        } catch (error) {
          console.warn("Study reminder could not be persisted for this browser session:", error);
        }
      } catch (error) {
        console.error("Unable to display the browser study reminder:", error);
      }
    };

    checkStudyReminder();
    const timer = window.setInterval(checkStudyReminder, 1000);
    return () => window.clearInterval(timer);
  }, [session?.checkInTime, session?.id, session?.plannedDurationMinutes, session?.sessionStatus]);

  const refreshPublishedAnnouncements = useCallback(async () => {
    try {
      const result = await getPublishedAnnouncements();
      if (result.error) {
        setAnnouncementsError("Unable to load published announcements from Supabase.");
        return { ok: false, error: result.error };
      }
      setAnnouncements(result.data ?? []);
      setAnnouncementsError("");
      return { ok: true };
    } catch (error) {
      setAnnouncementsError("Unable to load published announcements from Supabase.");
      return { ok: false, error };
    } finally {
      setAnnouncementsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadAnnouncements = async () => {
      try {
        const result = await getPublishedAnnouncements();
        if (cancelled) return;
        if (result.error) {
          setAnnouncementsError("Unable to load published announcements from Supabase.");
          return;
        }
        setAnnouncements(result.data ?? []);
        setAnnouncementsError("");
      } catch {
        if (!cancelled) {
          setAnnouncementsError("Unable to load published announcements from Supabase.");
        }
      } finally {
        if (!cancelled) setAnnouncementsLoading(false);
      }
    };
    void loadAnnouncements();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (session?.sessionStatus !== "active") return undefined;
    if (locationVerificationLoading || locationVerificationError) return undefined;
    if (!locationVerificationEnabled) {
      const timeout = window.setTimeout(() => {
        setSession((currentSession) => (
          currentSession?.id === session.id
            ? {
              ...currentSession,
              locationStatus: "Location Not Verified",
              locationUpdatedAt: null,
              outsideSince: null,
            }
            : currentSession
        ));
      }, 0);
      return () => window.clearTimeout(timeout);
    }
    if (!navigator.geolocation) {
      const timeout = window.setTimeout(() => {
        setSession((currentSession) => (
          currentSession?.id === session.id
            ? { ...currentSession, locationStatus: "Location Not Verified", outsideSince: null }
            : currentSession
        ));
      }, 0);
      return () => window.clearTimeout(timeout);
    }

    const reportPosition = async (position) => {
      if (!isDatabaseStudent || Date.now() - lastGeofenceReportAt.current < 15000) return;
      lastGeofenceReportAt.current = Date.now();
      const result = await reportGeofencePosition(session.id, position ? {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp || Date.now(),
      } : null);
      if (result.error) {
        console.error("Unable to update the database geofence status:", result.error.message);
        return;
      }
      const serverStatus = result.data?.location_status;
      setSession((currentSession) => {
        if (currentSession?.id !== session.id) return currentSession;
        return {
          ...currentSession,
          locationStatus: serverStatus === "within_library"
            ? "Within Library"
            : serverStatus === "outside_library"
              ? "Outside Library"
              : "Location Not Verified",
          outsideSince: result.data?.outside_since
            ? new Date(result.data.outside_since)
            : null,
        };
      });
    };

    lastGeofenceReportAt.current = 0;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const geofenceStatus = classifyBalmeGeofencePosition(
          position.coords.latitude,
          position.coords.longitude,
          position.coords.accuracy,
        );
        const withinGeofence = geofenceStatus === "inside";
        const observedAt = new Date(position.timestamp || Date.now());
        setSession((currentSession) => {
          if (currentSession?.id !== session.id) return currentSession;
          const outsideSince = withinGeofence
            ? null
            : geofenceStatus === "outside"
              ? currentSession.outsideSince ?? observedAt
              : null;

          return {
            ...currentSession,
            locationStatus: geofenceStatus === "inside"
              ? "Within Library"
              : geofenceStatus === "outside"
                ? "Outside Library"
                : "Location Not Verified",
            locationStatusIsMock: false,
            locationAccuracyMeters: position.coords.accuracy,
            locationUpdatedAt: observedAt,
            outsideSince,
          };
        });
        void reportPosition(position).catch((error) => {
          console.error("Unable to report the student's geofence position:", error);
        });
      },
      () => {
        setSession((currentSession) => (
          currentSession?.id === session.id
            ? {
              ...currentSession,
              locationStatus: "Location Not Verified",
              locationStatusIsMock: false,
              outsideSince: null,
            }
            : currentSession
        ));
        void reportPosition(null).catch((error) => {
          console.error("Unable to report unavailable geolocation:", error);
        });
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [
    isDatabaseStudent,
    locationVerificationEnabled,
    locationVerificationError,
    locationVerificationLoading,
    session?.id,
    session?.sessionStatus,
  ]);

  const checkIn = async (seatCode, location, plannedDurationMinutes = null) => {
    if (session) {
      return { ok: false, message: "You already have an active study session." };
    }
    if (locationVerificationEnabled && (
      !location
      || location.status !== "inside"
      || !Number.isFinite(location.latitude)
      || !Number.isFinite(location.longitude)
      || !Number.isFinite(location.timestamp)
      || Date.now() - location.timestamp > LOCATION_MAX_AGE_MS
      || classifyBalmeGeofencePosition(
        location.latitude,
        location.longitude,
        location.accuracy,
      ) !== "inside"
    )) {
      return {
        ok: false,
        message: "Location must be enabled and verified within the Balme Library geofence before checking in.",
      };
    }
    if (!isDatabaseStudent) {
      return {
        ok: false,
        message: "Check-in requires an authenticated student account connected to the database.",
      };
    }

    const normalizedSeatCode = seatCode.trim().toUpperCase().replace(/\s+/g, "");
    let identifiedSeatCode = normalizedSeatCode;
    if (/^#[0-9]{4}$/.test(normalizedSeatCode)) {
      let lookup;
      try {
        lookup = await findSeatByQrIdentifier(normalizedSeatCode);
      } catch (error) {
        console.error("Seat QR lookup failed:", error);
        return { ok: false, message: "Unable to verify this seat ID. Please try again." };
      }
      if (lookup.error) {
        console.error("Seat QR lookup failed:", lookup.error.message);
        return { ok: false, message: "Unable to verify this seat ID. Please try again." };
      }
      if (!lookup.data?.seat_code) {
        return { ok: false, message: "Seat ID not found. Check the four-digit ID beside the QR code." };
      }
      identifiedSeatCode = lookup.data.seat_code;
    }
    const section = sections.find((item) =>
      item.seats.some((seat) => seat.seatCode === identifiedSeatCode),
    );
    const seat = section?.seats.find((item) => item.seatCode === identifiedSeatCode);

    if (!section || !seat) {
      return { ok: false, message: "Seat not found. Check the seat ID and try again." };
    }

    if (isDatabaseStudent) {
      if (!supabase || !authProfile?.student_id) {
        return { ok: false, message: "Your secure student account could not be verified. Sign in again." };
      }
      let response;
      try {
        response = await supabase.rpc("student_check_in", {
          p_seat_code: normalizedSeatCode,
          p_latitude: location?.latitude ?? null,
          p_longitude: location?.longitude ?? null,
          p_accuracy_meters: location?.accuracy ?? null,
          p_location_captured_at: location?.timestamp
            ? new Date(location.timestamp).toISOString()
            : null,
          p_planned_duration_minutes: plannedDurationMinutes,
        });
      } catch (error) {
        console.error("Database check-in request failed:", error);
        return { ok: false, message: "Unable to reach the database. Your seat was not changed." };
      }
      const { data, error } = response;
      if (error || !data) {
        const message = error?.code === "42501"
          ? "Your student account is not authorized to check in."
          : error?.code === "P0002"
            ? "Seat not found. Check the seat ID and try again."
            : error?.code === "23505"
              ? "You already have an active session or this seat was just taken."
              : error?.code === "23514"
                ? "This section is closed or the seat is no longer available."
                : error?.code === "22023"
                  ? "The seat or your current library location could not be verified."
                  : "Unable to save your check-in. Please try again.";
        if (error) console.error("Database check-in failed:", error.message);
        return { ok: false, message };
      }

      const activeSession = {
        id: data.id,
        userId: authProfile.student_id,
        sectionId: data.section_id,
        section: data.section_name,
        seat: data.seat_code,
        seatId: data.seat_id,
        checkInTime: new Date(data.check_in_time),
        checkOutTime: null,
        plannedDurationMinutes: data.planned_duration_minutes ?? plannedDurationMinutes,
        sessionStatus: "active",
        locationStatus: data.location_status === "within_library"
          ? "Within Library"
          : "Location Not Verified",
        locationStatusIsMock: false,
        locationAccuracyMeters: location?.accuracy ?? null,
        locationUpdatedAt: data.location_verified_at ? new Date(data.location_verified_at) : null,
        outsideSince: null,
        promptSentAt: null,
      };
      setDatabaseSeats((currentSeats) => currentSeats?.map((record) => (
        record.id === data.seat_id ? { ...record, status: "occupied" } : record
      )) ?? currentSeats);
      setSections((currentSections) => currentSections.map((currentSection) => (
        currentSection.id !== data.section_id
          ? currentSection
          : {
            ...currentSection,
            seats: currentSection.seats.map((itemSeat) => (
              itemSeat.id === data.seat_id ? { ...itemSeat, status: "Occupied" } : itemSeat
            )),
          }
      )));
      setSession(activeSession);
      setCheckInConfirmation(activeSession);
      setCheckoutConfirmation(null);
      setSessionSyncError("");
      return { ok: true };
    }

    return { ok: false, message: "Database-backed check-in is unavailable for this account." };
  };

  const checkout = useCallback(async (expectedSessionId, userId) => {
    const sessionStudentId = session?.studentId ?? session?.userId;
    if (
      !session
      || session.sessionStatus !== "active"
      || session.id !== expectedSessionId
      || sessionStudentId !== userId
    ) {
      return { ok: false, message: "Your active session could not be verified. Please review your current session." };
    }

    if (isDatabaseStudent) {
      if (!supabase) return { ok: false, message: "Supabase is not configured. Your session was not changed." };
      let response;
      try {
        response = await supabase.rpc("student_check_out", {
          p_session_id: expectedSessionId,
        });
      } catch (error) {
        console.error("Database check-out request failed:", error);
        return { ok: false, message: "Unable to reach the database. Your session was not changed." };
      }
      const { data, error } = response;
      if (error || !data) {
        const message = error?.code === "42501"
          ? "Your signed-in account is not authorized to check out this session."
          : error?.code === "P0002"
            ? "Your active session could not be found. Refresh the page and try again."
            : "Unable to save your check-out. Please try again.";
        if (error) console.error("Database check-out failed:", error.message);
        return { ok: false, message };
      }

      const completedSession = {
        ...session,
        checkOutTime: new Date(data.check_out_time),
        sessionStatus: "completed",
      };
      setDatabaseSeats((currentSeats) => currentSeats?.map((record) => (
        record.id === data.seat_id && record.status === "occupied"
          ? { ...record, status: "available" }
          : record
      )) ?? currentSeats);
      setSections((currentSections) => currentSections.map((section) => (
        section.id !== data.section_id
          ? section
          : {
            ...section,
            seats: section.seats.map((seat) => (
              seat.id === data.seat_id && seat.status === "Occupied"
                ? { ...seat, status: "Available" }
                : seat
            )),
          }
      )));
      setSession(null);
      setCompletedSessions((currentSessions) => [completedSession, ...currentSessions]);
      setCheckInConfirmation(null);
      setCheckoutConfirmation(completedSession);
      setSessionSyncError("");
      return { ok: true };
    }

    return { ok: false, message: "Database-backed check-out is unavailable for this account." };
  }, [session, isDatabaseStudent]);

  const clearCheckInConfirmation = useCallback(() => {
    setCheckInConfirmation(null);
  }, []);

  const clearCheckoutConfirmation = useCallback(() => {
    setCheckoutConfirmation(null);
  }, []);

  const setSectionStatus = useCallback((sectionId, status) => {
    if (!["Open", "Closed"].includes(status)) {
      return { ok: false, message: "The selected section status is not valid." };
    }
    if (!sections.some((section) => section.id === sectionId)) {
      return { ok: false, message: "The selected section could not be found." };
    }

    setSections((currentSections) => currentSections.map((section) => (
      section.id === sectionId ? { ...section, status } : section
    )));
    return { ok: true };
  }, [sections]);

  const setSeatAvailability = useCallback((sectionId, seatId, status, unavailableReason = null) => {
    if (!["Available", "Unavailable"].includes(status)) {
      return { ok: false, message: "Seats can only be marked Available or Unavailable here." };
    }
    const section = sections.find((item) => item.id === sectionId);
    const seat = section?.seats.find((item) => item.id === seatId);
    if (!section || !seat) {
      return { ok: false, message: "The selected seat could not be found." };
    }
    if (seat.status === "Occupied" || (
      session?.sessionStatus === "active"
      && session.sectionId === sectionId
      && session.seatId === seatId
    )) {
      return { ok: false, message: "Occupied seats must be managed through Active Sessions." };
    }
    if (status === "Unavailable" && !unavailableReason?.trim()) {
      return { ok: false, message: "Provide a reason before marking the seat unavailable." };
    }

    setSections((currentSections) => currentSections.map((currentSection) => (
      currentSection.id !== sectionId
        ? currentSection
        : {
          ...currentSection,
          seats: currentSection.seats.map((currentSeat) => (
            currentSeat.id === seatId
              ? {
                ...currentSeat,
                status,
                unavailableReason: status === "Unavailable" ? unavailableReason.trim() : null,
              }
              : currentSeat
          )),
        }
    )));
    return { ok: true };
  }, [sections, session]);

  const promptStudent = useCallback((sessionId) => {
    if (
      !session
      || session.sessionStatus !== "active"
      || session.id !== sessionId
    ) {
      return { ok: false, message: "The active session could not be verified." };
    }
    setSession((currentSession) => (
      currentSession?.id === sessionId
        ? { ...currentSession, promptSentAt: new Date() }
        : currentSession
    ));
    return { ok: true };
  }, [session]);

  const student = isDatabaseStudent
    ? {
      studentId: authProfile.student_id,
      fullName: authProfile.full_name,
      programme: authProfile.programme,
      department: authProfile.department,
      level: authProfile.level,
      college: authProfile.college,
    }
    : mockStudent;

  return (
    <StudentSessionContext.Provider value={{
      sections,
      databaseSeats,
      catalogSyncError,
      sessionSyncError,
      announcements,
      student,
      currentStudentId: student.studentId,
      session,
      studentSessionsLoading,
      completedSessions,
      adminSessions,
      adminSessionsError,
      adminSessionsLoading,
      locationVerificationEnabled,
      locationVerificationLoading,
      locationVerificationError,
      refreshAdminSessions,
      lastSession: completedSessions[0] ?? null,
      checkInConfirmation,
      checkoutConfirmation,
      announcementsLoading,
      announcementsError,
      checkIn,
      checkout,
      setSectionStatus,
      setSeatAvailability,
      syncSectionRecord,
      syncSeatRecord,
      refreshSeatCatalog,
      removeSeatRecord,
      promptStudent,
      refreshPublishedAnnouncements,
      clearCheckInConfirmation,
      clearCheckoutConfirmation,
    }}>
      {children}
    </StudentSessionContext.Provider>
  );
}
