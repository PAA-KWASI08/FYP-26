import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Armchair,
  CheckCircle2,
  Clock3,
  Library,
  UsersRound,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import AdminSectionStatus from "./AdminSectionStatus";
import { getAdminOverview, formatAdminDuration, formatAdminTime } from "./adminData";
import { useStudentSession } from "./studentSession";

const summaryCards = [
  { key: "total", label: "Total Seats", icon: Armchair, tone: "bg-[#EEF0FA] text-[#343A78]" },
  { key: "available", label: "Available", icon: CheckCircle2, tone: "bg-[#EDF4F3] text-[#315C5B]" },
  { key: "occupied", label: "Occupied", icon: UsersRound, tone: "bg-[#F1EEFA] text-[#51427C]" },
  { key: "unavailable", label: "Unavailable", icon: AlertTriangle, tone: "bg-[#F5F1E8] text-[#66552D]" },
  { key: "openSections", label: "Open Sections", icon: Library, tone: "bg-[#EAF3FA] text-[#244A70]" },
  { key: "closedSections", label: "Closed Sections", icon: Library, tone: "bg-[#F1EEFA] text-[#51427C]" },
  { key: "activeSessions", label: "Active Sessions", icon: Clock3, tone: "bg-[#EDF4F3] text-[#315C5B]" },
  { key: "needsAttention", label: "Needs Attention", icon: AlertTriangle, tone: "bg-[#F5F1E8] text-[#66552D]" },
];

const managementActions = [
  { label: "Manage Sections", to: "/admin/sections" },
  { label: "Manage Seats", to: "/admin/seats" },
  { label: "Active Sessions", to: "/admin/active-sessions" },
  { label: "Usage & Analytics", to: "/admin/usage-analytics" },
];

function SectionCard({ section }) {
  return (
    <article className="rounded-xl border border-[#DDE3F2] bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 text-sm font-bold text-[#140B63]">{section.name}</h3>
        <AdminSectionStatus status={section.status} />
      </div>
      <p className="mt-1 text-xs text-gray-500">{section.total} total seats</p>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#EEF0F5] pt-2 text-xs">
        <p className="text-gray-500"><span className="block font-semibold text-[#140B63]">{section.available}</span>Available</p>
        <p className="text-gray-500"><span className="block font-semibold text-[#140B63]">{section.occupied}</span>Occupied</p>
        <p className="text-gray-500"><span className="block font-semibold text-[#140B63]">{section.unavailable}</span>Unavailable</p>
      </div>
    </article>
  );
}

export default function AdminDashboard() {
  const { sections, session, student } = useStudentSession();
  const [now, setNow] = useState(() => Date.now());
  const overview = getAdminOverview(sections, session, now);

  useEffect(() => {
    if (session?.sessionStatus !== "active") return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, [session?.id, session?.sessionStatus]);

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 p-3 sm:gap-5 sm:p-5">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-[#140B63] sm:text-3xl">Admin Dashboard</h2>
        <p className="text-sm text-gray-600">A management overview of recorded library seat usage.</p>
        <p className="text-xs text-gray-500">Frontend prototype values based on the project’s mock seat data; not live library statistics.</p>
      </header>

      <section aria-label="Library summary" className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        {summaryCards.map(({ key, label, icon: Icon, tone }) => (
          <article key={key} className="min-w-0 rounded-xl border border-[#DDE3F2] bg-white p-3 shadow-sm">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-bold leading-none text-[#140B63]">{overview.summary[key]}</p>
            <h3 className="mt-1 text-xs font-semibold text-gray-600">{label}</h3>
          </article>
        ))}
      </section>

      <section aria-labelledby="admin-sections-heading">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <h2 id="admin-sections-heading" className="text-lg font-bold text-[#140B63]">Library Sections</h2>
            <p className="text-xs text-gray-500">Recorded status and availability by section.</p>
          </div>
          <NavLink to="/admin/sections" className="text-sm font-semibold text-[#4B4FA3] hover:underline">
            Manage sections
          </NavLink>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {overview.sections.map((section) => <SectionCard key={section.id} section={section} />)}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <section className="min-w-0 rounded-xl border border-[#DDE3F2] bg-[#FCFCFF] p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#140B63]">Active Sessions</h2>
              <p className="text-xs text-gray-500">Seats currently recorded as occupied by active student sessions.</p>
            </div>
            <NavLink to="/admin/active-sessions" className="shrink-0 text-sm font-semibold text-[#4B4FA3] hover:underline">
              View all
            </NavLink>
          </div>
          {overview.activeSessions.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#DDE3F2] text-xs text-gray-500">
                    <th className="px-2 py-2 font-semibold">Student ID</th>
                    <th className="px-2 py-2 font-semibold">Section</th>
                    <th className="px-2 py-2 font-semibold">Seat</th>
                    <th className="px-2 py-2 font-semibold">Check-in</th>
                    <th className="px-2 py-2 font-semibold">Study time</th>
                    <th className="px-2 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.activeSessions.map((item) => (
                    <tr key={item.id} className="border-b border-[#EEF0F5] last:border-0">
                      <td className="px-2 py-3 font-medium text-[#140B63]">{student.studentId}</td>
                      <td className="px-2 py-3">{item.section}</td>
                      <td className="px-2 py-3">{item.seat}</td>
                      <td className="px-2 py-3">{formatAdminTime(item.checkInTime)}</td>
                      <td className="px-2 py-3">{formatAdminDuration(item.studyDurationMs)}</td>
                      <td className="px-2 py-3"><span className="rounded-full bg-[#E8F2EE] px-2 py-1 text-xs font-semibold text-[#315C4B]">Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#DDE3F2] bg-white px-4 py-6 text-center">
              <UsersRound className="mx-auto h-7 w-7 text-[#7A80BD]" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-[#140B63]">No active sessions</p>
              <p className="mt-1 text-xs text-gray-500">Active student sessions will appear here when recorded.</p>
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-xl border border-[#DDE3F2] bg-[#FCFCFF] p-4 shadow-sm">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-[#140B63]">Needs Attention</h2>
            <p className="text-xs text-gray-500">Extended sessions are review suggestions, not time limits.</p>
          </div>
          {overview.needsAttention.length ? (
            <ul className="space-y-2">
              {overview.needsAttention.map((item) => (
                <li key={item.id} className="rounded-lg border border-[#E5DDBF] bg-[#FBFAF5] p-3">
                  <p className="font-semibold text-[#140B63]">{item.seat} · {item.section}</p>
                  <p className="mt-1 text-sm text-gray-600">Student: {student.studentId}</p>
                  <p className="text-sm text-gray-600">Study time: {formatAdminDuration(item.studyDurationMs)}</p>
                  <p className="mt-2 text-xs font-medium text-[#66552D]">Extended session — admin review recommended</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-[#DDE3F2] bg-white px-4 py-6 text-center">
              <CheckCircle2 className="mx-auto h-7 w-7 text-[#668A78]" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-[#140B63]">No sessions need attention</p>
              <p className="mt-1 text-xs text-gray-500">Extended active sessions will be flagged for review here.</p>
            </div>
          )}
        </section>
      </div>

      <section aria-labelledby="admin-actions-heading">
        <h2 id="admin-actions-heading" className="mb-2 text-lg font-bold text-[#140B63]">Quick Management Actions</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {managementActions.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              className="rounded-lg border border-[#DDE3F2] bg-white px-3 py-2.5 text-sm font-semibold text-[#140B63] shadow-sm transition hover:border-[#C9C8EC] hover:bg-[#F8F9FF]"
            >
              {label}
            </NavLink>
          ))}
        </div>
      </section>
    </div>
  );
}
