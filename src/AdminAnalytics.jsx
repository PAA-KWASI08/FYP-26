import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Armchair,
  BarChart3,
  CalendarDays,
  Clock3,
  Download,
  Library,
  Search,
  UsersRound,
} from "lucide-react";
import { formatAdminDuration } from "./adminData";
import { getLibraryAvailability } from "./sections";
import { useStudentSession } from "./studentSession";

const periods = ["Morning", "Afternoon", "Evening"];
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dateOptions = ["All recorded data", "Today", "This week", "This month", "This semester", "This year", "Custom range"];
const reportPeriods = ["All recorded data", "Daily", "Weekly", "Monthly", "Semester", "Annual"];

function validDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function durationMinutes(item, now) {
  const start = validDate(item.checkInTime);
  const end = validDate(item.checkOutTime) ?? (item.sessionStatus === "active" ? now : null);
  if (!start || !end) return null;
  return Math.max(0, Math.floor((end - start) / 60000));
}

function formatDuration(minutes) {
  return minutes === null ? "Not enough recorded data" : formatAdminDuration(minutes * 60000);
}

function formatDateTime(value) {
  const date = validDate(value);
  return date
    ? new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date)
    : "—";
}

function timePeriod(value) {
  const date = validDate(value);
  if (!date) return null;
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  return "Evening";
}

function dayName(value) {
  const date = validDate(value);
  return date ? weekdays[(date.getDay() + 6) % 7] : null;
}

function monthKey(value) {
  const date = validDate(value);
  return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` : null;
}

function rangeFor(option, now, customStart, customEnd) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (option === "Today") return { start, end: new Date(start.getTime() + 86400000) };
  if (option === "This week") {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return { start, end: new Date(start.getTime() + 7 * 86400000) };
  }
  if (option === "This month") {
    start.setDate(1);
    return { start, end: new Date(start.getFullYear(), start.getMonth() + 1, 1) };
  }
  if (option === "This semester") {
    const semesterStart = new Date(now);
    semesterStart.setMonth(semesterStart.getMonth() - 6);
    return { start: semesterStart, end: new Date(now.getTime() + 1) };
  }
  if (option === "This year") return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear() + 1, 0, 1) };
  if (option === "Custom range") {
    const customStartDate = customStart ? new Date(`${customStart}T00:00:00`) : null;
    const customEndDate = customEnd ? new Date(`${customEnd}T00:00:00`) : null;
    if (!customStartDate && !customEndDate) return { invalid: true, missing: true };
    if (customStartDate && customEndDate && customEndDate < customStartDate) return { invalid: true };
    return {
      start: customStartDate ?? new Date(-8640000000000000),
      end: customEndDate ? new Date(customEndDate.getTime() + 86400000) : new Date(8640000000000000),
    };
  }
  return null;
}

function countBy(items, selector) {
  const counts = new Map();
  items.forEach((item) => {
    const key = selector(item);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
}

function uniqueExtreme(counts, direction = "max") {
  if (!counts.size) return null;
  const values = [...counts.values()];
  const extreme = direction === "max" ? Math.max(...values) : Math.min(...values);
  const winners = [...counts.entries()].filter(([, count]) => count === extreme).map(([name]) => name);
  return { names: winners, count: extreme };
}

function ChartCard({ title, description, children }) {
  return (
    <section className="min-w-0 rounded-xl border border-[#DDE3F2] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h3 className="font-bold text-[#140B63]">{title}</h3>
        {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value, note, icon: Icon }) {
  return (
    <article className="min-w-0 rounded-xl border border-[#DDE3F2] bg-white p-3 shadow-sm sm:p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF0FA] text-[#343A78]">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <p className="mt-3 break-words text-lg font-bold leading-tight text-[#140B63] sm:text-xl">{value}</p>
      <h3 className="mt-1 text-xs font-semibold text-gray-600">{label}</h3>
      {note && <p className="mt-1 text-[11px] text-gray-500">{note}</p>}
    </article>
  );
}

function BarRows({ items, maxValue, valueText = (value) => String(value), emptyLabel = "No recorded activity for this selection." }) {
  if (!items.length || maxValue <= 0) {
    return <p className="py-5 text-sm text-gray-500">{emptyLabel}</p>;
  }
  return (
    <div className="space-y-3">
      {items.map(({ label, value, detail }) => (
        <div key={label} className="grid grid-cols-[minmax(76px,1fr)_minmax(80px,3fr)_auto] items-center gap-2 sm:grid-cols-[minmax(105px,1fr)_minmax(120px,3fr)_auto]">
          <span className="truncate text-xs font-medium text-gray-600" title={label}>{label}</span>
          <span className="h-3 overflow-hidden rounded-full bg-[#EEF0F5]" role="img" aria-label={`${label}: ${valueText(value)}`}>
            <span className="block h-full rounded-full bg-[#5B5FC7]" style={{ width: `${Math.max(2, (value / maxValue) * 100)}%` }} />
          </span>
          <span className="text-right text-xs font-semibold text-[#140B63]">{valueText(value)}{detail ? <span className="ml-1 font-normal text-gray-500">{detail}</span> : null}</span>
        </div>
      ))}
    </div>
  );
}

function MonthlyChart({ rows }) {
  if (!rows.length) return <p className="py-5 text-sm text-gray-500">No recorded activity for this year.</p>;
  const maximum = Math.max(...rows.map((row) => row.count));
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-end gap-2 border-b border-[#DDE3F2] pb-2">
        {rows.map((row) => (
          <div key={row.key} className="flex w-12 flex-col items-center gap-1 sm:w-14" title={`${row.label}: ${row.count} recorded check-ins`}>
            <span className="text-[10px] font-semibold text-[#140B63]">{row.count}</span>
            <span className="flex h-28 w-5 items-end rounded-t bg-[#EEF0FA] sm:w-7">
              <span className="block w-full rounded-t bg-[#5B5FC7]" style={{ height: `${Math.max(3, (row.count / maximum) * 100)}%` }} />
            </span>
            <span className="text-[10px] text-gray-500">{row.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-500">Recorded check-ins; months without records are omitted.</p>
    </div>
  );
}

function SessionDetails({ item, studentName, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const details = [
    ["Student ID", item.studentId ?? item.userId ?? "—"],
    ...(studentName ? [["Student name", studentName]] : []),
    ["Section", item.sectionName],
    ["Seat ID", item.seatCode],
    ["Check-in time", formatDateTime(item.checkInTime)],
    ["Check-out time", formatDateTime(item.checkOutTime)],
    ["Study duration", formatDuration(item.duration)],
    ["Session status", "Completed"],
    ...(item.locationStatus ? [["Location information", `${item.locationStatus}${item.locationStatusIsMock ? " (mock)" : ""}`]] : []),
  ];
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-5" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section role="dialog" aria-modal="true" aria-labelledby="analytics-session-heading" className="my-auto w-full max-w-xl rounded-xl border border-[#DDE3F2] bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="analytics-session-heading" className="text-xl font-bold text-[#140B63]">Session Details</h2>
            <p className="mt-1 text-sm text-gray-500">Read-only completed session record</p>
          </div>
          <span className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-xs font-semibold text-[#1D4ED8]">Completed</span>
        </div>
        <dl className="mt-5 grid grid-cols-1 gap-3 rounded-lg border border-[#E7EAF3] bg-[#FCFCFF] p-4 text-sm sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label} className={label === "Location information" ? "sm:col-span-2" : ""}>
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="mt-0.5 break-words font-semibold text-[#140B63]">{value || "—"}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-[#DDE3F2] px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Close</button>
        </div>
      </section>
    </div>
  );
}

export default function AdminAnalytics() {
  const { sections, session, completedSessions, student } = useStudentSession();
  const [now, setNow] = useState(() => new Date());
  const [dateOption, setDateOption] = useState("All recorded data");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [seatSearch, setSeatSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("All Sections");
  const [studentSearch, setStudentSearch] = useState("");
  const [reportYear, setReportYear] = useState("");
  const [reportPeriod, setReportPeriod] = useState("All recorded data");
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  useEffect(() => {
    if (session?.sessionStatus !== "active") return undefined;
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, [session?.id, session?.sessionStatus]);

  const allRecords = useMemo(() => {
    const completed = completedSessions
      .filter((item) => (item.status ?? item.sessionStatus)?.toLowerCase() === "completed")
      .map((item) => ({ ...item, sessionStatus: "completed" }));
    const all = session?.sessionStatus === "active" ? [session, ...completed] : completed;
    return all.flatMap((item) => {
      const checkIn = validDate(item.checkInTime);
      if (!checkIn) return [];
      const section = sections.find((entry) => entry.id === item.sectionId);
      const seat = section?.seats.find((entry) => entry.id === item.seatId);
      const duration = durationMinutes(item, now);
      return [{
        ...item,
        checkInDate: checkIn,
        sectionName: section?.name ?? item.section ?? "Unknown section",
        seatCode: item.seat ?? seat?.seatCode ?? item.seatId ?? "Unknown seat",
        duration,
        isCompleted: item.sessionStatus === "completed",
      }];
    });
  }, [completedSessions, now, sections, session]);

  const range = rangeFor(dateOption, now, customStart, customEnd);
  const normalizedSeatSearch = seatSearch.trim().toLocaleLowerCase();
  const normalizedStudentSearch = studentSearch.trim().toLocaleLowerCase();
  const records = useMemo(() => allRecords.filter((item) => (
    !range?.invalid
    && (!range || (item.checkInDate >= range.start && item.checkInDate < range.end))
    && (sectionFilter === "All Sections" || item.sectionId === sectionFilter)
    && (!normalizedSeatSearch || `${item.seatCode} ${item.seatId}`.toLocaleLowerCase().includes(normalizedSeatSearch))
    && (!normalizedStudentSearch || String(item.studentId ?? item.userId ?? "").toLocaleLowerCase().includes(normalizedStudentSearch))
  )), [allRecords, normalizedSeatSearch, normalizedStudentSearch, range, sectionFilter]);

  const completedRecords = records.filter((item) => item.isCompleted);
  const completedDurations = completedRecords.map((item) => item.duration).filter((value) => value !== null);
  const totalStudyMinutes = records.reduce((sum, item) => sum + (item.duration ?? 0), 0);
  const averageStudyMinutes = completedDurations.length
    ? Math.round(completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length)
    : null;
  const availability = getLibraryAvailability(sections);
  const seatRows = useMemo(() => {
    const seatStats = new Map();
    records.forEach((item) => {
      const key = item.seatId ?? item.seatCode;
      const current = seatStats.get(key) ?? { seatId: key, seatCode: item.seatCode, section: item.sectionName, count: 0, minutes: 0 };
      current.count += 1;
      current.minutes += item.duration ?? 0;
      seatStats.set(key, current);
    });
    return [...seatStats.values()].map((item) => {
      const seat = sections.flatMap((section) => section.seats.map((entry) => ({ ...entry, sectionName: section.name })))
        .find((entry) => entry.id === item.seatId || entry.seatCode === item.seatCode);
      return { ...item, status: seat?.status ?? "Unknown" };
    }).sort((first, second) => second.count - first.count || first.seatCode.localeCompare(second.seatCode));
  }, [records, sections]);

  const sectionRows = sections.map((section) => {
    const sectionRecords = records.filter((item) => item.sectionId === section.id);
    const sectionCompleted = sectionRecords.filter((item) => item.isCompleted);
    const completedMinutes = sectionCompleted.reduce((sum, item) => sum + (item.duration ?? 0), 0);
    const periodCounts = Object.fromEntries(periods.map((period) => [
      period,
      sectionRecords.filter((item) => timePeriod(item.checkInTime) === period).length,
    ]));
    return {
      ...section,
      checkIns: sectionRecords.length,
      completed: sectionCompleted.length,
      minutes: completedMinutes,
      average: sectionCompleted.length ? Math.round(completedMinutes / sectionCompleted.length) : null,
      periodCounts,
    };
  });

  const periodCounts = countBy(records, (item) => timePeriod(item.checkInTime));
  const dayCounts = countBy(records, (item) => dayName(item.checkInTime));
  const monthCounts = countBy(records, (item) => monthKey(item.checkInTime));
  const topPeriod = uniqueExtreme(periodCounts);
  const topDay = uniqueExtreme(dayCounts);
  const topMonth = uniqueExtreme(monthCounts);
  const sectionCounts = new Map(sectionRows.map((section) => [section.name, section.checkIns]));
  const topSection = uniqueExtreme(sectionCounts);
  const highestSeat = seatRows[0];
  const enoughPeakData = records.length >= 2;

  const years = [...new Set(records.map((item) => item.checkInDate.getFullYear()))].sort((a, b) => b - a);
  const selectedYear = years.includes(Number(reportYear)) ? Number(reportYear) : years[0];
  const yearRecords = records.filter((item) => item.checkInDate.getFullYear() === selectedYear);
  const monthlyRows = months.flatMap((month, monthIndex) => {
    const key = `${selectedYear}-${String(monthIndex + 1).padStart(2, "0")}`;
    const count = yearRecords.filter((item) => monthKey(item.checkInTime) === key).length;
    return count ? [{ key, label: month.slice(0, 3), count }] : [];
  });
  const yearCompleted = yearRecords.filter((item) => item.isCompleted);
  const yearCompletedMinutes = yearCompleted.reduce((sum, item) => sum + (item.duration ?? 0), 0);
  const yearSections = sections.map((section) => ({
    name: section.name,
    count: yearRecords.filter((item) => item.sectionId === section.id).length,
  }));
  const annualMostSection = uniqueExtreme(new Map(yearSections.map((item) => [item.name, item.count])));
  const annualLeastSection = uniqueExtreme(new Map(yearSections.map((item) => [item.name, item.count])), "min");
  const annualPeriods = uniqueExtreme(countBy(yearRecords, (item) => timePeriod(item.checkInTime)));
  const annualSeatCounts = countBy(yearRecords, (item) => item.seatCode);
  const annualMostSeat = uniqueExtreme(annualSeatCounts);

  const customRangeInvalid = Boolean(range?.invalid);
  const seatRowsForSearch = seatSearch.trim()
    ? sections.flatMap((section) => section.seats
      .filter((seat) => `${seat.seatCode} ${section.name}`.toLocaleLowerCase().includes(seatSearch.trim().toLocaleLowerCase()))
      .map((seat) => {
        const usage = seatRows.find((item) => item.seatId === seat.id || item.seatCode === seat.seatCode);
        return {
          seatId: seat.id,
          seatCode: seat.seatCode,
          section: section.name,
          count: usage?.count ?? 0,
          minutes: usage?.minutes ?? 0,
          status: seat.status,
        };
      }))
    : seatRows;
  const leastUsedSections = sectionRows.filter((item) => item.checkIns > 0).sort((a, b) => a.checkIns - b.checkIns);
  const lowestRecordedSection = leastUsedSections.length > 1 ? leastUsedSections[0] : null;
  const sectionPeriodMax = Math.max(0, ...sectionRows.flatMap((section) => Object.values(section.periodCounts)));
  const noActivity = records.length === 0 || customRangeInvalid;
  const selectedSession = records.find((item) => item.id === selectedSessionId);
  const selectedStudentName = selectedSession
    && (selectedSession.studentId ?? selectedSession.userId) === student.studentId
    ? student.fullName
    : undefined;
  const searchedSeat = seatSearch.trim()
    ? sections.flatMap((section) => section.seats.map((seat) => ({ ...seat, sectionName: section.name })))
      .find((seat) => seat.seatCode.toLocaleLowerCase() === seatSearch.trim().toLocaleLowerCase())
    : null;
  const searchedSeatRecords = searchedSeat
    ? records.filter((item) => item.seatId === searchedSeat.id || item.seatCode === searchedSeat.seatCode)
    : [];
  const searchedSeatMinutes = searchedSeatRecords.reduce((sum, item) => sum + (item.duration ?? 0), 0);
  const searchedSeatCompletedDurations = searchedSeatRecords
    .filter((item) => item.isCompleted && item.duration !== null)
    .map((item) => item.duration);
  const reportStart = range?.start && !range.invalid ? formatDateTime(range.start) : "All recorded dates";
  const reportEnd = range?.end && !range.invalid ? formatDateTime(new Date(range.end.getTime() - 1)) : "";

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 p-3 sm:gap-5 sm:p-5">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#140B63] sm:text-3xl">Usage &amp; Analytics</h2>
          <p className="mt-1 text-sm text-gray-600">Analyse library seat usage, identify usage patterns and support data-informed management decisions.</p>
          <p className="mt-1 text-xs text-gray-500">Based on recorded Scan2Seat activity; counts represent check-ins, not simultaneous occupancy or all library visitors.</p>
        </div>
      </header>

      <section aria-label="Analytics date range" className="rounded-xl border border-[#DDE3F2] bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-gray-600">
            <span>Global date range</span>
            <select
              value={dateOption}
              onChange={(event) => {
                const nextRange = event.target.value;
                setDateOption(nextRange);
                setReportPeriod({
                  Today: "Daily",
                  "This week": "Weekly",
                  "This month": "Monthly",
                  "This semester": "Semester",
                  "This year": "Annual",
                }[nextRange] ?? "All recorded data");
              }}
              className="min-h-11 rounded-lg border border-[#DDE3F2] bg-white px-3 text-sm font-medium text-[#140B63] focus:border-[#8B8FD1] focus:outline-none focus:ring-2 focus:ring-[#E7E8F8]"
            >
              {dateOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-gray-600">
            <span>Section</span>
            <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)} className="min-h-11 rounded-lg border border-[#DDE3F2] bg-white px-3 text-sm font-medium text-[#140B63] focus:border-[#8B8FD1] focus:outline-none focus:ring-2 focus:ring-[#E7E8F8]">
              <option value="All Sections">All Sections</option>
              {sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-gray-600">
            <span>Seat</span>
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input type="search" value={seatSearch} onChange={(event) => setSeatSearch(event.target.value)} placeholder="Search seat ID" className="min-h-11 w-full rounded-lg border border-[#DDE3F2] py-2 pl-9 pr-3 text-sm font-medium text-[#140B63] placeholder:font-normal placeholder:text-gray-400 focus:border-[#8B8FD1] focus:outline-none focus:ring-2 focus:ring-[#E7E8F8]" />
            </span>
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-gray-600">
            <span>Student</span>
            <input type="search" value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Search Student ID" className="min-h-11 w-full rounded-lg border border-[#DDE3F2] px-3 py-2 text-sm font-medium text-[#140B63] placeholder:font-normal placeholder:text-gray-400 focus:border-[#8B8FD1] focus:outline-none focus:ring-2 focus:ring-[#E7E8F8]" />
          </label>
        </div>
        {dateOption === "Custom range" && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
              <span>From</span>
              <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="min-h-11 rounded-lg border border-[#DDE3F2] px-3 text-sm text-[#140B63]" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
              <span>Through</span>
              <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="min-h-11 rounded-lg border border-[#DDE3F2] px-3 text-sm text-[#140B63]" />
            </label>
          </div>
        )}
        <div className="mt-3">
          <p className="text-xs text-gray-500">
            {dateOption === "This semester"
              ? "Prototype semester filter uses a rolling six-month window; configure institutional dates when available."
              : "These filters apply to usage trends, section/seat analysis, reports and completed-session history."}
          </p>
        </div>
        {customRangeInvalid && <p role="alert" className="mt-2 text-sm text-[#9B2C2C]">{range.missing ? "Enter a start date, an end date, or both to view this custom range." : "The end date must be on or after the start date."}</p>}
      </section>

      {noActivity ? (
        <p className="rounded-lg border border-dashed border-[#DDE3F2] bg-white p-4 text-sm text-gray-600">
          {customRangeInvalid ? "Correct the custom date range to view activity." : "No recorded activity for this selection."}
        </p>
      ) : null}

      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="mb-2 text-lg font-bold text-[#140B63]">Overview</h2>
        <div aria-label="Historical usage overview" className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        <StatCard label="Total Check-ins" value={noActivity ? "—" : records.length} note="Recorded sessions" icon={Activity} />
        <StatCard label="Completed Sessions" value={noActivity ? "—" : completedRecords.length} icon={UsersRound} />
        <StatCard label="Total Study Time" value={noActivity ? "—" : formatDuration(totalStudyMinutes)} note="Completed time plus active elapsed time" icon={Clock3} />
        <StatCard label="Average Study Duration" value={averageStudyMinutes === null ? "Not enough recorded data" : formatDuration(averageStudyMinutes)} note="Completed sessions only" icon={Clock3} />
        <StatCard label="Most Used Section" value={!enoughPeakData || !topSection ? "Not enough recorded data" : topSection.names.join(", ")} icon={Library} />
        <StatCard label="Most Used Seat" value={!enoughPeakData || !highestSeat ? "Not enough recorded data" : highestSeat.seatCode} note="Based on recorded sessions" icon={Armchair} />
        <StatCard label="Peak Usage Period" value={!enoughPeakData || !topPeriod ? "Not enough recorded data" : topPeriod.names.join(", ")} icon={BarChart3} />
        <StatCard label="Current Occupancy" value={`${availability.occupied} / ${availability.total}`} note="Current seat status; not historical check-ins" icon={UsersRound} />
        </div>
      </section>

      <section aria-label="Current library status" className="rounded-xl border border-[#DDE3F2] bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h3 className="font-bold text-[#140B63]">Current Library Status</h3>
          <p className="text-xs text-gray-500">Current seat state is separate from historical usage.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Total Seats", availability.total],
            ["Available", availability.available],
            ["Occupied", availability.occupied],
            ["Unavailable", availability.unavailable],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[#EEF0F5] bg-[#FCFCFF] p-3">
              <p className="text-xl font-bold text-[#140B63]">{value}</p>
              <p className="mt-1 text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="section-seat-analysis-heading" className="flex flex-col gap-3">
      <h2 id="section-seat-analysis-heading" className="text-lg font-bold text-[#140B63]">Section &amp; Seat Analysis</h2>
      <ChartCard title="Section Usage" description="Recorded check-ins, completed sessions, study time and current seat availability. Study-time totals include completed records only.">
        {noActivity ? <p className="text-sm text-gray-500">No recorded activity for this selection.</p> : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-semibold text-gray-600">Recorded check-ins</p>
              <BarRows items={sectionRows.map((item) => ({ label: item.name, value: item.checkIns }))} maxValue={Math.max(0, ...sectionRows.map((item) => item.checkIns))} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead><tr className="border-b border-[#DDE3F2] text-gray-500"><th className="py-2 pr-3">Section</th><th className="py-2 pr-3">Check-ins</th><th className="py-2 pr-3">Completed</th><th className="py-2 pr-3">Study time</th><th className="py-2 pr-3">Average</th><th className="py-2 pr-3">Available</th><th className="py-2">Occupied</th></tr></thead>
                <tbody>{sectionRows.map((item) => {
                  const currentSeats = item.seats.reduce((counts, seat) => {
                    if (seat.status === "Available") counts.available += 1;
                    if (seat.status === "Occupied") counts.occupied += 1;
                    return counts;
                  }, { available: 0, occupied: 0 });
                  return <tr key={item.id} className="border-b border-[#EEF0F5] last:border-0"><td className="py-2 pr-3 font-semibold text-[#140B63]">{item.name}</td><td className="py-2 pr-3">{item.checkIns}</td><td className="py-2 pr-3">{item.completed}</td><td className="py-2 pr-3">{formatDuration(item.completed ? item.minutes : null)}</td><td className="py-2 pr-3">{item.average === null ? "Not enough recorded data" : formatDuration(item.average)}</td><td className="py-2 pr-3">{currentSeats.available}</td><td className="py-2">{currentSeats.occupied}</td></tr>;
                })}</tbody>
              </table>
            </div>
          </div>
        )}
      </ChartCard>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Seat Usage" description="Most used based on recorded sessions; past usage does not imply current occupancy.">
          {seatRowsForSearch.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-xs">
                <thead><tr className="border-b border-[#DDE3F2] text-gray-500"><th className="py-2 pr-2">Seat</th><th className="py-2 pr-2">Section</th><th className="py-2 pr-2">Recorded sessions</th><th className="py-2 pr-2">Study time</th><th className="py-2">Current status</th></tr></thead>
                <tbody>{seatRowsForSearch.slice(0, 8).map((item) => <tr key={item.seatId} className="border-b border-[#EEF0F5] last:border-0"><td className="py-2 pr-2 font-semibold text-[#140B63]">{item.seatCode}</td><td className="py-2 pr-2">{item.section}</td><td className="py-2 pr-2">{item.count || "None recorded"}</td><td className="py-2 pr-2">{item.count ? formatDuration(item.minutes) : "No recorded study time"}</td><td className="py-2">{item.status}</td></tr>)}</tbody>
              </table>
            </div>
          ) : <p className="text-sm text-gray-500">{seatSearch ? "No recorded session matches this seat." : "No seat usage is recorded for this period."}</p>}
          <p className="mt-3 text-xs text-gray-500">
            {enoughPeakData && highestSeat
              ? `Most used based on recorded sessions: ${highestSeat.seatCode} (${highestSeat.count}).`
              : "Not enough recorded data to identify usage leaders."}
            {enoughPeakData && seatRows.length > 1 && ` Least used among seats with recorded sessions: ${seatRows.at(-1).seatCode} (${seatRows.at(-1).count}).`}
          </p>
          {searchedSeat && (
            <div className="mt-4 rounded-lg border border-[#DDE3F2] bg-[#FCFCFF] p-3">
              <h4 className="font-semibold text-[#140B63]">{searchedSeat.seatCode} · {searchedSeat.sectionName}</h4>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div><dt className="text-gray-500">Total sessions</dt><dd className="font-semibold text-[#140B63]">{searchedSeatRecords.length}</dd></div>
                <div><dt className="text-gray-500">Total study time</dt><dd className="font-semibold text-[#140B63]">{searchedSeatCompletedDurations.length ? formatDuration(searchedSeatMinutes) : "Not enough recorded data"}</dd></div>
                <div><dt className="text-gray-500">Average duration</dt><dd className="font-semibold text-[#140B63]">{searchedSeatCompletedDurations.length ? formatDuration(Math.round(searchedSeatCompletedDurations.reduce((sum, value) => sum + value, 0) / searchedSeatCompletedDurations.length)) : "Not enough recorded data"}</dd></div>
                <div><dt className="text-gray-500">Current status</dt><dd className="font-semibold text-[#140B63]">{searchedSeat.status}</dd></div>
              </dl>
              <p className="mt-2 text-xs text-gray-500">Last recorded session: {searchedSeatRecords.length ? formatDateTime(searchedSeatRecords[0].checkInTime) : "No recorded sessions"}</p>
            </div>
          )}
        </ChartCard>
      </section>
      </section>

      <section aria-labelledby="usage-trends-heading" className="flex flex-col gap-3">
      <h2 id="usage-trends-heading" className="text-lg font-bold text-[#140B63]">Usage Trends</h2>
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Usage by Time of Day" description="Check-ins use local recorded time: Morning 5:00–11:59, Afternoon 12:00–16:59, Evening 17:00–4:59 (including overnight records).">
          <BarRows items={periods.map((label) => ({ label, value: periodCounts.get(label) ?? 0 }))} maxValue={Math.max(0, ...periods.map((label) => periodCounts.get(label) ?? 0))} />
          <p className="mt-4 border-t border-[#EEF0F5] pt-3 text-sm text-gray-600">
            Peak recorded period: <span className="font-semibold text-[#140B63]">{enoughPeakData && topPeriod ? `${topPeriod.names.join(", ")} — highest recorded check-in activity.` : "Not enough recorded data"}</span>
          </p>
        </ChartCard>
        <ChartCard title="Daily Usage" description="Recorded Check-ins by the weekday of check-in. A low count does not mean the library was empty.">
          <BarRows items={weekdays.map((label) => ({ label, value: dayCounts.get(label) ?? 0 }))} maxValue={Math.max(0, ...weekdays.map((label) => dayCounts.get(label) ?? 0))} />
        </ChartCard>
        <ChartCard title="Monthly Usage" description="Recorded check-ins grouped by month for the selected recorded year.">
          <label className="mb-4 flex items-center gap-2 text-xs font-semibold text-gray-600">
            <span>Year</span>
            <select aria-label="Monthly usage year" value={selectedYear ?? ""} onChange={(event) => setReportYear(event.target.value)} disabled={!years.length} className="min-h-9 rounded-lg border border-[#DDE3F2] bg-white px-3 text-sm text-[#140B63] disabled:text-gray-400">
              {years.length ? years.map((year) => <option key={year} value={year}>{year}</option>) : <option value="">No recorded year</option>}
            </select>
          </label>
          {noActivity ? <p className="text-sm text-gray-500">No recorded activity for this selection.</p> : <MonthlyChart rows={monthlyRows} />}
        </ChartCard>
      </section>
      </section>

      <ChartCard title="Section × Time Analysis" description="Recorded check-ins by section and time of day. More intense cells indicate more recorded activity, not simultaneous occupancy.">
        {noActivity ? <p className="text-sm text-gray-500">No recorded activity for this selection.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[590px] text-left text-xs">
              <thead><tr className="text-gray-500"><th className="pb-2 pr-3">Section</th>{periods.map((period) => <th key={period} className="pb-2 px-2">{period}</th>)}</tr></thead>
              <tbody>{sectionRows.map((section) => <tr key={section.id} className="border-t border-[#EEF0F5]"><th scope="row" className="py-2 pr-3 font-semibold text-[#140B63]">{section.name}</th>{periods.map((period) => {
                const value = section.periodCounts[period];
                const intensity = sectionPeriodMax ? value / sectionPeriodMax : 0;
                return <td key={period} className="p-1"><span className="flex min-h-10 items-center justify-center rounded-md text-xs font-semibold text-[#140B63]" style={{ backgroundColor: `rgba(91, 95, 199, ${0.08 + intensity * 0.35})` }} aria-label={`${section.name}, ${period}: ${value} recorded check-ins`}>{value}</span></td>;
              })}</tr>)}</tbody>
            </table>
          </div>
        )}
        {topSection && topPeriod && enoughPeakData && <p className="mt-3 text-xs text-gray-600">{topSection.names[0]} has the highest section-level recorded check-ins ({topSection.count}) in this period; activity by time is shown above.</p>}
      </ChartCard>

      <ChartCard title="Section Usage Comparison" description="Compare current seat availability with recorded check-ins and completed sessions for each section. Historical counts reflect the selected filters and are not simultaneous occupancy.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#DDE3F2] text-gray-500">
                <th className="py-2 pr-3 font-semibold">Section</th>
                <th className="px-3 py-2 font-semibold">Total Seats</th>
                <th className="px-3 py-2 font-semibold">Recorded Check-ins</th>
                <th className="px-3 py-2 font-semibold">Completed Sessions</th>
                <th className="px-3 py-2 font-semibold">Available</th>
                <th className="px-3 py-2 font-semibold">Occupied</th>
                <th className="px-3 py-2 font-semibold">Unavailable</th>
              </tr>
            </thead>
            <tbody>
              {sectionRows.map((section) => {
                const currentSeats = section.seats.reduce((counts, seat) => {
                  counts[seat.status.toLocaleLowerCase()] += 1;
                  return counts;
                }, { available: 0, occupied: 0, unavailable: 0 });
                return (
                  <tr key={section.id} className="border-b border-[#EEF0F5] last:border-0">
                    <th scope="row" className="py-3 pr-3 font-semibold text-[#140B63]">{section.name}</th>
                    <td className="px-3 py-3">{section.seats.length}</td>
                    <td className="px-3 py-3">{customRangeInvalid ? "—" : section.checkIns}</td>
                    <td className="px-3 py-3">{customRangeInvalid ? "—" : section.completed}</td>
                    <td className="px-3 py-3">{currentSeats.available}</td>
                    <td className="px-3 py-3">{currentSeats.occupied}</td>
                    <td className="px-3 py-3">{currentSeats.unavailable}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Peak Usage Analysis" description="Based on recorded Scan2Seat activity, not all library visitors.">
          {enoughPeakData ? (
            <ul className="space-y-2 text-sm text-gray-700">
              <li><span className="font-semibold text-[#140B63]">Time of day:</span> {topPeriod?.names.join(", ") ?? "No clear peak"}</li>
              <li><span className="font-semibold text-[#140B63]">Day of week:</span> {topDay?.names.join(", ") ?? "No clear peak"}</li>
              <li><span className="font-semibold text-[#140B63]">Month:</span> {topMonth?.names.map((key) => {
                const [year, month] = key.split("-");
                return `${months[Number(month) - 1]} ${year}`;
              }).join(", ") ?? "No clear peak"}</li>
              <li><span className="font-semibold text-[#140B63]">Section:</span> {topSection?.names.join(", ") ?? "No clear peak"}</li>
            </ul>
          ) : <p className="text-sm text-gray-500">Not enough recorded data to identify peak usage patterns.</p>}
        </ChartCard>
        <ChartCard title="Management Insights" description="Transparent observations calculated from the selected period's records.">
          {enoughPeakData ? (
            <ul className="space-y-2 text-sm text-gray-700">
              {topSection && <li>{topSection.names.join(", ")} has the highest recorded usage{topSection.names.length === 1 ? ` (${topSection.count} check-ins)` : ` (tied at ${topSection.count} check-ins)` } among sections.</li>}
              {topPeriod && <li>{topPeriod.names.join(", ")} has the highest recorded check-in activity by time of day.</li>}
              {highestSeat && <li>Seat {highestSeat.seatCode} is most used based on recorded sessions ({highestSeat.count}).</li>}
              {lowestRecordedSection && <li>{lowestRecordedSection.name} has the lowest recorded usage among sections with recorded sessions ({lowestRecordedSection.checkIns}).</li>}
            </ul>
          ) : <p className="text-sm text-gray-500">Not enough recorded data to generate management insights.</p>}
        </ChartCard>
      </section>

      <section aria-labelledby="detailed-usage-heading" className="min-w-0 overflow-hidden rounded-xl border border-[#DDE3F2] bg-white shadow-sm">
        <div className="border-b border-[#EEF0F5] p-4">
          <h2 id="detailed-usage-heading" className="font-bold text-[#140B63]">Detailed Usage History</h2>
          <p className="mt-1 text-xs text-gray-500">Completed sessions matching the global date, section, seat and student filters.</p>
        </div>
        {completedRecords.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
              <thead className="bg-[#FCFCFF]">
                <tr className="border-b border-[#DDE3F2] text-xs text-gray-500">
                  <th className="px-3 py-3 font-semibold">Student ID</th>
                  <th className="px-3 py-3 font-semibold">Section</th>
                  <th className="px-3 py-3 font-semibold">Seat</th>
                  <th className="px-3 py-3 font-semibold">Check-in</th>
                  <th className="px-3 py-3 font-semibold">Check-out</th>
                  <th className="px-3 py-3 font-semibold">Study Duration</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {completedRecords.map((item) => (
                  <tr key={item.id} className="border-b border-[#EEF0F5] last:border-0">
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-[#140B63]">{item.studentId ?? item.userId ?? "—"}</td>
                    <td className="px-3 py-3 text-gray-700">{item.sectionName}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-700">{item.seatCode}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-600">{formatDateTime(item.checkInTime)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-600">{formatDateTime(item.checkOutTime)}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-700">{formatDuration(item.duration)}</td>
                    <td className="px-3 py-3"><span className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-xs font-semibold text-[#1D4ED8]">Completed</span></td>
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => setSelectedSessionId(item.id)} className="min-h-9 whitespace-nowrap rounded-lg border border-[#DDE3F2] px-3 py-1.5 text-xs font-semibold text-[#140B63] hover:bg-[#F5F5FF]">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-5 text-sm text-gray-500">{noActivity ? "No recorded activity for this selection." : "No completed sessions are recorded for this selection."}</p>
        )}
      </section>

      <ChartCard title="Reports" description="Choose a reporting period for a summary based on the globally filtered shared session records.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(180px,260px)_1fr] sm:items-end">
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">
            <span>Report period</span>
            <select
              value={reportPeriod}
              onChange={(event) => {
                const nextPeriod = event.target.value;
                setReportPeriod(nextPeriod);
                setDateOption({
                  "All recorded data": "All recorded data",
                  Daily: "Today",
                  Weekly: "This week",
                  Monthly: "This month",
                  Semester: "This semester",
                  Annual: "This year",
                }[nextPeriod]);
              }}
              className="min-h-11 rounded-lg border border-[#DDE3F2] bg-white px-3 text-sm font-medium text-[#140B63]"
            >
              {reportPeriods.map((period) => <option key={period}>{period}</option>)}
            </select>
          </label>
          <p className="text-xs text-gray-500">
            Selected report: {dateOption === "All recorded data" ? "All recorded data" : `${reportStart}${reportEnd ? ` – ${reportEnd}` : ""}`}.
            {dateOption === "This semester" ? " Semester currently uses the prototype rolling six-month range." : ""}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Recorded check-ins", noActivity ? "—" : records.length],
            ["Completed sessions", noActivity ? "—" : completedRecords.length],
            ["Recorded study time", completedRecords.length ? formatDuration(completedRecords.reduce((sum, item) => sum + (item.duration ?? 0), 0)) : "Not enough recorded data"],
            ["Peak period", enoughPeakData && topPeriod ? topPeriod.names.join(", ") : "Not enough recorded data"],
          ].map(([label, value]) => <div key={label} className="rounded-lg border border-[#EEF0F5] bg-[#FCFCFF] p-3"><p className="text-sm font-bold text-[#140B63]">{value}</p><p className="mt-1 text-xs text-gray-500">{label}</p></div>)}
        </div>
        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-dashed border-[#DDE3F2] bg-[#FCFCFF] p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-600">PDF/Excel generation is not available in this frontend prototype; no file will be generated.</p>
          <button type="button" disabled title="Report export requires backend/report-generation support." className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#DDE3F2] bg-white px-3 text-sm font-semibold text-gray-400">
            <Download className="h-4 w-4" aria-hidden="true" />
            Export (coming later)
          </button>
        </div>
      </ChartCard>

      <ChartCard title="Annual Usage" description="Yearly summaries include only years and records present in the filtered shared session data.">
        {years.length ? (
          <>
            <label className="mb-4 flex items-center gap-2 text-xs font-semibold text-gray-600">
              <span>Report year</span>
              <select aria-label="Annual report year" value={selectedYear} onChange={(event) => setReportYear(event.target.value)} className="min-h-9 rounded-lg border border-[#DDE3F2] bg-white px-3 text-sm text-[#140B63]">
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
            {years.length > 1 && (
              <div className="mb-5 rounded-lg border border-[#EEF0F5] p-3">
                <p className="mb-3 text-xs font-semibold text-gray-600">Annual recorded check-ins</p>
                <BarRows
                  items={years.map((year) => ({ label: String(year), value: records.filter((item) => item.checkInDate.getFullYear() === year).length }))}
                  maxValue={Math.max(...years.map((year) => records.filter((item) => item.checkInDate.getFullYear() === year).length))}
                />
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
              <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                <div className="rounded-lg bg-[#FCFCFF] p-3"><dt className="text-gray-500">Total check-ins</dt><dd className="mt-1 font-bold text-[#140B63]">{yearRecords.length}</dd></div>
                <div className="rounded-lg bg-[#FCFCFF] p-3"><dt className="text-gray-500">Completed sessions</dt><dd className="mt-1 font-bold text-[#140B63]">{yearCompleted.length}</dd></div>
                <div className="rounded-lg bg-[#FCFCFF] p-3"><dt className="text-gray-500">Total study time</dt><dd className="mt-1 font-bold text-[#140B63]">{yearCompleted.length ? formatDuration(yearCompletedMinutes) : "Not enough recorded data"}</dd></div>
                <div className="rounded-lg bg-[#FCFCFF] p-3"><dt className="text-gray-500">Average duration</dt><dd className="mt-1 font-bold text-[#140B63]">{yearCompleted.length ? formatDuration(Math.round(yearCompletedMinutes / yearCompleted.length)) : "Not enough recorded data"}</dd></div>
                <div className="rounded-lg bg-[#FCFCFF] p-3"><dt className="text-gray-500">Most used section</dt><dd className="mt-1 font-bold text-[#140B63]">{yearRecords.length >= 2 && annualMostSection ? annualMostSection.names.join(", ") : "Not enough recorded data"}</dd></div>
                <div className="rounded-lg bg-[#FCFCFF] p-3"><dt className="text-gray-500">Peak period</dt><dd className="mt-1 font-bold text-[#140B63]">{yearRecords.length >= 2 && annualPeriods ? annualPeriods.names.join(", ") : "Not enough recorded data"}</dd></div>
                <div className="rounded-lg bg-[#FCFCFF] p-3"><dt className="text-gray-500">Most used seat</dt><dd className="mt-1 font-bold text-[#140B63]">{yearRecords.length >= 2 && annualMostSeat ? annualMostSeat.names.join(", ") : "Not enough recorded data"}</dd></div>
                <div className="rounded-lg bg-[#FCFCFF] p-3"><dt className="text-gray-500">Lowest recorded section</dt><dd className="mt-1 font-bold text-[#140B63]">{yearSections.filter((item) => item.count > 0).length > 1 && annualLeastSection ? annualLeastSection.names.join(", ") : "Not enough recorded data"}</dd></div>
              </dl>
              <div>
                <p className="mb-3 text-xs font-semibold text-gray-600">Monthly recorded check-ins · {selectedYear}</p>
                <MonthlyChart rows={months.flatMap((month, monthIndex) => {
                  const key = `${selectedYear}-${String(monthIndex + 1).padStart(2, "0")}`;
                  const count = yearRecords.filter((item) => monthKey(item.checkInTime) === key).length;
                  return count ? [{ key, label: month.slice(0, 3), count }] : [];
                })} />
              </div>
            </div>
          </>
        ) : <p className="text-sm text-gray-500">Not enough recorded data for an annual report.</p>}
        <p className="mt-4 border-t border-[#EEF0F5] pt-3 text-xs text-gray-500">
          Daily, weekly, monthly, semester and annual summaries use the current filters. File export requires backend/report-generation support.
        </p>
      </ChartCard>

      {selectedSession && (
        <SessionDetails
          item={selectedSession}
          studentName={selectedStudentName}
          onClose={() => setSelectedSessionId(null)}
        />
      )}

      <p className="flex items-start gap-2 rounded-lg border border-[#DDE3F2] bg-white p-3 text-xs text-gray-600">
        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#4B4FA3]" aria-hidden="true" />
        Usage metrics describe recorded check-ins and completed sessions only. Low recorded usage does not establish that a library space was empty; historical check-ins are not simultaneous occupancy.
      </p>
    </div>
  );
}
