import libraryImage from "./assets/images/balme-library.jpg";
import scan2seat from "./assets/images/scan2seat.png";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Eye, EyeOff } from "lucide-react";
import { useAuth } from "./useAuth";

export default function Admin() {
  const navigate = useNavigate();
  const { profile, loading: authLoading, signIn } = useAuth();
  const [showPin, setShowPin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPasswordHelp, setShowPasswordHelp] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(0);
  const [recoveryAdminId, setRecoveryAdminId] = useState("");
  const [recoveryError, setRecoveryError] = useState("");

  useEffect(() => {
    if (!authLoading && profile) {
      navigate(profile.role === "admin"
        ? profile.must_change_password ? "/admin/change-password" : "/admin/dashboard"
        : "/dashboard", { replace: true });
    }
  }, [authLoading, navigate, profile]);

  const handleLogin = async () => {
    setSubmitting(true);
    setLoginError("");
    const result = await signIn(username, password, "admin");
    setSubmitting(false);
    if (!result.ok) {
      setLoginError(result.message);
      return;
    }
    navigate(result.profile?.must_change_password
      ? "/admin/change-password"
      : "/admin/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-row relative">

      {/* OVERLAY */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#140B63] via-[#140B63] to-[#140B63]/50" />

      {/* LEFT */}
      <div className="relative z-20 flex flex-col justify-center px-3 md:px-20 py-6 md:py-10 w-1/2 md:w-1/2 text-white text-sm md:text-base">

        {/* LOGO */}
        <div className="flex items-start gap-4">
          <h1 className="text-5xl md:text-6xl font-bold">SLM</h1>

          <div className="flex flex-col mt-2">
            <span className="text-sm md:text-xl font-medium">
              Student Library System
            </span>
            <span className="text-xs md:text-sm text-white/70">Scan2Seat</span>
          </div>
        </div>

        <h2 className="text-lg md:text-2xl font-bold mt-6 md:mt-16">
          Admin Login
        </h2>
        <p className="mt-2 max-w-md text-xs text-white/80" role="note">
          Sign in with your administrator ID and password. You will set a personal password on first login.
        </p>

        {/* FORM */}
        <form
          className="mt-8 flex flex-col gap-4 w-full max-w-md"
          onSubmit={(event) => {
            event.preventDefault();
            if (!submitting && !authLoading) void handleLogin();
          }}
        >

          {/* ROLE SELECTOR */}
          <div className="flex gap-2" role="group" aria-label="Choose login role">
            <button
              type="button"
              aria-pressed="false"
              onClick={() => navigate("/")}
              className="flex-1 h-[40px] rounded border border-white/40 bg-transparent text-white font-semibold transition inline-flex items-center justify-center gap-2 hover:bg-white/10"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/70" />
              Student
            </button>
            <button
              type="button"
              aria-pressed="true"
              className="flex-1 h-[40px] rounded border border-[#F47C5C] bg-[#F47C5C] text-white font-semibold transition inline-flex items-center justify-center gap-2"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-white text-[#F47C5C]">
                <Check size={13} aria-hidden="true" />
              </span>
              Admin
            </button>
          </div>

            {/* ADMIN ID */}
          <input
            type="text"
            placeholder="Administrator ID"
            autoComplete="username"
            required
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
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full h-[45px] px-4 pr-12 rounded border border-white/40
            bg-[#B9D9EB]/20 text-white placeholder:text-white/50
            outline-none focus:border-[#F47C5C] transition"
           />
           
           {/* PASSWORD VISIBILITY ICON*/}
           <button
            type="button"
            onClick={() => setShowPin(!showPin)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
        >
           {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
           </button>
           </div>

          <button
            type="submit"
            disabled={submitting || authLoading}
            className="w-full h-[45px] bg-[#F47C5C] hover:bg-[#f26d4d]
            disabled:cursor-wait disabled:opacity-70 border border-white/40 rounded text-white font-semibold transition">
            {submitting ? "Signing In…" : "🔒 Admin Login"}
          </button>
          <button
            type="button"
            aria-expanded={showPasswordHelp}
            aria-controls="admin-password-help"
            onClick={() => {
              setShowPasswordHelp((visible) => {
                if (!visible) {
                  setRecoveryAdminId(username.trim());
                  setRecoveryError("");
                  setRecoveryStep(0);
                }
                return !visible;
              });
            }}
            className="self-center text-sm font-semibold text-white underline underline-offset-4 hover:text-white/80"
          >
            Forgot password?
          </button>
          {showPasswordHelp && (
            <section
              id="admin-password-help"
              className="rounded-lg border border-white/30 bg-white/10 p-3 text-sm leading-relaxed text-white"
            >
              <p className="mb-3 rounded border border-amber-200/50 bg-amber-100/10 p-2 text-xs font-semibold text-amber-100">
                Prototype preview only. Nothing is sent, saved, or changed.
              </p>
              {recoveryStep === 0 && (
                <>
                  <h3 className="font-semibold">Request an administrator password reset</h3>
                  <p className="mt-1 text-xs text-white/80">
                    In the finished system, this request will go to one super-admin mailbox. The super-admin will check that the ID belongs to an active administrator before approving recovery. Every admin account must have its own verified recovery email.
                  </p>
                  <label className="mt-3 block text-xs font-semibold" htmlFor="recovery-admin-id">
                    Administrator ID
                  </label>
                  <input
                    id="recovery-admin-id"
                    type="text"
                    autoComplete="username"
                    value={recoveryAdminId}
                    onChange={(event) => {
                      setRecoveryAdminId(event.target.value);
                      setRecoveryError("");
                    }}
                    className="mt-1 h-10 w-full rounded border border-white/40 bg-[#B9D9EB]/20 px-3 text-sm text-white placeholder:text-white/50 outline-none focus:border-[#F47C5C]"
                    placeholder="Administrator ID"
                  />
                  {recoveryError && <p className="mt-2 text-xs text-rose-200" role="alert">{recoveryError}</p>}
                  <button
                    type="button"
                    onClick={() => {
                      if (!/^[a-zA-Z0-9_-]{3,32}$/.test(recoveryAdminId.trim())) {
                        setRecoveryError("Enter a valid administrator ID to preview the flow.");
                        return;
                      }
                      setRecoveryError("");
                      setRecoveryStep(1);
                    }}
                    className="mt-3 min-h-10 w-full rounded bg-white px-3 py-2 text-sm font-semibold text-[#140B63] hover:bg-white/90"
                  >
                    Preview reset request
                  </button>
                </>
              )}
              {recoveryStep === 1 && (
                <div role="status">
                  <h3 className="font-semibold">Request submitted · preview</h3>
                  <p className="mt-1 text-xs text-white/80">
                    The finished system would notify the super-admin mailbox. The super-admin would review the request and confirm that this ID belongs to an active administrator before approving a reset.
                  </p>
                  <p className="mt-2 text-xs text-amber-100">
                    Demo only: no request was actually submitted, no account was checked, and no email was sent.
                  </p>
                  <button
                    type="button"
                    onClick={() => setRecoveryStep(2)}
                    className="mt-3 min-h-10 w-full rounded bg-white px-3 py-2 text-sm font-semibold text-[#140B63] hover:bg-white/90"
                  >
                    Preview super-admin approval
                  </button>
                  <button type="button" onClick={() => setRecoveryStep(0)} className="mt-2 w-full py-1 text-xs underline underline-offset-2">
                    Back
                  </button>
                </div>
              )}
              {recoveryStep === 2 && (
                <div role="status">
                  <h3 className="font-semibold">Super-admin approved · preview</h3>
                  <p className="mt-1 text-xs text-white/80">
                    After confirming the account is an active admin, the super-admin would approve the reset. The system would send a secure, time-limited password-reset link to that admin’s own verified recovery email—not to the shared super-admin mailbox.
                  </p>
                  <p className="mt-2 text-xs text-amber-100">
                    Demo only: no account was checked, no reset was approved, and no email was sent.
                  </p>
                  <button
                    type="button"
                    onClick={() => setRecoveryStep(3)}
                    className="mt-3 min-h-10 w-full rounded bg-white px-3 py-2 text-sm font-semibold text-[#140B63] hover:bg-white/90"
                  >
                    Preview admin reset-link step
                  </button>
                </div>
              )}
              {recoveryStep === 3 && (
                <div role="status">
                  <h3 className="font-semibold">Admin resets password · preview</h3>
                  <p className="mt-1 text-xs text-white/80">
                    The admin would open the one-time link from their own verified email and choose a new password on the secure reset page. No temporary password needs to be shared.
                  </p>
                  <p className="mt-2 text-xs text-amber-100">
                    Demo only: the link is simulated; no email was sent and no password was changed.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryStep(0);
                      setShowPasswordHelp(false);
                    }}
                    className="mt-3 min-h-10 w-full rounded bg-white px-3 py-2 text-sm font-semibold text-[#140B63] hover:bg-white/90"
                  >
                    Finish preview
                  </button>
                </div>
              )}
            </section>
          )}
          {loginError && (
            <p className="text-sm text-center text-white" role="alert">{loginError}</p>
          )}

        </form>
      </div>

      {/* RIGHT IMAGE (responsive on all screen sizes) */}
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