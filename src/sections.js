export function getSeatStatus(seat, section) {
  if (section?.status?.toLocaleLowerCase() === "closed") return "Unavailable";
  return seat.status;
}

export function getSectionAvailability(section) {
  if (section.status?.toLocaleLowerCase() === "closed") {
    return {
      total: section.seats.length,
      available: 0,
      occupied: 0,
      unavailable: section.seats.length,
    };
  }
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

export function getLibraryAvailability(librarySections) {
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
