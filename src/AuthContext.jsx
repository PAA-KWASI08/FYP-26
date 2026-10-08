import { useCallback, useMemo, useState } from "react";
import { AuthContext } from "./authContext";
import {
  createLocalDemoSession,
  getStoredLocalDemoAuthState,
  storeLocalDemoSession,
  validateLocalDemoCredentials,
} from "./lib/demoAuth";

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => (
    getStoredLocalDemoAuthState() ?? { session: null, profile: null }
  ));

  const signIn = useCallback((username, pin, expectedRole) => {
    const validation = validateLocalDemoCredentials(username, pin, expectedRole);
    if (!validation.ok) return validation;

    const studentId = expectedRole === "student" ? validation.student.studentId : null;
    const stored = storeLocalDemoSession(true, expectedRole, studentId);
    if (!stored.ok) return { ok: false, message: stored.error };

    const nextAuthState = createLocalDemoSession(expectedRole, studentId);
    setAuthState(nextAuthState);
    return { ok: true, profile: nextAuthState.profile };
  }, []);

  const signOut = useCallback(() => {
    const cleared = storeLocalDemoSession(false);
    setAuthState({ session: null, profile: null });
    return { ok: cleared.ok };
  }, []);

  const value = useMemo(() => ({
    ...authState,
    loading: false,
    signIn,
    signOut,
  }), [authState, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
