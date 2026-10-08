import libraryImage from "./assets/images/balme-library.jpg";
import scan2seat from "./assets/images/scan2seat.png";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { useAuth } from "./useAuth";

export default function App() {
  const navigate = useNavigate();
  const { profile, loading: authLoading, signIn } = useAuth();
  const [showPin, setShowPin] = useState(false);
  const [selectedRole, setSelectedRole] = useState("student");
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

  const selectRole = (role) => {
    setSelectedRole(role);

    if (role === "admin") {
      navigate("/admin");
    }
  };

  const handleLogin = async () => {
    setSubmitting(true);
    setLoginError("");
<<<<<<< HEAD
    const result = await signIn(username, password, "student");
=======
    const result = await signIn(email, password, "student");
>>>>>>> 493150d2c0828f1d32c652a8a8210939d5bc0637
    setSubmitting(false);
    if (!result.ok) {
      setLoginError(result.message);
      return;
    }
    navigate("/dashboard", { replace: true });
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
          Prototype login: enter an 8-digit Student ID and the shared PIN.
        </p>

        {/* FORM */}
        <div className="mt-8 flex flex-col gap-4 w-full max-w-md">

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

<<<<<<< HEAD
          {/* STUDENT ID */}
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{8}"
            aria-label="Student ID"
            placeholder="Student ID"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
=======
          {/* STUDENT EMAIL */}
          <input
            type="email"
            placeholder="Student Email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
>>>>>>> 493150d2c0828f1d32c652a8a8210939d5bc0637
            className="w-full h-[45px] px-4 rounded border border-white/40
            bg-[#B9D9EB]/20 text-white placeholder:text-white/50
            outline-none focus:border-[#F47C5C] transition"
          />
          <div className="relative w-full">

            {/* PASSWORD */}
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
            type="button"
            onClick={handleLogin}
            disabled={submitting || authLoading}
            className="w-full h-[45px] bg-[#F47C5C]
            hover:bg-[#f26d4d] disabled:cursor-wait disabled:opacity-70 border border-white/40
            rounded text-white font-semibold transition"
          >
           {submitting ? "Signing In…" : "🔒 Log In"}
          </button>
          {loginError && (
            <p className="text-sm text-center text-white" role="alert">{loginError}</p>
          )}
          
<<<<<<< HEAD
=======
           {/* FORGOT EMAIL OR PASSWORD */}
          <p 
           onClick={() => setShowForgot(true)}
           className="text-sm text-white/70 text-center hover:text-white cursor-pointer"
           >
            Forgot email or password?
          </p>
            
          {/* POP UP FORM FOR FORGOT ID*/}
          {showForgot && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">

             {/* MODAL BOX */}
             <div className="w-[90%] max-w-md bg-[#B9D9EB]/20 text-white p-6 rounded-lg border border-white/20">

             <h2 className="text-xl font-bold mb-4">
             Recover Account
             </h2>

            {/* LEVEL */}
            <select
             className="w-full h-[45px] mb-3 px-3 rounded
             bg-[#140B63] text-white border border-white/30
             outline-none focus:border-[#F47C5C] transition"
            >
            <option value="" className="bg-[#140B63] text-white">
               Select Level
            </option>
            <option value="L100" className="bg-[#140B63] text-white">
               L100
            </option>
            <option value="L200" className="bg-[#140B63] text-white">
               L200
            </option>
            <option value="L300" className="bg-[#140B63] text-white">
               L300
            </option>
            <option value="L400" className="bg-[#140B63] text-white">
               L400
            </option>
            </select>

            {/* DEPARTMENT */}
            <select
             className="w-full h-[45px] mb-3 px-3 rounded
             bg-[#140B63] text-white border border-white/30
             outline-none focus:border-[#F47C5C] transition"
>
            <option value="" className="bg-[#140B63] text-white">
             Select Department
            </option>
            <option className="bg-[#140B63] text-white">
               Computer Science
            </option>
            <option className="bg-[#140B63] text-white">
               Mathematics
            </option>
            <option className="bg-[#140B63] text-white">
               Statistics
            </option>
            <option className="bg-[#140B63] text-white">
               Geography
            </option>
            <option className="bg-[#140B63] text-white">
               Political Science
            </option>
            <option className="bg-[#140B63] text-white">
               Education
            </option>
            </select>

            {/* EMAIL OR ID */}
            <input
            type="text"
            placeholder="Enter Student ID or Email"
            maxLength={8}
            className="w-full h-[45px] mb-4 px-3 rounded bg-[#140B63] border border-white/30 outline-none"
            />

            {/* BUTTONS */}
             <div className="flex gap-3">

             <button
             className="flex-1 h-[40px] bg-[#F47C5C] rounded hover:bg-[#f26d4d]"
             >
              Submit
             </button>

             <button
             onClick={() => setShowForgot(false)}
             className="flex-1 h-[40px] border border-white/40 rounded hover:bg-white/10"
             >
             Cancel
             </button>

             </div>

             <p className="text-xs text-white/60 mt-3">
              Your request will be sent to the admin for recovery instructions.
             </p>

          </div>
          </div>
        )}

>>>>>>> 493150d2c0828f1d32c652a8a8210939d5bc0637
        </div>
      </div>

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