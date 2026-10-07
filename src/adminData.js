import { getLibraryAvailability, getSectionAvailability } from "./sections";

export const PROLONGED_SESSION_REVIEW_MS = 4 * 60 * 60 * 1000;

export function getAdminOverview(sections, activeSession, now = Date.now()) {
  const sectionOverview = sections.map((section) => ({
    ...section,
    ...getSectionAvailability(section),
  }));
  const availability = getLibraryAvailability(sections);
  const activeSessions = activeSession?.sessionStatus === "active"
    ? [{
      ...activeSession,
      studyDurationMs: Math.max(0, now - new Date(activeSession.checkInTime).getTime()),
    }]
    : [];
  const needsAttention = activeSessions.filter(
    (item) => item.studyDurationMs >= PROLONGED_SESSION_REVIEW_MS,
  );

  return {
    sections: sectionOverview,
    seats: sections.flatMap((section) => (
      section.seats.map((seat) => ({ ...seat, sectionId: section.id, sectionName: section.name }))
    )),
    activeSessions,
    needsAttention,
    summary: {
      ...availability,
      openSections: sectionOverview.filter((section) => section.status === "Open").length,
      closedSections: sectionOverview.filter((section) => section.status === "Closed").length,
      activeSessions: activeSessions.length,
      needsAttention: needsAttention.length,
    },
  };
}

export function formatAdminDuration(durationMs) {
  const totalMinutes = Math.floor(durationMs / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatAdminTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}
