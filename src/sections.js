function createSeats(prefix, total, available, occupied, statusOverrides = {}) {
  return Array.from({ length: total }, (_, index) => {
    const seatNumber = index + 1;
    const seatCode = `${prefix}-${String(seatNumber).padStart(3, "0")}`;
    const status = statusOverrides[seatCode] ?? (index < available
      ? "Available"
      : index < available + occupied
        ? "Occupied"
        : "Unavailable");

    return {
      id: `${prefix}-${seatNumber}`,
      seatCode,
      qrIdentifier: seatCode,
      status,
      unavailableReason: status === "Unavailable" ? "Maintenance" : null,
    };
  });
}

export const sections = [
  {
    id: "reference-hall",
    name: "Reference Hall",
    prefix: "RH",
    status: "Open",
    seats: createSeats("RH", 48, 26, 18, {
      "RH-025": "Occupied",
      "RH-027": "Available",
      "RH-030": "Unavailable",
      "RH-045": "Occupied",
    }),
  },
  {
    id: "students-reference",
    name: "Students' Reference",
    prefix: "SR",
    status: "Open",
    seats: createSeats("SR", 36, 18, 15),
  },
  {
    id: "africana",
    name: "Africana",
    prefix: "AF",
    status: "Open",
    seats: createSeats("AF", 24, 12, 10),
  },
  {
    id: "iac",
    name: "IAC",
    prefix: "IAC",
    status: "Open",
    seats: createSeats("IAC", 20, 9, 9),
  },
  {
    id: "e-resources",
    name: "E-Resources",
    prefix: "ER",
    status: "Closed",
    seats: createSeats("ER", 16, 0, 0),
  },
];

export function getSeatStatus(seat) {
  return seat.status;
}

export function getSectionAvailability(section) {
  return section.seats.reduce(
    (counts, seat) => {
      counts.total += 1;
      if (seat.status === "Available") counts.available += 1;
      else if (seat.status === "Occupied") counts.occupied += 1;
      else counts.unavailable += 1;
      return counts;
    },
    { total: 0, available: 0, occupied: 0, unavailable: 0 },
  );
}

export function getLibraryAvailability(librarySections = sections) {
  return librarySections.reduce(
    (totals, section) => {
      const counts = getSectionAvailability(section);
      totals.total += counts.total;
      totals.available += counts.available;
      totals.occupied += counts.occupied;
      totals.unavailable += counts.unavailable;
      return totals;
    },
    { total: 0, available: 0, occupied: 0, unavailable: 0 },
  );
}
