import { supabase } from "./supabase";

const announcementFields = "id, title, message, type, audience, section_id, status, expires_at, created_at";
const announcementTypes = {
  general: "General",
  important: "Important",
  section_update: "Section Update",
  maintenance: "Maintenance",
  system_notice: "System Notice",
  examination_academic_activity: "Examination or Academic Activity",
};

export function toAnnouncementViewModel(record) {
  return {
    id: record.id,
    title: record.title,
    message: record.message,
    type: announcementTypes[record.type] ?? record.type,
    audience: record.audience === "specific_section" ? "Specific Section" : "All Students",
    sectionId: record.section_id,
    status: record.status === "published" ? "Published" : "Draft",
    createdAt: record.created_at,
    expiryDate: record.expires_at,
  };
}

export async function getPublishedAnnouncements() {
  if (!supabase) {
    return { data: null, error: new Error("Supabase is not configured.") };
  }

  const { data, error } = await supabase
    .from("announcements")
    .select(announcementFields)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return {
    data: data?.map(toAnnouncementViewModel) ?? null,
    error,
  };
}

export async function getAdminAnnouncements() {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };

  const { data, error } = await supabase.rpc("admin_manage_announcements", {
    p_action: "list",
  });
  return { data: data?.map(toAnnouncementViewModel) ?? null, error };
}

function toDatabasePayload(announcement) {
  return {
    title: announcement.title,
    message: announcement.message,
    type: announcement.type,
    audience: announcement.audience,
    sectionId: announcement.sectionId,
    status: announcement.status,
    expiryDate: announcement.expiryDate,
  };
}

export async function saveAnnouncement(announcementId, announcement) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };

  const { data, error } = await supabase.rpc("admin_manage_announcements", {
    p_action: announcementId ? "update" : "create",
    p_announcement_id: announcementId || null,
    p_payload: toDatabasePayload(announcement),
  }).maybeSingle();
  return { data: data ? toAnnouncementViewModel(data) : null, error };
}

export async function deleteAnnouncement(announcementId) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };

  const { error } = await supabase.rpc("admin_manage_announcements", {
    p_action: "delete",
    p_announcement_id: announcementId,
  });
  return { data: null, error };
}
