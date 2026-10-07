import { Link, useSearchParams } from "react-router-dom";
import { Bell, ChevronRight } from "lucide-react";
import StudentProfileMenu from "./StudentProfileMenu";
import { formatAnnouncementDate, getActiveAnnouncements } from "./announcementData";
import { useStudentSession } from "./studentSession";

export default function StudentNotifications() {
  const [searchParams] = useSearchParams();
  const { announcements, sections, session, student } = useStudentSession();
  const sectionId = searchParams.get("section") || session?.sectionId || null;
  const section = sections.find((item) => item.id === sectionId);
  const relevantAnnouncements = getActiveAnnouncements(announcements, sectionId);

  return (
    <div className="min-h-full w-full min-w-0 bg-[#F5F5F5] p-3 sm:p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#140B63]">Welcome Back,</p>
          <h1 className="mt-1 truncate text-2xl font-bold text-[#140B63] sm:text-3xl">{student.fullName}</h1>
          <p className="mt-1 text-sm text-gray-600">Announcements for students{section ? ` · ${section.name}` : ""}</p>
        </div>
        <StudentProfileMenu compact />
      </header>

      <section aria-labelledby="student-announcements-title" className="mt-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF0FA] text-[#343A78]">
            <Bell className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 id="student-announcements-title" className="text-lg font-bold text-[#140B63]">Announcements</h2>
            <p className="text-xs text-gray-500">Current information from the library</p>
          </div>
        </div>

        {relevantAnnouncements.length ? (
          <div className="space-y-3">
            {relevantAnnouncements.map((announcement) => {
              const announcementSection = sections.find((item) => item.id === announcement.sectionId);
              return (
                <article key={announcement.id} className="rounded-xl border border-[#DDE3F2] bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="min-w-0 break-words text-lg font-bold text-[#140B63]">{announcement.title}</h3>
                    <span className="rounded-full border border-[#DDE3F2] bg-[#FCFCFF] px-2.5 py-1 text-xs font-semibold text-[#4B4FA3]">
                      {announcement.type}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{announcement.message}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#EEF0F5] pt-3 text-xs text-gray-500">
                    <span>{formatAnnouncementDate(announcement.createdAt)}</span>
                    {announcementSection && (
                      <Link to={`/seatmap/${encodeURIComponent(announcementSection.id)}`} className="inline-flex items-center gap-1 font-semibold text-[#4B4FA3] hover:underline">
                        {announcementSection.name}
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#DDE3F2] bg-white px-4 py-10 text-center">
            <Bell className="mx-auto h-7 w-7 text-[#7A80BD]" aria-hidden="true" />
            <p className="mt-2 font-semibold text-[#140B63]">No announcements for you right now</p>
            <p className="mt-1 text-sm text-gray-500">Relevant published announcements will appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
