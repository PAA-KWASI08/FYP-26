import libraryImage from "./assets/images/balme-library.jpg";
import scan2seat from "./assets/images/scan2seat.png";
import { useState } from "react";
import {
  Armchair,
  Users,
  Clock3,
  Home,
  MapPin,
  Bell,
  Info,
  AlertTriangle,
  QrCode,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  return (
    <div className="h-screen bg-[#F5F5F5] flex overflow-hidden">
      {/* SIDEBAR */}
      <div
        className="w-[240px] min-w-[240px] h-screen relative text-white flex flex-col justify-between p-4 bg-cover bg-center"
        style={{ backgroundImage: `url(${libraryImage})` }}
      >
        <div className="absolute inset-0 bg-[#140B63]/90" />

        <div className="relative z-10">
          <div className="mb-8">
            <div className="flex items-start gap-3">
              <h1 className="text-5xl font-bold">SLM</h1>
              <img
                src={scan2seat}
                alt="Scan2Seat"
                className="w-[68px] h-[60px] rounded-full object-cover"
              />
            </div>

            <p className="mt-2 text-sm font-medium">Student library system</p>
            <p className="text-sm font-medium text-white/70">Scan2Seat</p>

            <div className="mt-4 border-b border-white/20" />
          </div>

          <div className="flex flex-col gap-2">
            <button className="bg-[#5B5FC7] px-4 py-3 rounded-lg text-left font-semibold flex items-center gap-3">
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => navigate("/seatmap")}
              className="hover:bg-white/10 px-4 py-3 rounded-lg text-left transition flex items-center gap-3"
            >
              <MapPin className="w-5 h-5" />
              <span>Seat Map</span>
            </button>

            <button className="hover:bg-white/10 px-4 py-3 rounded-lg text-left transition flex items-center gap-3">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
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

        <button className="relative z-10 text-left hover:text-red-300 transition flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-h-0 p-2.5 sm:p-3 overflow-hidden">
        <div className="h-full flex flex-col overflow-hidden">
          {/* TOP BAR */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-[10px] uppercase tracking-[0.16em] text-[#140B63]">
                Welcome Back,
              </h2>

              <h1 className="text-2xl sm:text-3xl font-bold mt-1">Student 1</h1>
              <p className="text-gray-500 text-sm">Student ID: 22259801</p>
            </div>

            <div className="flex-none bg-[#EEEEEE] px-3 py-2 rounded-xl border w-[140px] md:w-[160px]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#140B63] text-white flex items-center justify-center text-xs font-semibold">
                  S
                </div>

                <div>
                  <h2 className="font-bold text-sm">Student 1</h2>
                  <p className="text-gray-500 text-[11px]">22259801</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 border-b border-black/30" />

          {/* STATS */}
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 items-stretch">
            <div className="min-h-[84px] bg-white p-2 rounded-xl border">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#DDE4DE] flex items-center justify-center">
                  <Armchair className="w-4 h-4 text-[#140B63]" />
                </div>

                <div>
                  <h1 className="text-xl font-bold">126</h1>
                  <h2 className="font-bold text-sm">Available Seats</h2>
                  <p className="text-gray-500 text-[10px]">Find a seat and get started</p>
                </div>
              </div>
            </div>

            <div className="min-h-[84px] bg-white p-2 rounded-xl border">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F1DADA] flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#140B63]" />
                </div>

                <div>
                  <h1 className="text-xl font-bold">74</h1>
                  <h2 className="font-bold text-sm">Occupied Seats</h2>
                  <p className="text-gray-500 text-[10px]">Currently in use</p>
                </div>
              </div>
            </div>

            <div className="min-h-[84px] bg-white p-2 rounded-xl border">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#ECE7CF] flex items-center justify-center">
                  <Clock3 className="w-4 h-4 text-[#140B63]" />
                </div>

                <div>
                  <h1 className="text-xl font-bold">0 mins</h1>
                  <h2 className="font-bold text-sm">Today's Study Time</h2>
                  <p className="text-gray-500 text-[10px]">Keep up the great work!</p>
                </div>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS + CURRENT SESSION */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 mt-2 flex-1 min-h-0">
            {/* QUICK ACTIONS */}
            <div className="bg-white p-2 rounded-xl border flex flex-col min-h-0 h-[230px]">
              <h2 className="text-sm font-bold mb-2">Quick Actions</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 auto-rows-fr flex-1 min-h-0">
                <button
                  type="button"
                  onClick={() => navigate("/seatmap")}
                  className="bg-[#E8ECE8] p-2 rounded-lg text-left transition hover:border hover:border-[#5B5FC7] h-full flex flex-col justify-between min-h-[70px]"
                >
                  <div>
                    <h3 className="font-semibold text-sm">View Seat Map</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      See available seats in real-time
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCheckedIn(true)}
                  className="bg-[#F0E8E8] p-2 rounded-lg text-left transition hover:border hover:border-[#5B5FC7] h-full flex flex-col justify-between min-h-[70px]"
                >
                  <div>
                    <h3 className="font-semibold text-sm">Check In</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Scan or enter QR code number at your seat to begin
                    </p>
                  </div>
                </button>

                <button className="bg-[#EFEDE4] p-2 rounded-lg text-left transition hover:border hover:border-[#5B5FC7] h-full flex flex-col justify-between min-h-[70px]">
                  <div>
                    <h3 className="font-semibold text-sm">My Sessions</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      View your session history and logs
                    </p>
                  </div>
                </button>

                <button className="bg-[#E7E6EC] p-2 rounded-lg text-left transition hover:border hover:border-[#5B5FC7] h-full flex flex-col justify-between min-h-[70px]">
                  <div>
                    <h3 className="font-semibold text-sm">Study History</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      View your past library metrics
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* CURRENT SESSION */}
            <div className="bg-white p-2 rounded-xl border flex flex-col min-h-0 h-[230px]">
              <div className="flex items-center justify-between pb-1">
                <h2 className="text-sm font-bold">My Current Session</h2>

                <span
                  className={`${isCheckedIn ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"} px-2 py-1 rounded-full text-[11px] font-semibold`}
                >
                  {isCheckedIn ? "Active" : "Inactive"}
                </span>
              </div>

              {isCheckedIn ? (
                <div className="space-y-2 mt-2 flex-1 flex flex-col justify-between">
                  <div className="rounded-xl bg-[#E7F8E9] p-2 border border-emerald-200">
                    <p className="text-sm font-semibold text-emerald-700">Seat: B2-14</p>
                    <p className="text-[11px] text-gray-600">Main Library · second floor</p>
                  </div>

                  <div className="rounded-xl bg-[#F8FAFC] p-2 border border-[#E5E8E5]">
                    <p className="text-[11px] text-gray-500">Time Elapsed</p>
                    <p className="text-sm font-semibold text-[#140B63]">2h 50mins</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCheckedIn(false)}
                    className="w-full rounded-lg bg-red-500 text-white py-2 text-sm font-semibold hover:bg-red-600 transition"
                  >
                    Check out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#E5E8E5] flex items-center justify-center">
                    <QrCode className="w-7 h-7 text-[#140B63]" />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">No Active Session</h3>
                    <p className="text-gray-500 mt-1 text-xs max-w-xs mx-auto">
                      Walk to any available seat and scan the QR code to check in.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ANNOUNCEMENTS */}
          <div className="bg-white p-2 rounded-xl border mt-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold">Library Announcements</h2>
              <button className="text-[#140B63] font-semibold text-[11px] hover:underline">
                View all
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="flex items-start gap-2 rounded-xl border border-[#E5E8E5] p-2 bg-[#F8FAFC]">
                <div className="w-8 h-8 rounded-xl bg-[#F0EEF8] flex items-center justify-center text-[#4C3D9A]">
                  <Info className="w-4 h-4" />
                </div>
                <p className="font-semibold text-[11px]">Group study rooms are offline for maintenance.</p>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-[#E5E8E5] p-2 bg-[#F8FAFC]">
                <div className="w-8 h-8 rounded-xl bg-[#F0EEF8] flex items-center justify-center text-[#4C3D9A]">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <p className="font-semibold text-[11px]">Silent study area rules are active.</p>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-[#E5E8E5] p-2 bg-[#F8FAFC]">
                <div className="w-8 h-8 rounded-xl bg-[#F0EEF8] flex items-center justify-center text-[#4C3D9A]">
                  <Clock3 className="w-4 h-4" />
                </div>
                <p className="font-semibold text-[11px]">Exam hours are active until 10:00 PM.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


