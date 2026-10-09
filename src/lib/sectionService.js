import { supabase } from "./supabase";

function normalizeSectionStatus(status) {
  return status === "Open" ? "open" : status === "Closed" ? "closed" : status;
}

export function getSectionSeatPrefix(section) {
  if (section?.id?.toLocaleLowerCase() === "iac" || section?.name?.trim().toLocaleUpperCase() === "IAC") {
    return "IAC";
  }
  const words = (section?.name ?? "")
    .split(/[\s'-]+/)
    .filter(Boolean);
  if (words.length > 1) {
    return words.map((word) => word[0]).join("").toLocaleUpperCase();
  }
  return (words[0] ?? "").slice(0, 2).toLocaleUpperCase();
}

export function createSectionId(name) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getSections() {
  if (!supabase) {
    return {
      data: null,
      error: new Error("Supabase is not configured. Check the frontend Supabase environment variables."),
    };
  }

  const { data, error } = await supabase
    .from("sections")
    .select("id, name, status, description, created_at, is_active, deleted_at")
    .order("name", { ascending: true });

  return { data, error };
}

export async function createSection({ name, description, status, initialSeatCount = 0 }) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };

  const id = createSectionId(name);
  if (!id) return { data: null, error: new Error("Enter a section name that can be used to generate an ID.") };

  const { data, error } = await supabase.rpc("admin_create_section_with_seats", {
    p_section_id: id,
    p_name: name.trim(),
    p_description: description.trim() || null,
    p_status: normalizeSectionStatus(status),
    p_initial_seat_count: initialSeatCount,
  });

  return {
    data: data ? { section: data.section, seats: data.seats ?? [] } : null,
    error,
  };
}

export async function updateSection(sectionId, updates) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };

  const values = {};
  if (updates.name !== undefined) values.name = updates.name.trim();
  if (updates.description !== undefined) values.description = updates.description.trim() || null;
  if (updates.status !== undefined) values.status = normalizeSectionStatus(updates.status);

  const { data, error } = await supabase.rpc("admin_manage_sections", {
    p_action: "update",
    p_section_id: sectionId,
    p_name: values.name,
    p_description: values.description,
    p_status: values.status,
  }).maybeSingle();

  return { data, error };
}

export async function updateSectionLifecycle(sectionId, action) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  if (!["deactivate", "activate", "delete"].includes(action)) {
    return { data: null, error: new Error("Choose a valid section action.") };
  }

  const { data, error } = await supabase.rpc("admin_manage_sections", {
    p_action: action,
    p_section_id: sectionId,
  }).maybeSingle();
  return { data, error };
}
