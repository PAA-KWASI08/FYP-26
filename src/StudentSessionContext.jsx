import { useCallback, useState } from "react";
import { sections as initialSections } from "./sections";
import { mockStudent } from "./studentData";
import { StudentSessionContext } from "./studentSession";
import { initialAnnouncements } from "./announcementData";

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
  const [announcements, setAnnouncements] = useState(() => initialAnnouncements.map((item) => ({ ...item })));

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
      locationStatus: "Within Library",
      locationStatusIsMock: true,
      promptSentAt: null,
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

  const setSectionStatus = useCallback((sectionId, status) => {
    if (!["Open", "Closed"].includes(status)) {
      return { ok: false, message: "The selected section status is not valid." };
    }
    if (!sections.some((section) => section.id === sectionId)) {
      return { ok: false, message: "The selected section could not be found." };
    }

    setSections((currentSections) => currentSections.map((section) => (
      section.id === sectionId ? { ...section, status } : section
    )));
    return { ok: true };
  }, [sections]);

  const setSeatAvailability = useCallback((sectionId, seatId, status, unavailableReason = null) => {
    if (!["Available", "Unavailable"].includes(status)) {
      return { ok: false, message: "Seats can only be marked Available or Unavailable here." };
    }
    const section = sections.find((item) => item.id === sectionId);
    const seat = section?.seats.find((item) => item.id === seatId);
    if (!section || !seat) {
      return { ok: false, message: "The selected seat could not be found." };
    }
    if (seat.status === "Occupied" || (
      session?.sessionStatus === "active"
      && session.sectionId === sectionId
      && session.seatId === seatId
    )) {
      return { ok: false, message: "Occupied seats must be managed through Active Sessions." };
    }
    if (status === "Unavailable" && !unavailableReason?.trim()) {
      return { ok: false, message: "Provide a reason before marking the seat unavailable." };
    }

    setSections((currentSections) => currentSections.map((currentSection) => (
      currentSection.id !== sectionId
        ? currentSection
        : {
          ...currentSection,
          seats: currentSection.seats.map((currentSeat) => (
            currentSeat.id === seatId
              ? {
                ...currentSeat,
                status,
                unavailableReason: status === "Unavailable" ? unavailableReason.trim() : null,
              }
              : currentSeat
          )),
        }
    )));
    return { ok: true };
  }, [sections, session]);

  const promptStudent = useCallback((sessionId) => {
    if (
      !session
      || session.sessionStatus !== "active"
      || session.id !== sessionId
    ) {
      return { ok: false, message: "The active session could not be verified." };
    }
    setSession((currentSession) => (
      currentSession?.id === sessionId
        ? { ...currentSession, promptSentAt: new Date() }
        : currentSession
    ));
    return { ok: true };
  }, [session]);

  const createAnnouncement = useCallback((announcement) => {
    const createdAt = new Date().toISOString();
    const createdAnnouncement = {
      ...announcement,
      id: `announcement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt,
    };
    setAnnouncements((currentAnnouncements) => [createdAnnouncement, ...currentAnnouncements]);
    return { ok: true, announcement: createdAnnouncement };
  }, []);

  const updateAnnouncement = useCallback((announcementId, updates) => {
    if (!announcements.some((announcement) => announcement.id === announcementId)) {
      return { ok: false, message: "The selected announcement could not be found." };
    }
    setAnnouncements((currentAnnouncements) => currentAnnouncements.map((announcement) => (
      announcement.id === announcementId
        ? { ...announcement, ...updates }
        : announcement
    )));
    return { ok: true };
  }, [announcements]);

  const deleteAnnouncement = useCallback((announcementId) => {
    if (!announcements.some((announcement) => announcement.id === announcementId)) {
      return { ok: false, message: "The selected announcement could not be found." };
    }
    setAnnouncements((currentAnnouncements) => currentAnnouncements.filter(
      (announcement) => announcement.id !== announcementId,
    ));
    return { ok: true };
  }, [announcements]);

  return (
    <StudentSessionContext.Provider value={{
      sections,
      announcements,
      student: mockStudent,
      currentStudentId: mockStudent.studentId,
      session,
      completedSessions,
      lastSession: completedSessions[0] ?? null,
      checkInConfirmation,
      checkoutConfirmation,
      checkIn,
      checkout,
      setSectionStatus,
      setSeatAvailability,
      promptStudent,
      createAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      clearCheckInConfirmation,
      clearCheckoutConfirmation,
    }}>
      {children}
    </StudentSessionContext.Provider>
  );
}
