import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { AuthContext } from "./authContext";

const profileFields = "id, student_id, full_name, programme, department, level, college, role, account_status";
const pendingProfileRequests = new Map();

async function queryProfile(user, accessToken) {
  if (!accessToken) return { profile: null, error: "profile-query" };

  try {
    const { data, error } = await supabase
      .from("users")
      .select(profileFields)
      .eq("id", user.id)
      .maybeSingle()
      .setHeader("Authorization", `Bearer ${accessToken}`);

    if (error) {
      console.error("Supabase profile query failed:", {
        error,
        userId: user.id,
        data,
      });
      return { profile: null, error: "profile-query" };
    }
    if (!data) return { profile: null, error: "profile-missing" };

    return {
      profile: {
        ...data,
        email: user.email ?? "",
      },
      error: null,
    };
  } catch {
    return { profile: null, error: "profile-query" };
  }
}

function fetchProfile(user, accessToken) {
  if (!accessToken) return queryProfile(user, accessToken);

  const requestKey = `${user.id}:${accessToken}`;
  const pendingRequest = pendingProfileRequests.get(requestKey);
  if (pendingRequest) return pendingRequest;

  const request = queryProfile(user, accessToken).finally(() => {
    pendingProfileRequests.delete(requestKey);
  });
  pendingProfileRequests.set(requestKey, request);
  return request;
}

async function clearSupabaseSession() {
  try {
    const { error } = await supabase.auth.signOut();
    return !error;
  } catch {
    return false;
  }
}

function profileAccessError(profile) {
  if (profile.account_status !== "active") return "inactive";
  if (profile.role !== "student" && profile.role !== "admin") return "invalid-role";
  return null;
}

function accessErrorMessage(error) {
  if (error === "inactive") return "Your account is inactive.";
  if (error === "profile-missing") return "Your account profile could not be found.";
  if (error === "permission" || error === "invalid-role") {
    return "You do not have permission to access this area.";
  }
  return "Your account profile could not be found.";
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const requestSequence = useRef(0);

  const clearAuthState = useCallback(() => {
    requestSequence.current += 1;
    setSession(null);
    setProfile(null);
    setLoading(false);
  }, []);

  const resolveSession = useCallback(async (nextSession) => {
    const requestId = ++requestSequence.current;
    setSession(nextSession);

    if (!nextSession?.user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const result = await fetchProfile(nextSession.user, nextSession.access_token);
    if (requestId !== requestSequence.current) return;

    const invalidProfile = result.error ?? profileAccessError(result.profile);
    if (invalidProfile) {
      clearAuthState();
      await clearSupabaseSession();
      return;
    }

    setProfile(result.profile);
    setLoading(false);
  }, [clearAuthState]);

  useEffect(() => {
    if (!supabase) return undefined;

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      queueMicrotask(() => {
        if (active) void resolveSession(nextSession);
      });
    });

    return () => {
      active = false;
      requestSequence.current += 1;
      subscription.unsubscribe();
    };
  }, [clearAuthState, resolveSession]);

  const signIn = useCallback(async (email, password, expectedRole) => {
    if (!supabase || !isSupabaseConfigured) {
      return { ok: false, message: "Authentication is not configured. Contact the project operator." };
    }

    let data;
    let error;
    try {
      ({ data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      }));
    } catch {
      return { ok: false, message: "Unable to sign in right now. Please try again." };
    }
    if (error || !data.session) {
      return { ok: false, message: "Invalid email or password." };
    }

    const result = await fetchProfile(data.session.user, data.session.access_token);
    if (result.error) {
      await clearSupabaseSession();
      clearAuthState();
      return { ok: false, message: accessErrorMessage(result.error) };
    }

    const accessError = profileAccessError(result.profile);
    if (accessError) {
      await clearSupabaseSession();
      clearAuthState();
      return { ok: false, message: accessErrorMessage(accessError) };
    }

    if (result.profile.role !== expectedRole) {
      await clearSupabaseSession();
      clearAuthState();
      return { ok: false, message: accessErrorMessage("permission") };
    }

    requestSequence.current += 1;
    setSession(data.session);
    setProfile(result.profile);
    setLoading(false);
    return { ok: true, profile: result.profile };
  }, [clearAuthState]);

  const signOut = useCallback(async () => {
    const ok = supabase ? await clearSupabaseSession() : true;
    clearAuthState();
    return { ok };
  }, [clearAuthState]);

  const value = useMemo(() => ({
    session,
    profile,
    loading,
    signIn,
    signOut,
  }), [session, profile, loading, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
