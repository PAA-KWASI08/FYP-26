import libraryImage from "./assets/images/balme-library.jpg";
import scan2seat from "./assets/images/scan2seat.png";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { useAuth } from "./useAuth";
import { prototypeStudents } from "./lib/prototypeCredentials";
import { databaseStudentIds } from "./lib/databaseStudentIds";

const databaseStudentIdSet = new Set(databaseStudentIds);

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, loading: authLoading, signIn } = useAuth();
  const [showPin, setShowPin] = useState(false);
  const [selectedRole, setSelectedRole] = useState("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [resetPreviewStep, setResetPreviewStep] = useState(0);
  const [resetUserId, setResetUserId] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetNotification, setResetNotification] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const returnTo = typeof location.state?.from === "string"
    && location.state.from.startsWith("/")
    && !location.state.from.startsWith("//")
    ? location.state.from
    : null;

  useEffect(() => {
    if (!authLoading && profile) {
      const destination = profile.role === "admin"
        ? profile.must_change_password ? "/admin/change-password" : "/admin/dashboard"
        : profile.must_change_password
          ? "/change-password"
          : returnTo ?? "/dashboard";
      navigate(destination, {
        replace: true,
        state: profile.must_change_password && returnTo ? { from: returnTo } : undefined,
      });
    }
  }, [authLoading, navigate, profile, returnTo]);

  useEffect(() => {
    if (!resetNotification) return undefined;
    const timeout = window.setTimeout(() => setResetNotification(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [resetNotification]);

  const selectRole = (role) => {
    setSelectedRole(role);

    if (role === "admin") {
      navigate("/admin");
    }
  };

  const handleForgotPin = () => {
    setLoginError("");
    setShowForgotPin(true);
    setResetPreviewStep(0);
    setResetMessage("");
    setResetNotification("");

    if (username.trim()) {
      setResetUserId(username.trim());
    }
  };

  const handleResetLink = () => {
    setResetMessage("");

    if (!/^\d{8}$/.test(resetUserId)) {
      setResetMessage("Enter a valid 8-digit Student ID.");
      return;
    }

    if (databaseStudentIdSet.has(resetUserId)) {
      setShowForgotPin(false);
      setResetNotification("Password recovery is not enabled for this account yet. Contact the library administrator.");
      return;
    }

    const student = prototypeStudents.find((item) => item.studentId === resetUserId);
    if (!student) {
      setResetMessage("That Student ID is not configured for prototype access.");
      return;
    }

    setResetPreviewStep(1);
  };

  const handleLogin = async () => {
    if (submitting || authLoading) return;

    setSubmitting(true);
    setLoginError("");
    const result = await signIn(username, password, "student");
    setSubmitting(false);
    if (!result.ok) {
      setLoginError(result.message);
      return;
    }
    navigate(
      result.profile?.must_change_password ? "/change-password" : returnTo ?? "/dashboard",
      {
        replace: true,
        state: result.profile?.must_change_password && returnTo ? { from: returnTo } : undefined,
      },
    );
  };

  return (
    <div className="min-h-screen flex flex-row relative">

      {/* BACKGROUND OVERLAY */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#140B63] via-[#140B63] to-[#140B63]/50" />

      {/* LEFT SIDE */}
      <div className="relative z-20 flex flex-col justify-center px-3 md:px-20 py-6 md:py-10 w-1/2 md:w-1/2 text-white text-sm md:text-base">

        {/* LOGO */}
        <div className="flex items-start gap-4">
          <h1 className="text-5xl md:text-6xl font-bold leading-none">SLM</h1>

          <div className="flex flex-col mt-2">
            <span className="text-sm md:text-xl font-medium">
              Student Library System
            </span>
            <span className="text-xs md:text-sm text-white/70">Scan2Seat</span>
          </div>
        </div>

        {/* WELCOME */}
        <h2 className="text-lg md:text-2xl font-bold mt-6 md:mt-16">
          Welcome Back!
        </h2>
        <p className="mt-2 max-w-md text-xs text-white/80" role="note">
          Enter your 8-digit Student ID and account password. Existing prototype accounts keep their demo PIN.
        </p>

        {/* FORM */}
        <form
          className="mt-8 flex flex-col gap-4 w-full max-w-md"
          onSubmit={(event) => {
            event.preventDefault();
            if (showForgotPin) return;
            void handleLogin();
          }}
        >

          {/* ROLE SELECTOR */}
          <div>
            <div className="flex gap-2" role="group" aria-label="Choose login role">
              <button
                type="button"
                aria-pressed={selectedRole === "student"}
                onClick={() => selectRole("student")}
                className={`flex-1 h-[40px] rounded border font-semibold transition inline-flex items-center justify-center gap-2 ${
                  selectedRole === "student"
                    ? "border-[#F47C5C] bg-[#F47C5C] text-white"
                    : "border-white/40 bg-transparent text-white hover:bg-white/10"
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  selectedRole === "student" ? "border-white bg-white text-[#F47C5C]" : "border-white/70"
                }`}>
                  {selectedRole === "student" && <Check size={13} aria-hidden="true" />}
                </span>
                Student
              </button>
              <button
                type="button"
                aria-pressed={selectedRole === "admin"}
                onClick={() => selectRole("admin")}
                className={`flex-1 h-[40px] rounded border font-semibold transition inline-flex items-center justify-center gap-2 ${
                  selectedRole === "admin"
                    ? "border-[#F47C5C] bg-[#F47C5C] text-white"
                    : "border-white/40 bg-transparent text-white hover:bg-white/10"
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  selectedRole === "admin" ? "border-white bg-white text-[#F47C5C]" : "border-white/70"
                }`}>
                  {selectedRole === "admin" && <Check size={13} aria-hidden="true" />}
                </span>
                Admin
              </button>
            </div>
          </div>

          {/* STUDENT ID */}
          <input
            type="text"
            inputMode="numeric"
            placeholder="Student ID (8 digits)"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full h-[45px] px-4 rounded border border-white/40
            bg-[#B9D9EB]/20 text-white placeholder:text-white/50
            outline-none focus:border-[#F47C5C] transition"
          />
          <div className="relative w-full">

            {/* PASSWORD */}
          <input
            type={showPin ? "text" : "password"}
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full h-[45px] px-4 pr-12 rounded border border-white/40
            bg-[#B9D9EB]/20 text-white placeholder:text-white/50
            outline-none focus:border-[#F47C5C] transition"
          />
             {/* PASSWORD VISIBILITY ICON */}
           <button
           type="button"
           onClick={() => setShowPin(!showPin)}
           className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
           >
           {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
           </button>
            </div>

            {/* LOGIN */}
            <button
              type="submit"
              disabled={submitting || authLoading}
            className="w-full h-[45px] bg-[#F47C5C]
            hover:bg-[#f26d4d] disabled:cursor-wait disabled:opacity-70 border border-white/40
            rounded text-white font-semibold transition"
          >
           {submitting ? "Signing In…" : "🔒 Log In"}
          </button>
          <button
            type="button"
            onClick={handleForgotPin}
            className="text-left text-xs font-medium text-[#E0E7FF] underline decoration-white/50 underline-offset-2 transition hover:text-white"
          >
            Forgot password / PIN?
          </button>
          {showForgotPin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#140B63]/70 p-4 backdrop-blur-sm">
              <section
                className="w-full max-w-md rounded-2xl border border-white/20 bg-[#140B63] p-5 text-left text-white shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="student-reset-title"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 id="student-reset-title" className="text-lg font-semibold">
                    {resetPreviewStep === 0
                      ? "Reset password / PIN"
                      : resetPreviewStep === 1
                        ? "Request submitted · preview"
                        : resetPreviewStep === 2
                          ? "Student account approved · preview"
                          : "Student resets password · preview"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPin(false);
                      setResetPreviewStep(0);
                    }}
                    className="rounded-full border border-white/30 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
                    aria-label="Close reset popup"
                  >
                    Close
                  </button>
                </div>
                <p className="mb-4 rounded border border-amber-200/50 bg-amber-100/10 p-2 text-xs font-semibold text-amber-100">
                  Prototype preview only. Nothing is sent, saved, or changed.
                </p>
                {resetPreviewStep === 0 && (
                  <>
                    <p className="mb-3 text-xs leading-relaxed text-white/80">
                      Preview the planned recovery flow for a prototype student account. Your request would go to the library administrator for review.
                    </p>
                    <label className="mb-2 block text-xs font-medium text-white/80">
                      Student ID
                      <input
                        type="text"
                        inputMode="numeric"
                        value={resetUserId}
                        onChange={(event) => setResetUserId(event.target.value)}
                        placeholder="Enter 8-digit Student ID"
                        className="mt-1 w-full h-[40px] rounded border border-white/30 bg-[#B9D9EB]/20 px-3 text-white placeholder:text-white/50 outline-none focus:border-[#F47C5C]"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleResetLink}
                      className="w-full h-[40px] rounded bg-[#F47C5C] font-semibold text-white hover:bg-[#f26d4d]"
                    >
                      Preview reset request
                    </button>
                  </>
                )}
                {resetPreviewStep === 1 && (
                  <div role="status">
                    <p className="text-sm font-semibold">The finished system would send this request to the library administrator for review.</p>
                    <p className="mt-2 text-xs leading-relaxed text-white/80">
                      The administrator would confirm that this is an active student account before approving password recovery.
                    </p>
                    <p className="mt-2 text-xs text-amber-100">
                      Demo only: no account was checked, no request was submitted, and no email was sent.
                    </p>
                    <button
                      type="button"
                      onClick={() => setResetPreviewStep(2)}
                      className="mt-4 w-full h-[40px] rounded bg-white font-semibold text-[#140B63] hover:bg-white/90"
                    >
                      Preview administrator approval
                    </button>
                  </div>
                )}
                {resetPreviewStep === 2 && (
                  <div role="status">
                    <p className="text-sm font-semibold">Administrator approved · preview</p>
                    <p className="mt-2 text-xs leading-relaxed text-white/80">
                      After confirming that this is an active student account, the administrator would approve the request. The system would then send a secure, time-limited password-reset link to the student's own verified email address already on the account.
                    </p>
                    <p className="mt-2 text-xs text-amber-100">
                      Demo only: no account was checked, no request was approved, and no email was sent.
                    </p>
                    <button
                      type="button"
                      onClick={() => setResetPreviewStep(3)}
                      className="mt-4 w-full h-[40px] rounded bg-white font-semibold text-[#140B63] hover:bg-white/90"
                    >
                      Preview student reset-link step
                    </button>
                  </div>
                )}
                {resetPreviewStep === 3 && (
                  <div role="status">
                    <p className="text-sm font-semibold">Student resets password · preview</p>
                    <p className="mt-2 text-xs leading-relaxed text-white/80">
                      The student would open the one-time link from their own verified email and choose a new password on the secure reset page.
                    </p>
                    <p className="mt-2 text-xs text-amber-100">
                      Demo only: the link is simulated; no email was sent and no password or PIN was changed.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPin(false);
                        setResetPreviewStep(0);
                      }}
                      className="mt-4 w-full h-[40px] rounded bg-white font-semibold text-[#140B63] hover:bg-white/90"
                    >
                      Finish preview
                    </button>
                  </div>
                )}
                {resetMessage && (
                  <p className="mt-3 text-xs text-rose-200" role="alert">{resetMessage}</p>
                )}
              </section>
            </div>
          )}
          {loginError && (
            <p className="text-sm text-center text-white" role="alert">{loginError}</p>
          )}

        </form>
      </div>

      {resetNotification && (
        <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-lg border border-white/20 bg-[#140B63] px-4 py-3 text-center text-sm text-white shadow-xl" role="status">
          {resetNotification}
        </div>
      )}

      {/* RIGHT SIDE IMAGE (responsive on all screen sizes) */}
      <div
  className="w-1/2 md:w-1/2 relative bg-cover bg-center flex-shrink-0 min-h-screen"
  style={{ backgroundImage: `url(${libraryImage})` }}
>
  <img
    src={scan2seat}
    alt="Scan2Seat"
    className="absolute bottom-2 md:bottom-6 right-2 md:right-6 w-14 md:w-28 h-8 md:h-16 rounded-full object-cover z-20"
  />
</div>

    </div>
  );
}