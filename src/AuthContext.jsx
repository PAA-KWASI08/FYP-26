import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./authContext";
import {
  clearPrototypeSession,
  createPrototypeSession,
  getStoredPrototypeAuthState,
  isValidPrototypeIdentity,
  storePrototypeSession,
} from "./lib/demoAuth";
import { prototypePin } from "./lib/prototypeCredentials";
import { supabase } from "./lib/supabase";
import { databaseStudentIds } from "./lib/databaseStudentIds";

const databaseStudentIdSet = new Set(databaseStudentIds);
const databaseAdminIds = new Set(["admin001"]);

function isDatabaseAccount(profile) {
  return (profile?.role === "student" && databaseStudentIdSet.has(profile.student_id))
    || (profile?.role === "admin" && databaseAdminIds.has(profile.student_id));
}

async function getStudentProfile(userId) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured.") };
  const { data, error } = await supabase
    .from("users")
    .select("id, student_id, full_name, programme, department, level, college, role, account_status, must_change_password")
    .eq("id", userId)
    .single();
  if (error) return { data: null, error };
  return {
    data: {
      ...data,
      studentId: data.student_id,
      fullName: data.full_name,
    },
    error: null,
  };
}

export function AuthProvider({ children }) {
  const [initialAuth] = useState(() => {
    const stored = getStoredPrototypeAuthState();
    return stored?.profile?.role === "admin" || isDatabaseAccount(stored?.profile) ? null : stored;
  });
  const [session, setSession] = useState(initialAuth?.session ?? null);
  const [profile, setProfile] = useState(initialAuth?.profile ?? null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    let active = true;
    const stored = getStoredPrototypeAuthState();
    if (stored?.profile?.role === "admin" || isDatabaseAccount(stored?.profile)) {
      const cleared = clearPrototypeSession();
      if (!cleared.ok) console.error(cleared.error);
    }

    if (!supabase) {
      return () => {
        active = false;
      };
    }

    const loadSupabaseSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) {
        console.error("Unable to restore Supabase authentication:", error.message);
        setLoading(false);
        return;
      }
      if (data.session) {
        const result = await getStudentProfile(data.session.user.id);
        if (!active) return;
        if (result.error || !isDatabaseAccount(result.data) || result.data?.account_status !== "active") {
          console.error("Unable to load the signed-in profile:", result.error?.message ?? "Account is inactive or not permitted.");
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
        } else {
          setSession(data.session);
          setProfile(result.data);
        }
      }
      setLoading(false);
    };
    void loadSupabaseSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_OUT" || !nextSession) {
        if (active) {
          setSession(null);
          setProfile(null);
        }
        return;
      }
      if (!active) return;
      setSession(nextSession);
      window.setTimeout(async () => {
        const result = await getStudentProfile(nextSession.user.id);
        if (!active) return;
        if (result.error || !isDatabaseAccount(result.data) || result.data?.account_status !== "active") {
          console.error("Unable to load the signed-in profile:", result.error?.message ?? "Account is inactive or not permitted.");
          setProfile(null);
          return;
        }
        setProfile(result.data);
      }, 0);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (username, password, expectedRole) => {
    if (expectedRole !== "student" && expectedRole !== "admin") {
      return { ok: false, message: "The selected login role is not valid." };
    }
    if (expectedRole === "student" && !/^\d{8}$/.test(username)) {
      return { ok: false, message: "Student ID must contain exactly 8 digits." };
    }
    if (expectedRole === "admin" && username !== "admin001") {
      return { ok: false, message: "Invalid administrator ID." };
    }

    const secureAccount = (expectedRole === "student" && databaseStudentIdSet.has(username))
      || (expectedRole === "admin" && databaseAdminIds.has(username));
    const prototypeAccount = isValidPrototypeIdentity(username, expectedRole);

    if (secureAccount && supabase) {
      try {
        const { data, error } = await supabase.functions.invoke("student-login", {
          body: { username, password, role: expectedRole },
        });
        if (error || !data?.session) {
          if (!prototypeAccount) {
            return { ok: false, message: data?.error ?? "Invalid ID or password." };
          }
        } else {
          const { data: authData, error: authError } = await supabase.auth.setSession(data.session);
          if (authError || !authData.session) {
            if (!prototypeAccount) {
              return { ok: false, message: "Unable to establish a secure session. Please try again." };
            }
          } else {
            const profileResult = await getStudentProfile(authData.session.user.id);
            if (profileResult.error || !isDatabaseAccount(profileResult.data)
              || profileResult.data.role !== expectedRole
              || profileResult.data.account_status !== "active") {
              if (!prototypeAccount) {
                await supabase.auth.signOut();
                return { ok: false, message: "This account is not active for library access." };
              }
            } else {
              setSession(authData.session);
              setProfile(profileResult.data);
              return { ok: true, profile: profileResult.data };
            }
          }
        }
      } catch (error) {
        console.error("Secure sign-in failed:", error);
        if (!prototypeAccount) {
          return { ok: false, message: "Unable to reach secure sign-in. Please try again." };
        }
      }
    }

    if (secureAccount && !supabase && !prototypeAccount) {
      return {
        ok: false,
        message: expectedRole === "student"
          ? "Secure student sign-in is unavailable because Supabase is not configured."
          : "Secure administrator sign-in is unavailable because Supabase is not configured.",
      };
    }

    if (!prototypeAccount && !secureAccount) {
      return {
        ok: false,
        message: expectedRole === "student"
          ? "That Student ID is not configured for prototype access."
          : "Invalid administrator ID.",
      };
    }

    if (password !== prototypePin) {
      return {
        ok: false,
        message: expectedRole === "student"
          ? "Incorrect Student ID or password."
          : "Incorrect PIN.",
      };
    }
    if (!isValidPrototypeIdentity(username, expectedRole)) {
      return {
        ok: false,
        message: expectedRole === "student"
          ? "That Student ID is not configured for prototype access."
          : "Invalid administrator ID.",
      };
    }

    const stored = storePrototypeSession(
      expectedRole,
      expectedRole === "student" ? username : null,
    );
    if (!stored.ok) return { ok: false, message: stored.error };

    const prototypeAuth = createPrototypeSession(
      expectedRole,
      expectedRole === "student" ? username : null,
    );
    if (!prototypeAuth) {
      const cleared = clearPrototypeSession();
      if (!cleared.ok) console.error(cleared.error);
      return { ok: false, message: "Unable to create the prototype session." };
    }

    setSession(prototypeAuth.session);
    setProfile(prototypeAuth.profile);
    return { ok: true, profile: prototypeAuth.profile };
  }, []);

  const profileId = profile?.id;
  const mustChangePassword = profile?.must_change_password;
  const changePassword = useCallback(async (password) => {
    if (!supabase || !session || session.isPrototype || !profileId) {
      return { ok: false, message: "A signed-in database account is required." };
    }
    const { error: passwordError } = await supabase.auth.updateUser({ password });
    if (passwordError) {
      return { ok: false, message: "The password could not be updated. Check the password rules and try again." };
    }

    if (mustChangePassword) {
      const { error: profileError } = await supabase.rpc("complete_initial_password_change");
      if (profileError) {
        console.error("Password updated but initial password flag could not be cleared:", profileError.message);
        return { ok: false, message: "Password updated, but account setup is not yet complete. Please try again." };
      }
    }

    const result = await getStudentProfile(profileId);
    if (result.error) {
      console.error("Unable to refresh account profile after password change:", result.error.message);
      return { ok: false, message: "Password updated, but the account status could not be refreshed. Sign in again." };
    }
    setProfile(result.data);
    return { ok: true, profile: result.data };
  }, [profileId, mustChangePassword, session]);

  const signOut = useCallback(async () => {
    if (session && !session.isPrototype && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) return { ok: false, error };
      setSession(null);
      setProfile(null);
      return { ok: true };
    }

    const cleared = clearPrototypeSession();
    setSession(null);
    setProfile(null);
    return { ok: cleared.ok };
  }, [session]);

  const value = useMemo(() => ({
    session,
    profile,
    loading,
    signIn,
    signOut,
    changePassword,
  }), [session, profile, loading, signIn, signOut, changePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
