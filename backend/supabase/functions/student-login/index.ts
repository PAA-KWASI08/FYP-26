import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    console.error("Student login function is missing required Supabase configuration.");
    return response({ error: "Student login is temporarily unavailable." }, 500);
  }

  let body: { username?: unknown; password?: unknown; role?: unknown };
  try {
    body = await request.json();
  } catch {
    return response({ error: "Enter a valid username and password." }, 400);
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const role = body.role === "admin" || body.role === "student" ? body.role : null;
  const password = typeof body.password === "string" ? body.password : "";
  const validUsername = role === "student"
    ? /^\d{8}$/.test(username)
    : role === "admin" && username === "admin001";
  if (!validUsername || !password) {
    return response({ error: "Enter a valid username and password." }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: profile, error: profileError } = await adminClient
    .from("users")
    .select("id")
    .eq("student_id", username)
    .eq("role", role)
    .eq("account_status", "active")
    .maybeSingle();

  if (profileError) {
    console.error("Student login profile lookup failed:", profileError.message);
    return response({ error: "Student login is temporarily unavailable." }, 500);
  }
  if (!profile) return response({ error: "Invalid Student ID or password." }, 401);

  const { data: authUser, error: authUserError } = await adminClient.auth.admin.getUserById(profile.id);
  if (authUserError || !authUser.user?.email) {
    console.error("Student login Auth account lookup failed:", authUserError?.message ?? "Email missing.");
    return response({ error: "Student login is temporarily unavailable." }, 500);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await authClient.auth.signInWithPassword({
    email: authUser.user.email,
    password,
  });
  if (error || !data.session) {
    return response({ error: "Invalid Student ID or password." }, 401);
  }

  return response({
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    },
  });
});
