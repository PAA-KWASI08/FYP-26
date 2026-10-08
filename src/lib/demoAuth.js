import { prototypeAdminId, prototypePin, prototypeStudents } from "./prototypeCredentials.js";

const localDemoSessionKey = "slm-local-demo-role";
const legacyStudentSessionKey = "slm-local-demo-student";

function createLocalDemoAuthState(role, studentId = null) {
  const student = role === "student"
    ? prototypeStudents.find((item) => item.studentId === studentId)
    : null;

  if (role === "student" && !student) return null;
  if (role !== "student" && role !== "admin") return null;

  const id = role === "student" ? `prototype-student-${student.studentId}` : "prototype-admin";
  const profile = role === "student"
    ? {
      id,
      student_id: student.studentId,
      full_name: student.fullName,
      programme: student.programme,
      department: student.department,
      level: student.level,
      college: student.college,
      email: null,
      role,
      account_status: "active",
    }
    : {
      id,
      student_id: null,
      full_name: prototypeAdminId,
      programme: null,
      department: null,
      level: null,
      college: null,
      email: null,
      role,
      account_status: "active",
    };

  return {
    session: {
      isLocalDemo: true,
      role,
      user: { id, email: null },
    },
    profile,
  };
}

export function getStoredLocalDemoAuthState() {
  if (typeof window === "undefined") return null;

  try {
    const storedSession = window.localStorage.getItem(localDemoSessionKey);
    if (storedSession) {
      let sessionData;
      try {
        sessionData = JSON.parse(storedSession);
      } catch {
        sessionData = { role: storedSession };
      }

      const role = sessionData?.role;
      const studentId = role === "student"
        ? sessionData.studentId ?? prototypeStudents[0]?.studentId
        : null;
      const authState = createLocalDemoAuthState(role, studentId);
      if (authState) return authState;
    }

    if (window.localStorage.getItem(legacyStudentSessionKey) === "active") {
      const authState = createLocalDemoAuthState("student", prototypeStudents[0]?.studentId);
      if (authState) {
        storeLocalDemoSession(true, "student", prototypeStudents[0].studentId);
        window.localStorage.removeItem(legacyStudentSessionKey);
        return authState;
      }
    }

    return null;
  } catch (error) {
    console.error("Unable to read the local prototype session:", error);
    return null;
  }
}

export function storeLocalDemoSession(isActive, role = "student", studentId = null) {
  if (typeof window === "undefined") {
    return { ok: false, error: "Prototype login is only available in a browser." };
  }

  try {
    if (isActive) {
      const authState = createLocalDemoAuthState(role, studentId);
      if (!authState) {
        return { ok: false, error: "Unable to save an invalid prototype session." };
      }
      window.localStorage.setItem(localDemoSessionKey, JSON.stringify({ role, studentId }));
    } else {
      window.localStorage.removeItem(localDemoSessionKey);
      window.localStorage.removeItem(legacyStudentSessionKey);
    }
    return { ok: true };
  } catch (error) {
    console.error("Unable to update the local prototype session:", error);
    return { ok: false, error: "Unable to save the local prototype session in this browser." };
  }
}

export function createLocalDemoSession(role, studentId = null) {
  return createLocalDemoAuthState(role, studentId);
}

export function validateLocalDemoCredentials(username, pin, role) {
  const errorMessage = role === "admin"
    ? "Invalid admin ID or PIN. Check your credentials and try again."
    : "Invalid student ID or PIN. Check your credentials and try again.";

  if (pin !== prototypePin) return { ok: false, message: errorMessage };

  if (role === "admin") {
    return username === prototypeAdminId
      ? { ok: true }
      : { ok: false, message: errorMessage };
  }

  if (role !== "student" || !/^\d{8}$/.test(username)) {
    return { ok: false, message: errorMessage };
  }

  const student = prototypeStudents.find((item) => item.studentId === username);
  return student
    ? { ok: true, student }
    : { ok: false, message: errorMessage };
}
