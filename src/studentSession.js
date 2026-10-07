import { createContext, useContext } from "react";

export const StudentSessionContext = createContext(null);

export function useStudentSession() {
  const context = useContext(StudentSessionContext);
  if (!context) {
    throw new Error("useStudentSession must be used within StudentSessionProvider");
  }
  return context;
}
