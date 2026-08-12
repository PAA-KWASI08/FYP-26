import libraryImage from "./assets/images/balme-library.jpg";
import scan2seat from "./assets/images/scan2seat.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  MapPin,
  Bell,
  Clock3,
  HelpCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export default function SeatMap() {
  const navigate = useNavigate();
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const seats = [
    ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10"],
    ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "B10"],
    ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10"],
    ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10"],
    ["E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "E10"],
    ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10"],
  ];

  const occupiedSeats = ["A3", "B2", "C9", "D8", "E3", "F6"];
  const reservedSeats = ["A6", "B7", "D4", "E7"];
  const selectedSeat = "C5";

  return (
    <div className="h-screen bg-[#F5F5F5] flex overflow-hidden">
      {/* SIDEBAR */}
      <div
        className={`${sidebarVisible ? "flex" : "hidden"} w-[180px] sm:w-[220px] lg:w-[240px] min-w-[180px] sm:min-w-[220px] lg:min-w-[240px] h-screen sticky top-0 relative text-white flex flex-col justify-between p-3 sm:p-4 bg-cover bg-center overflow-y-auto`}
        style={{ backgroundImage: `url(${libraryImage})` }}
      >
        <div className="absolute inset-0 bg-[#140B63]/90" />

        <div className="relative z-10">
          <div className="mb-6 sm:mb-8">
            <div className="flex items-start gap-2 sm:gap-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">SLM</h1>
              <button
                type="button"
                onClick={() => setSidebarVisible(!sidebarVisible)}
                title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition hover:bg-white/20"
              >
                {sidebarVisible ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
              <img
                src={scan2seat}
                alt="Scan2Seat"
                className="w-[54px] h-[48px] sm:w-[68px] sm:h-[60px] rounded-full object-cover"
              />

            </div>

            <p className="mt-2 text-xs sm:text-sm font-medium">Student library system</p>
            <p className="text-xs sm:text-sm font-medium text-white/70">Scan2Seat</p>

            <div className="mt-3 border-b border-white/20" />
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="hover:bg-white/10 px-3 py-2 rounded-lg text-left transition flex items-center gap-2 text-sm"
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button className="bg-[#5B5FC7] px-3 py-2 rounded-lg text-left font-semibold flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" />
              <span>Seat Map</span>
            </button>

            <button className="hover:bg-white/10 px-3 py-2 rounded-lg text-left transition flex items-center gap-2 text-sm">
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </button>

            <button className="hover:bg-white/10 px-3 py-2 rounded-lg text-left transition flex items-center gap-2 text-sm">
              <Clock3 className="w-4 h-4" />
              <span>History</span>
            </button>

            <button className="hover:bg-white/10 px-3 py-2 rounded-lg text-left transition flex items-center gap-2 text-sm">
              <HelpCircle className="w-4 h-4" />
              <span>Profile & Help</span>
            </button>
          </div>
        </div>

        <button className="relative z-10 mt-4 text-left hover:text-red-300 transition flex items-center gap-2 text-sm">
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 h-full min-h-0 p-2.5 sm:p-3 overflow-y-auto">
        <div className="h-full flex flex-col">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-[10px] uppercase tracking-[0.16em] text-[#140B63]">
                Welcome Back,
              </h2>

              <h1 className="text-2xl sm:text-3xl font-bold mt-1 truncate" title="Seat Map">Seat Map</h1>
              <p className="text-gray-500 text-sm truncate" title="Find your preferred seat">Find your preferred seat</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 min-w-0 sm:min-w-fit">
              <button className="border px-3 py-2 rounded-md text-[#5B5FC7] font-medium hover:bg-[#F2F2FF] transition text-sm whitespace-nowrap">
                How it works
              </button>

              <div className="bg-[#EEEEEE] rounded-md p-2 border flex-shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#140B63] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    S
                  </div>
                  <div className="hidden sm:block">
                    <h2 className="font-bold text-sm truncate">Student 1</h2>
                    <p className="text-gray-500 text-[11px] truncate">22259801</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 border-b border-black/30" />

          <div className="mt-2 flex-1 overflow-y-auto pr-1">
            <div className="bg-white rounded-xl border p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Search seat number..."
                className="border rounded-lg px-3 h-[40px] flex-1 sm:flex-initial sm:w-[240px] outline-none min-w-[150px]"
              />

              <select className="border rounded-lg px-3 h-[40px] flex-1 sm:flex-initial sm:w-[180px] outline-none min-w-[150px]">
                <option>Ground Floor</option>
                <option>First Floor</option>
              </select>

              <button className="border rounded-lg px-4 h-[40px] hover:bg-[#F5F5F5] transition flex-1 sm:flex-initial sm:w-auto min-w-[150px] whitespace-nowrap">
                Reset Filter
              </button>
            </div>

            <div className="bg-white rounded-xl border mt-2 p-3 sm:p-4 flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#DDE4DE] flex-shrink-0" />
                <span className="text-sm">Available</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#F1DADA] flex-shrink-0" />
                <span className="text-sm">Occupied</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#ECE7CF] flex-shrink-0" />
                <span className="text-sm">Reserved</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#5B5FC7] flex-shrink-0" />
                <span className="text-sm">Selected</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border mt-2 p-3 sm:p-4">
              <h2 className="text-center text-lg sm:text-xl font-bold mb-4 truncate">Silent Zone</h2>

              <div className="flex flex-wrap justify-center gap-1 sm:gap-2 sm:gap-2.5">
                {seats.flat().map((seat) => {
                  let bgColor = "bg-[#DDE4DE]";

                  if (occupiedSeats.includes(seat)) {
                    bgColor = "bg-[#F1DADA]";
                  } else if (reservedSeats.includes(seat)) {
                    bgColor = "bg-[#ECE7CF]";
                  } else if (seat === selectedSeat) {
                    bgColor = "bg-[#5B5FC7] text-white";
                  }

                  return (
                    <button
                      key={seat}
                      className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-lg text-xs sm:text-sm font-semibold transition hover:scale-105 ${bgColor}`}
                    >
                      {seat}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 bg-[#EFEFEF] h-[50px] rounded-xl flex items-center justify-center text-gray-500 font-semibold text-sm truncate">
                WALKWAY
              </div>

              <div className="mt-3 border rounded-xl h-[60px] flex items-center justify-center text-lg font-bold">
                ↑ ENTRANCE
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}