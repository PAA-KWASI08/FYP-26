import { ArrowLeft, LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getStudentInitials } from "./studentData";
import { useAuth } from "./useAuth";

function ProfileField({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg border border-[#E5E9F3] bg-white px-3 py-2.5">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-[#140B63]">{value}</dd>
    </div>
  );
}

export default function StudentProfile() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const initials = getStudentInitials(profile.full_name ?? "");
  const display = (value) => value ?? "—";

  return (
    <div className="min-h-full w-full min-w-0 bg-[#F5F5F5] p-3 sm:p-4">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <header className="flex flex-col gap-3 border-b border-black/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#140B63]">Student account</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-[#140B63] sm:text-3xl">Student Profile</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ECEBFA] px-2.5 py-1 text-xs font-semibold text-[#343A78]">
                <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
                Read-only
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-[#5B5FC7] bg-white px-4 py-2 text-sm font-semibold text-[#140B63] transition hover:bg-[#F2F2FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Dashboard
          </button>
        </header>

        <section className="flex flex-col items-center gap-3 rounded-xl border border-[#DDE3F2] bg-[#FCFCFF] p-5 text-center shadow-sm sm:flex-row sm:text-left">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#140B63] text-xl font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-[#140B63]">{display(profile.full_name)}</h2>
            <p className="mt-1 text-sm text-gray-600">Student ID: {display(profile.student_id)}</p>
          </div>
        </section>

        <p className="rounded-lg border border-[#DDE3F2] bg-white px-3 py-2.5 text-sm text-gray-600">
          Your student information is provided by the University and cannot be changed here.
        </p>

        <section className="rounded-xl border border-[#DDE3F2] bg-[#FCFCFF] p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-bold text-[#140B63]">Personal Information</h2>
          <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <ProfileField label="Full Name" value={display(profile.full_name)} />
            <ProfileField label="Student ID" value={display(profile.student_id)} />
            <ProfileField label="Programme" value={display(profile.programme)} />
            <ProfileField label="Department" value={display(profile.department)} />
            <ProfileField label="Level" value={display(profile.level)} />
          </dl>
        </section>

        <section className="rounded-xl border border-[#DDE3F2] bg-[#FCFCFF] p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-bold text-[#140B63]">Academic Information</h2>
          <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <ProfileField label="College/School" value={display(profile.college)} />
            <ProfileField label="Email" value={display(profile.email)} />
            <ProfileField label="Account Status" value={display(profile.account_status)} />
          </dl>
        </section>
      </div>
    </div>
  );
}
