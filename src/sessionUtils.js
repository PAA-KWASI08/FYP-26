export function formatSessionTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getSessionDurationMinutes(session) {
  if (!session.checkInTime || !session.checkOutTime) return 0;
  return Math.max(
    0,
    Math.floor((new Date(session.checkOutTime) - new Date(session.checkInTime)) / 60000),
  );
}

export function formatSessionDuration(start, end) {
  const minutes = Math.max(0, Math.floor((new Date(end) - new Date(start)) / 60000));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

export function formatSessionDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}
