import { supabase } from "./supabase";

export const issueReportCategories = [
  "Damaged QR code",
  "Unable to check in",
  "Insufficient study space",
  "Cleanliness issue",
  "Noise or disturbance",
  "Furniture or equipment issue",
  "Other",
];

export async function submitStudentIssueReport({ category, seatName, details }) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  return supabase.rpc("student_submit_issue_report", {
    p_category: category,
    p_seat_name: seatName.trim() || null,
    p_details: details.trim(),
  });
}

export async function getAdminStudentIssueReports() {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  return supabase.rpc("admin_list_student_issue_reports");
}
