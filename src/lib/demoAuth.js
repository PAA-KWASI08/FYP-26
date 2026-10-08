import { prototypeAdmin, prototypeStudents } from "./prototypeCredentials";

const prototypeSessionKey = "slm-prototype-session";
const legacyRoleKey = "slm-local-demo-role";
const legacyStudentKey = "slm-local-demo-student";

function createAuthState(role, student) {
  const isStudent = role === "student";
  const id = isStudent ? `prototype-student-${student.studentId}` : "prototype-admin";
  const profile = isStudent
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
      full_name: prototypeAdmin.fullName,
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
      isPrototype: true,
      role,
      user: { id, studentId: student?.studentId ?? null },
    },
    profile,
  };
}

export function createPrototypeSession(role, studentId = null) {
  const student = role === "student"
    ? prototypeStudents.find((item) => item.studentId === studentId)
    : null;
  if (role === "student" && !student) return null;
  if (role !== "student" && role !== "admin") return null;
  return createAuthState(role, student);
}

export function getStoredPrototypeAuthState() {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(prototypeSessionKey);
    if (stored) {
      const { role, studentId = null } = JSON.parse(stored);
      return createPrototypeSession(role, studentId);
    }

    const legacyRole = window.localStorage.getItem(legacyRoleKey);
    const hadLegacyStudentSession = window.localStorage.getItem(legacyStudentKey) === "active";
    if (legacyRole === "student" || legacyRole === "admin" || hadLegacyStudentSession) {
      const migrated = createPrototypeSession(
        legacyRole === "admin" ? "admin" : "student",
        prototypeStudents[0]?.studentId,
      );
      if (migrated) {
        window.localStorage.setItem(prototypeSessionKey, JSON.stringify({
          role: migrated.session.role,
          studentId: migrated.session.user.studentId,
        }));
      }
      window.localStorage.removeItem(legacyRoleKey);
      window.localStorage.removeItem(legacyStudentKey);
      return migrated;
    }

    return null;
  } catch (error) {
    console.error("Unable to read the local prototype session:", error);
    return null;
  }
}

export function storePrototypeSession(role, studentId = null) {
  if (typeof window === "undefined") {
    return { ok: false, error: "Prototype login is only available in a browser." };
  }

  try {
    window.localStorage.setItem(prototypeSessionKey, JSON.stringify({ role, studentId }));
    window.localStorage.removeItem(legacyRoleKey);
    window.localStorage.removeItem(legacyStudentKey);
    return { ok: true };
  } catch (error) {
    console.error("Unable to save the local prototype session:", error);
    return { ok: false, error: "Unable to save the prototype session in this browser." };
  }
}

export function clearPrototypeSession() {
  if (typeof window === "undefined") {
    return { ok: false, error: "Prototype logout is only available in a browser." };
  }

  try {
    window.localStorage.removeItem(prototypeSessionKey);
    window.localStorage.removeItem(legacyRoleKey);
    window.localStorage.removeItem(legacyStudentKey);
    return { ok: true };
  } catch (error) {
    console.error("Unable to clear the local prototype session:", error);
    return { ok: false, error: "Unable to clear the prototype session in this browser." };
  }
}

export function isValidPrototypeIdentity(username, role) {
  if (role === "admin") return username === prototypeAdmin.adminId;
  return role === "student"
    && /^\d{8}$/.test(username)
    && prototypeStudents.some((student) => student.studentId === username);
}
