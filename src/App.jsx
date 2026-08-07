import libraryImage from "./assets/images/balme-library.jpg";
import scan2seat from "./assets/images/scan2seat.png";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function App() {
  const navigate = useNavigate();
  const [showPin, setShowPin] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

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

        {/* FORM */}
        <div className="mt-8 flex flex-col gap-4 w-full max-w-md">

             {/* STUDENT ID*/}
          <input
            type="text"
            placeholder="Student ID (e.g. 22259801)"
            maxLength={8}
            className="w-full h-[45px] px-4 rounded border border-white/40
            bg-[#B9D9EB]/20 text-white placeholder:text-white/50
            outline-none focus:border-[#F47C5C] transition"
          />
          <div className="relative w-full">

            {/* PIN */}
          <input
            type={showPin ? "text" : "password"}
            placeholder="PIN (5 digit password)"
            maxLength={5}
            className="w-full h-[45px] px-4 pr-12 rounded border border-white/40
            bg-[#B9D9EB]/20 text-white placeholder:text-white/50
            outline-none focus:border-[#F47C5C] transition"
          />
             {/* PIN VISIBILITY ICON */}
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
            onClick={() => navigate("/dashboard")}
            className="w-full h-[45px] bg-[#F47C5C]
            hover:bg-[#f26d4d] border border-white/40
            rounded text-white font-semibold transition"
          >
           🔒 Login
          </button>
          
           {/* FORGOT EMAIL/ID OR PIN*/}
          <p 
           onClick={() => setShowForgot(true)}
           className="text-sm text-white/70 text-center hover:text-white cursor-pointer"
           >
            Forgot Email/ID or Pin?
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

          {/* OR */}
          <div className="flex items-center">
            <div className="flex-1 h-[2px] bg-white/40" />
            <span className="mx-4 text-white/70 text-sm font-semibold">OR</span>
            <div className="flex-1 h-[2px] bg-white/40" />
          </div>

          {/* ADMIN BUTTON */}
          <button
            onClick={() => navigate("/admin")}
            className="w-full h-[45px] border border-white/40 bg-transparent
            hover:bg-white/10 text-white font-semibold rounded transition"
          >
            🔒 Login as an Admin
          </button>

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