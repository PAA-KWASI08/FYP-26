import { useCallback, useState } from "react";
import { sections as initialSections } from "./sections";
import { mockStudent } from "./studentData";
import { StudentSessionContext } from "./studentSession";

export function StudentSessionProvider({ children }) {
  const [sections, setSections] = useState(() =>
    initialSections.map((section) => ({
      ...section,
      seats: section.seats.map((seat) => ({ ...seat })),
    })),
  );
  const [session, setSession] = useState(null);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [checkInConfirmation, setCheckInConfirmation] = useState(null);
  const [checkoutConfirmation, setCheckoutConfirmation] = useState(null);

  const checkIn = (seatCode) => {
    if (session) {
      return { ok: false, message: "You already have an active study session." };
    }

    const normalizedSeatCode = seatCode.trim().toUpperCase().replace(/\s+/g, "");
    const section = sections.find((item) =>
      item.seats.some((seat) => seat.seatCode === normalizedSeatCode),
    );
    const seat = section?.seats.find((item) => item.seatCode === normalizedSeatCode);

    if (!section || !seat) {
      return { ok: false, message: "Seat not found. Check the seat ID and try again." };
    }
    if (section.status !== "Open") {
      return { ok: false, message: "This section is closed. Choose another seat." };
    }
    if (seat.status !== "Available") {
      return { ok: false, message: "This seat is no longer available. Please choose another seat." };
    }

    const checkInTime = new Date();
    setSections((currentSections) => currentSections.map((item) => (
      item.id !== section.id
        ? item
        : {
          ...item,
          seats: item.seats.map((itemSeat) => (
            itemSeat.id === seat.id ? { ...itemSeat, status: "Occupied" } : itemSeat
          )),
        }
    )));
    const activeSession = {
      id: `${checkInTime.getTime()}-${seat.id}`,
      userId: mockStudent.studentId,
      sectionId: section.id,
      section: section.name,
      seat: seat.seatCode,
      seatId: seat.id,
      checkInTime,
      checkOutTime: null,
      sessionStatus: "active",
    };
    setSession(activeSession);
    setCheckInConfirmation(activeSession);
    setCheckoutConfirmation(null);

    return { ok: true };
  };

  const checkout = useCallback((expectedSessionId, userId) => {
    if (
      !session
      || session.sessionStatus !== "active"
      || session.id !== expectedSessionId
      || session.userId !== userId
    ) {
      return { ok: false, message: "Your active session could not be verified. Please review your current session." };
    }

    const completedSession = {
      ...session,
      checkOutTime: new Date(),
      sessionStatus: "completed",
    };
    setSections((currentSections) => currentSections.map((section) => (
      section.id !== session.sectionId
        ? section
        : {
          ...section,
          seats: section.seats.map((seat) => (
            seat.id === session.seatId ? { ...seat, status: "Available" } : seat
          )),
        }
    )));
    setSession(null);
    setCompletedSessions((currentSessions) => [completedSession, ...currentSessions]);
    setCheckInConfirmation(null);
    setCheckoutConfirmation(completedSession);
    return { ok: true };
  }, [session]);

  const clearCheckInConfirmation = useCallback(() => {
    setCheckInConfirmation(null);
  }, []);

  const clearCheckoutConfirmation = useCallback(() => {
    setCheckoutConfirmation(null);
  }, []);

  return (
    <StudentSessionContext.Provider value={{
      sections,
      student: mockStudent,
      currentStudentId: mockStudent.studentId,
      session,
      completedSessions,
      lastSession: completedSessions[0] ?? null,
      checkInConfirmation,
      checkoutConfirmation,
      checkIn,
      checkout,
      clearCheckInConfirmation,
      clearCheckoutConfirmation,
    }}>
      {children}
    </StudentSessionContext.Provider>
  );
}
