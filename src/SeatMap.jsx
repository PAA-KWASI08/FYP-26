import libraryImage from "./assets/images/balme-library.jpg";
import scan2seat from "./assets/images/scan2seat.png";
import { useNavigate } from "react-router-dom";
import { Armchair, Users, Bookmark, Clock3, Home, MapPin, Bell, QrCode, HelpCircle, LogOut } from "lucide-react";

export default function SeatMap() {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-[#F5F5F5] flex flex-row overflow-hidden">

      {/* SIDEBAR */}
      <div
        className="w-[240px] min-h-screen relative text-white flex flex-col justify-between p-4 bg-cover bg-center"
        style={{ backgroundImage: `url(${libraryImage})` }}
      >
        <div className="absolute inset-0 bg-[#140B63]/90"></div>

        <div className="relative z-10">

          {/* LOGO */}
          <div className="mb-10">
            <div className="flex items-start gap-3">
              <h1 className="text-6xl font-bold">SLM</h1>

              <img
                src={scan2seat}
                alt="Scan2Seat"
                className="w-17 h-15 rounded-full object-cover bg-white"
              />
            </div>

            <p className="mt-2 text-sm font-medium">
              Student library system
            </p>

            <p className="text-sm  font-medium text-white/70">
              Scan2Seat
            </p>

            <div className="mt-4 border-b border-white/20"></div>
          </div>

          {/* NAVIGATION */}
          <div className="flex flex-col gap-3">

            <button
              onClick={() => navigate("/dashboard")}
              className="hover:bg-white/10 px-4 py-3 rounded-lg text-left transition flex items-center gap-3"
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </button>

            <button className="bg-[#5B5FC7] px-4 py-3 rounded-lg text-left font-semibold flex items-center gap-3">
              <MapPin className="w-5 h-5" />
              <span>Seat Map</span>
            </button>

            <button className="hover:bg-white/10 px-4 py-3 rounded-lg text-left transition flex items-center gap-3">
              <Bell className="w-5 h-5" />
              <span>My Reservation / Notification</span>
            </button>

            <button className="hover:bg-white/10 px-4 py-3 rounded-lg text-left transition flex items-center gap-3">
              <QrCode className="w-5 h-5" />
              <span>Scan2seat Check-in</span>
            </button>

            <button className="hover:bg-white/10 px-4 py-3 rounded-lg text-left transition flex items-center gap-3">
              <Clock3 className="w-5 h-5" />
              <span>History</span>
            </button>

            <button className="hover:bg-white/10 px-4 py-3 rounded-lg text-left transition flex items-center gap-3">
              <HelpCircle className="w-5 h-5" />
              <span>Profile & Help</span>
            </button>

          </div>
        </div>

        {/* Logout */}
        <button className="relative z-10 text-left hover:text-red-300 transition flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0 px-4 py-5 md:px-6 md:py-6 overflow-y-auto">

        {/* PAGE HEADER */}
        <div className="flex items-start justify-between gap-6">

          <div className="min-w-0">
            <h2 className="text-sm text-[#140B63]">Welcome Back,</h2>

            <h1 className="text-4xl font-bold mt-2">Seat Map</h1>

            <p className="text-gray-500 mt-2">Find and reserve your preferred seat</p>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <button className="border px-3 py-2 rounded-md text-[#5B5FC7] font-medium hover:bg-[#F2F2FF] transition text-sm">
              How it works
            </button>

            <div className="bg-[#EEEEEE] rounded-md p-2 border w-auto">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#140B63] text-white flex items-center justify-center text-sm font-semibold">S</div>
                <div>
                  <h2 className="font-bold text-base">Student 1</h2>
                  <p className="text-gray-500 text-xs">22259801</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-xl border mt-6 p-5 flex flex-col sm:flex-row sm:items-center gap-4">

          <input
            type="text"
            placeholder="Search seat number..."
            className="border rounded-lg px-4 h-[45px] w-full sm:w-[280px] outline-none"
          />

          <select className="border rounded-lg px-4 h-[45px] w-full sm:w-[220px] outline-none">
            <option>Ground Floor</option>
            <option>First Floor</option>
          </select>

          <select className="border rounded-lg px-4 h-[45px] w-full sm:w-[220px] outline-none">
            <option>Silent Zone</option>
            <option>Discussion Zone</option>
            <option>Group Study Zone</option>
          </select>

          <button className="border rounded-lg px-5 h-[45px] hover:bg-[#F5F5F5] transition w-full sm:w-auto">
            Reset Filter
          </button>

        </div>

        {/* LEGEND */}
        <div className="bg-white rounded-xl border mt-5 p-5 flex flex-wrap gap-4 sm:gap-8">

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-[#DDE4DE]"></div>
            <span>Available</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-[#F1DADA]"></div>
            <span>Occupied</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-[#ECE7CF]"></div>
            <span>Reserved</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-[#5B5FC7]"></div>
            <span>Selected</span>
          </div>

        </div>

        {/* SEAT GRID */}
        <div className="bg-white rounded-xl border mt-5 p-6 md:p-8">

          <h2 className="text-center text-2xl font-bold mb-8">
            Silent Zone
          </h2>

          <div className="space-y-4">

            {seats.map((row, rowIndex) => (
              <div key={rowIndex} className="flex flex-wrap gap-3 justify-center">

                {row.map((seat) => {
                  let bgColor = "bg-[#DDE4DE]";

                  if (occupiedSeats.includes(seat)) {
                    bgColor = "bg-[#F1DADA]";
                  }

                  if (reservedSeats.includes(seat)) {
                    bgColor = "bg-[#ECE7CF]";
                  }

                  if (seat === selectedSeat) {
                    bgColor = "bg-[#5B5FC7] text-white";
                  }

                  return (
                    <button
                      key={seat}
                      className={`w-14 h-14 md:w-16 md:h-16 rounded-xl font-semibold transition hover:scale-105 ${bgColor}`}
                    >
                      {seat}
                    </button>
                  );
                })}

              </div>
            ))}

          </div>

          {/* WALKWAY */}
          <div className="mt-10 bg-[#EFEFEF] h-[60px] rounded-xl flex items-center justify-center text-gray-500 font-semibold">
            WALKWAY
          </div>

          {/* ENTRANCE */}
          <div className="mt-6 border rounded-xl h-[80px] flex items-center justify-center text-2xl font-bold">
            ↑ ENTRANCE
          </div>

        </div>

      </div>
    </div>
  );
}