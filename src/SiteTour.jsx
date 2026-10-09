import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, CircleHelp, X } from "lucide-react";

const tours = {
  student: [
    { path: "/dashboard", target: "student-availability", title: "Seat availability", description: "See the recorded total, available, occupied, and unavailable seats at a glance." },
    { path: "/dashboard", target: "student-current-session", title: "Your current study session", description: "When you check in, this card shows your section, seat, start time, and elapsed study time. You can check out here when you finish." },
    { path: "/dashboard", target: "student-quick-actions", title: "Quick actions", description: "Jump straight to Sections, Check In, your study history, or the Scan2Seat guide." },
    { path: "/dashboard", target: "student-announcements", title: "Dashboard announcements", description: "See the latest library update here, or open all announcements." },
    { path: "/dashboard", target: "student-profile-menu", title: "Your profile menu", description: "Open your profile, change your password, or log out." },
    { path: "/sections", target: "student-section-list", title: "Browse library sections", description: "Choose a library section to view its seat map and current availability." },
    { path: "first-student-seatmap", target: "student-seat-search", title: "Search the seat map", description: "Search for a seat by its label. The map shows whether each seat is available, occupied, or unavailable. Viewing a seat does not reserve it.", fallbackTarget: "student-section-list" },
    { path: "/check-in", target: "student-location-check", title: "Location check", description: "Check-in may require location permission and a verified position inside the library check-in area.", fallbackTarget: "student-checkin-overview" },
    { path: "/check-in", target: "student-qr-checkin", title: "Scan a seat QR code", description: "Use the scanner or your phone camera to identify the seat you are physically using. After a seat is identified, review its status, optionally set a study timer, and confirm check-in.", fallbackTarget: "student-checkin-overview" },
    { path: "/check-in", target: "student-manual-checkin", title: "Enter a seat ID", description: "If you cannot scan the QR code, enter the ID printed on the seat label and choose Find Seat. You can then review and confirm check-in.", fallbackTarget: "student-checkin-overview" },
    { path: "/my-sessions", target: "student-sessions-current", title: "Current session and check-out", description: "Review your active session and check out when you are done. If you have no active session, start one from Check In." },
    { path: "/my-sessions", target: "student-sessions-history", title: "Study history", description: "Review completed sessions and your recorded study time." },
    { path: "/notifications", target: "student-announcements-list", title: "All announcements", description: "Read current library announcements. Where shown, choose a section link to open its seat map." },
    { path: "/report-issue", target: "student-issue-form", title: "Report a library issue", description: "Choose an issue type, optionally identify the seat or location, describe the problem, and send a report to the library." },
    { path: "/how-it-works", target: "student-how-it-works", title: "Step-by-step guide", description: "Review the walk-in flow from checking availability through checking out. This guide and the tour are available whenever you need them." },
    { path: "/profile", target: "student-profile-details", title: "Your account details", description: "Review your personal, academic, and account information. Your profile details are read-only." },
    { path: "/profile", target: "student-profile-security", title: "Change your password", description: "Open Account Security to update your account password." },
  ],
  admin: [
    { path: "/admin/dashboard", target: "admin-dashboard-summary", title: "Library overview", description: "Review recorded seat counts, section status, active sessions, and items that need attention." },
    { path: "/admin/dashboard", target: "admin-dashboard-actions", title: "Quick management actions", description: "Use these shortcuts to open section, seat, session, and usage management." },
    { path: "/admin/dashboard", target: "admin-dashboard-sessions", title: "Dashboard session monitor", description: "See students currently checked in and jump to the full active-session list." },
    { path: "/admin/sections", target: "admin-section-create", title: "Add a library section", description: "Create a section and provide its name and details." },
    { path: "/admin/sections", target: "admin-section-labels", title: "Print seat QR labels", description: "Print QR labels for every library seat, or use a section card to print labels for just that section." },
    { path: "/admin/sections", target: "admin-section-filters", title: "Find and filter sections", description: "Search sections by name or ID and filter by open or closed status." },
    { path: "/admin/sections", target: "admin-section-list", title: "Manage sections", description: "Review section availability, change open/closed status, edit or remove a section, and open its seat list.", fallbackTarget: "admin-section-filters" },
    { path: "/admin/seats", target: "admin-seat-create", title: "Add a seat", description: "Create a seat in a library section. You can also print QR labels for a section or for all seats." },
    { path: "/admin/seats", target: "admin-seat-labels", title: "Print seat QR labels", description: "Print QR labels for all seats or for the currently selected section." },
    { path: "/admin/seats", target: "admin-seat-filters", title: "Find seats", description: "Search by seat ID, code, or section, then filter the list by section." },
    { path: "/admin/seats", target: "admin-seat-list", title: "Manage seats and QR codes", description: "Review seat status, open a seat to edit its details or status, regenerate its QR code, or remove the seat.", fallbackTarget: "admin-seat-filters" },
    { path: "/admin/notifications", target: "admin-announcement-create", title: "Create an announcement", description: "Write an announcement, choose its audience and schedule, then publish it for students." },
    { path: "/admin/notifications", target: "admin-announcement-list", title: "Manage announcements", description: "Edit, publish or unpublish, and delete existing announcements.", fallbackTarget: "admin-announcement-create" },
    { path: "/admin/active-sessions", target: "admin-session-filters", title: "Find active sessions", description: "Search sessions and filter by status or location. Extended sessions and geofence alerts are surfaced for review." },
    { path: "/admin/active-sessions", target: "admin-session-geofence", title: "Session and location alerts", description: "Review prolonged-session guidance and geofence status. Alerts flag students outside the library area; seats may be released automatically under the configured policy." },
    { path: "/admin/active-sessions", target: "admin-session-list", title: "Review active sessions", description: "Inspect session details and release a seat when appropriate. Session actions do not delete historical records.", fallbackTarget: "admin-session-filters" },
    { path: "/admin/usage-analytics", target: "admin-analytics-filters", title: "Filter usage reports", description: "Set a date range, section, seat, and student to focus the usage reports. A custom range lets you choose start and end dates." },
    { path: "/admin/usage-analytics", target: "admin-analytics-overview", title: "Usage overview", description: "Review recorded check-ins, completed sessions, study time, popular sections and seats, peak periods, and current occupancy." },
    { path: "/admin/usage-analytics", target: "admin-analytics-analysis", title: "Detailed usage analysis", description: "Explore section and seat comparisons, trends, session records, and available report actions." },
    { path: "/admin/usage-analytics", target: "admin-analytics-issues", title: "Student issue reports", description: "Review reports submitted by students and refresh the report list." },
    { path: "/admin/usage-analytics", target: "admin-analytics-reports", title: "Export and print reports", description: "Choose a report period, export filtered records as a CSV for Excel, or print/save a PDF report." },
    { path: "/admin/dashboard", target: "admin-password-settings", title: "Administrator account settings", description: "Use the account button in the page header to change your password. Use the sidebar to log out." },
  ],
};

function getCompletionKey(role, profileId) {
  return `slm-tour-complete:${role}:${profileId}`;
}

function getStepPath(step) {
  if (step.path !== "first-student-seatmap") return step.path;
  return document.querySelector("[data-tour-section-route]")?.getAttribute("data-tour-section-route") ?? "/sections";
}

function chooseCalloutPosition(targetRect, calloutRect) {
  const gap = 14;
  const margin = 16;
  const options = [
    { top: targetRect.top + (targetRect.height - calloutRect.height) / 2, left: targetRect.right + gap },
    { top: targetRect.top + (targetRect.height - calloutRect.height) / 2, left: targetRect.left - calloutRect.width - gap },
    { top: targetRect.bottom + gap, left: targetRect.left + (targetRect.width - calloutRect.width) / 2 },
    { top: targetRect.top - calloutRect.height - gap, left: targetRect.left + (targetRect.width - calloutRect.width) / 2 },
  ];

  return options.reduce((best, option) => {
    const left = Math.min(Math.max(margin, option.left), window.innerWidth - calloutRect.width - margin);
    const top = Math.min(Math.max(margin, option.top), window.innerHeight - calloutRect.height - margin);
    const rect = { left, top, right: left + calloutRect.width, bottom: top + calloutRect.height };
    const overlapX = Math.max(0, Math.min(rect.right, targetRect.right) - Math.max(rect.left, targetRect.left));
    const overlapY = Math.max(0, Math.min(rect.bottom, targetRect.bottom) - Math.max(rect.top, targetRect.top));
    const overlap = overlapX * overlapY;
    const distance = Math.hypot(
      rect.left + calloutRect.width / 2 - (targetRect.left + targetRect.width / 2),
      rect.top + calloutRect.height / 2 - (targetRect.top + targetRect.height / 2),
    );
    const score = overlap * 1000 + distance;
    return !best || score < best.score ? { left, top, score } : best;
  }, null);
}

export default function SiteTour({ role, profileId, expanded }) {
  const location = useLocation();
  const navigate = useNavigate();
  const calloutRef = useRef(null);
  const targetRef = useRef(null);
  const returnLocationRef = useRef(`${location.pathname}${location.search}${location.hash}`);
  const [isOpen, setIsOpen] = useState(() => {
    if (!profileId) return false;
    try {
      return window.localStorage.getItem(getCompletionKey(role, profileId)) !== "true";
    } catch (error) {
      console.error("Unable to read Scan2Seat tour progress:", error);
      return true;
    }
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [calloutPosition, setCalloutPosition] = useState(null);
  const steps = tours[role];
  const step = steps[stepIndex];

  const closeTour = useCallback(() => {
    if (profileId) {
      try {
        window.localStorage.setItem(getCompletionKey(role, profileId), "true");
      } catch (error) {
        console.error("Unable to save Scan2Seat tour progress:", error);
      }
    }
    targetRef.current = null;
    setTargetRect(null);
    setIsOpen(false);
    const returnLocation = returnLocationRef.current;
    const currentLocation = `${location.pathname}${location.search}${location.hash}`;
    if (returnLocation !== currentLocation) {
      navigate(returnLocation, { replace: true });
    }
  }, [location.hash, location.pathname, location.search, navigate, profileId, role]);

  const goToStep = useCallback((index) => {
    targetRef.current = null;
    setTargetRect(null);
    setCalloutPosition(null);
    setStepIndex(index);
    const nextStep = steps[index];
    const nextPath = getStepPath(nextStep);
    if (location.pathname !== nextPath) navigate(nextPath);
  }, [location.pathname, navigate, steps]);

  useLayoutEffect(() => {
    if (!isOpen) return undefined;

    let animationFrame;
    let attempts = 0;
    let activeTarget;

    const updatePosition = () => {
      if (!activeTarget?.isConnected) return;
      const rect = activeTarget.getBoundingClientRect();
      const nextRect = {
        top: Math.max(8, rect.top - 6),
        left: Math.max(8, rect.left - 6),
        right: Math.min(window.innerWidth - 8, rect.right + 6),
        bottom: Math.min(window.innerHeight - 8, rect.bottom + 6),
      };
      nextRect.width = nextRect.right - nextRect.left;
      nextRect.height = nextRect.bottom - nextRect.top;
      setTargetRect(nextRect);

      const callout = calloutRef.current;
      if (callout) {
        const position = chooseCalloutPosition(nextRect, callout.getBoundingClientRect());
        setCalloutPosition({ top: position.top, left: position.left });
      }
    };
    const schedulePosition = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updatePosition);
    };

    const locateTarget = () => {
      activeTarget = document.querySelector(`[data-tour-anchor="${step.target}"]`)
        ?? (step.fallbackTarget
          ? document.querySelector(`[data-tour-anchor="${step.fallbackTarget}"]`)
          : null);
      if (!activeTarget && attempts < 120) {
        attempts += 1;
        animationFrame = window.requestAnimationFrame(locateTarget);
        return;
      }
      if (!activeTarget) {
        setTargetRect(null);
        targetRef.current = null;
        return;
      }

      targetRef.current = activeTarget;
      activeTarget.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      schedulePosition();
    };

    const resizeObserver = new ResizeObserver(schedulePosition);

    locateTarget();
    if (activeTarget) resizeObserver.observe(activeTarget);
    if (calloutRef.current) resizeObserver.observe(calloutRef.current);
    window.addEventListener("resize", schedulePosition);
    window.addEventListener("scroll", schedulePosition, true);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", schedulePosition);
      window.removeEventListener("scroll", schedulePosition, true);
    };
  }, [isOpen, location.pathname, step.fallbackTarget, step.target]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeTour();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [closeTour, isOpen]);

  const startTour = () => {
    returnLocationRef.current = `${location.pathname}${location.search}${location.hash}`;
    targetRef.current = null;
    setTargetRect(null);
    setCalloutPosition(null);
    setStepIndex(0);
    setIsOpen(true);
    const firstPath = getStepPath(steps[0]);
    if (location.pathname !== firstPath) navigate(firstPath);
  };

  const finishOrAdvance = () => {
    if (stepIndex === steps.length - 1) {
      closeTour();
      return;
    }
    goToStep(stepIndex + 1);
  };

  const spotlightPath = targetRect
    ? `M0 0H${window.innerWidth}V${window.innerHeight}H0Z M${targetRect.left} ${targetRect.top}H${targetRect.right}V${targetRect.bottom}H${targetRect.left}Z`
    : null;

  return (
    <>
      <button
        type="button"
        onClick={startTour}
        aria-label="Take a tour"
        title={expanded ? undefined : "Take a tour"}
        className={`flex min-h-10 items-center rounded-lg text-sm text-white/85 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
          expanded ? "w-full gap-3 px-3" : "mx-auto w-11 justify-center"
        }`}
      >
        <CircleHelp className="h-4 w-4 shrink-0" aria-hidden="true" />
        {expanded && <span>Take a tour</span>}
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100]">
          {spotlightPath && (
            <>
              <svg
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 h-full w-full"
                viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
                preserveAspectRatio="none"
              >
                <path d={spotlightPath} fill="rgba(16, 10, 64, 0.68)" fillRule="evenodd" />
              </svg>
              <div
                aria-hidden="true"
                className="pointer-events-none fixed rounded-xl border-2 border-[#F47C5C] shadow-[0_0_0_2px_white]"
                style={{
                  top: targetRect.top,
                  left: targetRect.left,
                  width: targetRect.width,
                  height: targetRect.height,
                }}
              />
            </>
          )}
          <section
            ref={calloutRef}
            aria-labelledby="site-tour-title"
            aria-describedby="site-tour-description"
            aria-modal="true"
            role="dialog"
            className="fixed max-h-[calc(100dvh-2rem)] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-[#DDE3F2] bg-white p-5 shadow-2xl sm:p-6"
            style={calloutPosition
              ? { top: calloutPosition.top, left: calloutPosition.left }
              : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5B5FC7]">
                  {role === "admin" ? "Administrator tour" : "Student tour"} · Step {stepIndex + 1} of {steps.length}
                </p>
                <h2 id="site-tour-title" className="mt-2 text-xl font-bold text-[#140B63]">
                  {step.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeTour}
                aria-label="Skip tour"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-[#F2F2FF] hover:text-[#140B63] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <p id="site-tour-description" className="mt-3 text-sm leading-relaxed text-gray-600">
              {step.description}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={closeTour}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
              >
                Skip tour
              </button>
              <div className="ml-auto flex items-center gap-2">
                {stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => goToStep(stepIndex - 1)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#DDE3F2] px-3 py-2 text-sm font-semibold text-[#140B63] transition hover:bg-[#F8F9FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={finishOrAdvance}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#140B63] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#242080] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
                >
                  {stepIndex === steps.length - 1 ? "Finish" : "Next"}
                  {stepIndex < steps.length - 1 && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
