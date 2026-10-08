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
<<<<<<< HEAD
  const [username, setUsername] = useState("");
=======
  const [email, setEmail] = useState("");
>>>>>>> 493150d2c0828f1d32c652a8a8210939d5bc0637
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && profile) {
      navigate(profile.role === "admin" ? "/admin/dashboard" : "/dashboard", { replace: true });
    }
  }, [authLoading, navigate, profile]);

  const handleLogin = async () => {
    setSubmitting(true);
    setLoginError("");
<<<<<<< HEAD
    const result = await signIn(username, password, "admin");
=======
    const result = await signIn(email, password, "admin");
>>>>>>> 493150d2c0828f1d32c652a8a8210939d5bc0637
    setSubmitting(false);
    if (!result.ok) {
      setLoginError(result.message);
      return;
    }
    navigate("/admin/dashboard", { replace: true });
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
          Prototype login: use the configured Admin ID and shared PIN.
        </p>

        {/* FORM */}
        <div className="mt-8 flex flex-col gap-4 w-full max-w-md">

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

<<<<<<< HEAD
            {/* ADMIN ID */}
          <input
            type="text"
            aria-label="Admin ID"
            placeholder="Admin ID"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
=======
            {/* ADMIN EMAIL */}
          <input
            type="email"
            placeholder="Admin Email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
>>>>>>> 493150d2c0828f1d32c652a8a8210939d5bc0637
            className="w-full h-[45px] px-4 rounded border border-white/40
            bg-[#B9D9EB]/20 text-white placeholder:text-white/50
            outline-none focus:border-[#F47C5C] transition"
          />
        <div className="relative w-full">

            {/* PIN */}
          <input
            type={showPin ? "text" : "password"}
<<<<<<< HEAD
            inputMode="numeric"
            aria-label="PIN"
            placeholder="PIN"
            autoComplete="off"
=======
            placeholder="Password"
            autoComplete="current-password"
>>>>>>> 493150d2c0828f1d32c652a8a8210939d5bc0637
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
            type="button"
            onClick={handleLogin}
            disabled={submitting || authLoading}
            className="w-full h-[45px] bg-[#F47C5C] hover:bg-[#f26d4d]
            disabled:cursor-wait disabled:opacity-70 border border-white/40 rounded text-white font-semibold transition">
            {submitting ? "Signing In…" : "🔒 Admin Login"}
          </button>
          {loginError && (
            <p className="text-sm text-center text-white" role="alert">{loginError}</p>
          )}

        </div>
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