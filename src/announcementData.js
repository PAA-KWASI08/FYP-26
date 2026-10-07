export const initialAnnouncements = [
  {
    id: "announcement-study-rooms",
    title: "Group study rooms are offline",
    message: "Group study rooms are offline for maintenance. Please use the available study sections.",
    type: "Maintenance",
    audience: "All Students",
    sectionId: null,
    status: "Published",
    createdAt: "2026-10-07T09:00:00.000Z",
    expiryDate: null,
  },
  {
    id: "announcement-quiet-study",
    title: "Silent study area rules are active",
    message: "Please observe the quiet-study rules in designated areas so all students can study comfortably.",
    type: "General",
    audience: "All Students",
    sectionId: null,
    status: "Published",
    createdAt: "2026-10-06T09:00:00.000Z",
    expiryDate: null,
  },
  {
    id: "announcement-exam-hours",
    title: "Extended exam study hours",
    message: "Exam study hours are active until 10:00 PM.",
    type: "Important",
    audience: "All Students",
    sectionId: null,
    status: "Published",
    createdAt: "2026-10-05T09:00:00.000Z",
    expiryDate: null,
  },
];

export function getActiveAnnouncements(announcements, sectionId = null, now = new Date()) {
  return announcements
    .filter((announcement) => {
      if (announcement.status !== "Published") return false;
      if (announcement.expiryDate) {
        const [year, month, day] = announcement.expiryDate.split("-").map(Number);
        const expiry = new Date(year, month - 1, day, 23, 59, 59, 999);
        if (expiry < now) return false;
      }
      return announcement.audience === "All Students"
        || (announcement.audience === "Specific Section"
          && sectionId
          && announcement.sectionId === sectionId);
    })
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

export function isAnnouncementExpired(announcement, now = new Date()) {
  if (!announcement.expiryDate) return false;
  const [year, month, day] = announcement.expiryDate.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999) < now;
}

export function formatAnnouncementDate(value) {
  if (!value) return "No expiry";
  const date = value.includes("T")
    ? new Date(value)
    : new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
