import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getStudentInitials } from "./studentData";
import { useAuth } from "./useAuth";

export default function StudentProfileMenu({ compact = false }) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const initials = getStudentInitials(profile.full_name ?? "");

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const openProfile = () => {
    setOpen(false);
    navigate("/profile");
  };

  const logout = async () => {
    setOpen(false);
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div
      ref={menuRef}
      className={`relative flex-shrink-0 ${
        compact ? "min-w-0 sm:min-w-fit" : "w-full sm:w-[170px] md:w-[180px]"
      }`}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={`group flex w-full items-center gap-3 border text-left transition hover:border-[#C9C8EC] hover:bg-[#F8F9FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7] ${
          compact
            ? "rounded-md bg-[#EEEEEE] p-2"
            : "rounded-xl bg-[#EEEEEE] px-3 py-3"
        }`}
      >
        <span className={`flex flex-shrink-0 items-center justify-center rounded-full bg-[#140B63] font-semibold text-white ${
          compact ? "h-8 w-8 text-sm" : "h-8 w-8 text-xs"
        }`}>
          {initials}
        </span>
        <span className={`min-w-0 flex-1 ${compact ? "hidden sm:block" : ""}`}>
          <span className="block truncate text-sm font-bold text-[#140B63]" title={profile.full_name}>
            {profile.full_name}
          </span>
          {!compact && (
            <span className="block truncate text-[11px] text-gray-500" title={profile.student_id ?? ""}>
              {profile.student_id ?? "—"}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-[#5B5FC7] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-[#DDE3F2] bg-white py-1 shadow-lg"
          role="menu"
          aria-label="Student profile menu"
        >
          <button
            type="button"
            role="menuitem"
            onClick={openProfile}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#140B63] transition hover:bg-[#F2F2FF]"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
            View Profile
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#140B63] transition hover:bg-[#F2F2FF]"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
