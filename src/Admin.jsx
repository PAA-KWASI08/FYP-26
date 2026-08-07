import libraryImage from "./assets/images/balme-library.jpg";
import scan2seat from "./assets/images/scan2seat.png";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Admin() {
    const [showPin, setShowPin] = useState(false);

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

        {/* FORM */}
        <div className="mt-8 flex flex-col gap-4 w-full max-w-md">

            {/* EMAIL/ID*/}
          <input
            type="text"
            placeholder="Admin Email/ID"
            className="w-full h-[45px] px-4 rounded border border-white/40
            bg-[#B9D9EB]/20 text-white placeholder:text-white/50
            outline-none focus:border-[#F47C5C] transition"
          />
        <div className="relative w-full">

            {/* PASSWORD */}
          <input
            type={showPin ? "text" : "password"}
            placeholder="Password"
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

          <button className="w-full h-[45px] bg-[#F47C5C] hover:bg-[#f26d4d]
            border border-white/40 rounded text-white font-semibold transition">
            🔒 Admin Login
          </button>

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