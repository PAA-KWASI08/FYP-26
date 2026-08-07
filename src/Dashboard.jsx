import libraryImage from "./assets/images/balme-library.jpg";
import scan2seat from "./assets/images/scan2seat.png";
import { useState } from "react";
import { Armchair, Users, Clock3, Home, MapPin, Bell, Info, AlertTriangle, QrCode, HelpCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  return (
    <div className="h-screen bg-[#F5F5F5] flex overflow-hidden">

      {/* SIDEBAR */}
      <div
        className="w-[240px] h-screen relative text-white flex flex-col justify-between p-4 bg-cover bg-center"
        style={{ backgroundImage: `url(${libraryImage})` }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-[#140B63]/90"></div>

        {/* Sidebar Content */}
        <div className="relative z-10">

          {/* Logo */}
          <div className="mb-10">
            <div className="flex items-start gap-3">
              <h1 className="text-6xl font-bold">SLM</h1>

              <img
                src={scan2seat}
                alt="Scan2Seat"
                className="w-17 h-15 rounded-full object-cover"
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

          {/* Navigation */}
          <div className="flex flex-col gap-3">

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

        {/* Logout */}
        <button className="relative z-10 text-left hover:text-red-300 transition flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 h-screen p-4 overflow-hidden">

        {/* TOP BAR */}
        <div className="flex flex-col lg:flex-row flex-wrap items-start justify-between gap-3">

          <div className="min-w-0 flex-1">
            <h2 className="text-xs uppercase tracking-[0.16em] text-[#140B63]">
              Welcome Back,
            </h2>

            <h1 className="text-3xl md:text-4xl font-bold mt-1">
              Student 1
            </h1>

            <p className="text-gray-500 text-sm">
              Student ID: 22259801
            </p>
          </div>

          {/* Student Card */}
          <div className="flex-none bg-[#EEEEEE] px-3 py-2 rounded-xl w-[140px] border">
            <div className="flex items-center justify-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#140B63] text-white flex items-center justify-center text-xs font-semibold">
                S
              </div>

              <div>
                <h2 className="font-bold text-sm">
                  Student 1
                </h2>

                <p className="text-gray-500 text-[11px]">
                  22259801
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 border-b border-black/30"></div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-5">

          {/* Card */}
          <div className="bg-white p-3 rounded-xl border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#DDE4DE] flex items-center justify-center">
                <Armchair className="w-5 h-5 text-[#140B63]" />
              </div>

              <div>
                <h1 className="text-3xl font-bold">
                  126
                </h1>

                <h2 className="font-bold text-lg">
                  Available Seats
                </h2>

                <p className="text-gray-500 text-[11px]">
                  Find a seat and get started
                </p>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white p-3 rounded-xl border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F1DADA] flex items-center justify-center">
                <Users className="w-5 h-5 text-[#140B63]" />
              </div>

              <div>
                <h1 className="text-3xl font-bold">
                  74
                </h1>

                <h2 className="font-bold text-lg">
                  Occupied Seats
                </h2>

                <p className="text-gray-500 text-[11px]">
                  Currently in use
                </p>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white p-3 rounded-xl border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ECE7CF] flex items-center justify-center">
                <Clock3 className="w-5 h-5 text-[#140B63]" />
              </div>

              <div>
                <h1 className="text-3xl font-bold">
                  0 mins
                </h1>

                <h2 className="font-bold text-lg">
                  Today’s Study Time
                </h2>

                <p className="text-gray-500 text-[11px]">
                  Keep up the great work!
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* QUICK ACTIONS + CURRENT SESSION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">

          {/* QUICK ACTIONS */}
          <div className="bg-white p-2 rounded-xl border">
            <h2 className="text-lg font-bold mb-1">
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 auto-rows-fr">
              <button
                type="button"
                onClick={() => navigate("/seatmap")}
                className="bg-[#E8ECE8] p-2 rounded-xl text-left transition duration-150 hover:border hover:border-[#5B5FC7] hover:shadow-lg hover:-translate-y-0.5 h-full"
              >
                <h3 className="font-semibold text-sm">
                  View Seat Map
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  See available seats in real-time
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIsCheckedIn(true)}
                className="bg-[#F0E8E8] p-2 rounded-xl text-left transition duration-150 hover:border hover:border-[#5B5FC7] hover:shadow-lg hover:-translate-y-0.5 h-full"
              >
                <h3 className="font-semibold text-sm">
                  Check In
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  Scan or enter QR code number at your seat to begin
                </p>
              </button>

              <button className="bg-[#EFEDE4] p-2 rounded-xl text-left transition duration-150 hover:border hover:border-[#5B5FC7] hover:shadow-lg hover:-translate-y-0.5 h-full">
                <h3 className="font-semibold text-sm">
                  My Sessions
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  View your session history and logs
                </p>
              </button>

              <button className="bg-[#E7E6EC] p-2 rounded-xl text-left transition duration-150 hover:border hover:border-[#5B5FC7] hover:shadow-lg hover:-translate-y-0.5 h-full">
                <h3 className="font-semibold text-sm">
                  Study History
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  View your past library metrics
                </p>
              </button>
            </div>
          </div>

          {/* CURRENT SESSION */}
          <div className="bg-white p-2 rounded-xl border h-[300px] flex flex-col">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-lg font-bold">
                My Current Session
              </h2>

              <span className={`${isCheckedIn ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"} px-3 py-1 rounded-full text-sm font-semibold`}>
                {isCheckedIn ? "Active" : "Inactive"}
              </span>
            </div>

            {isCheckedIn ? (
              <div className="space-y-4 mt-3 h-full flex flex-col justify-between">
                <div className="rounded-2xl bg-[#E7F8E9] p-3 border border-emerald-200">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-emerald-700 font-semibold">Seat: B2-14</p>
                      <p className="text-xs text-gray-600">Main Library · second floor</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Checked in: 20 May 2026</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#F8FAFC] p-3 border border-[#E5E8E5]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Time Elapsed</p>
                      <p className="text-base font-semibold text-[#140B63]">2h 50mins</p>
                    </div>
                    <p className="text-xs text-gray-500 text-right">Checked in 10:00 AM · Limit 3h 00m</p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-[#E5E8E5] overflow-hidden">
                    <div className="h-full rounded-full bg-[#5B5FC7]" style={{ width: "80%" }}></div>
                  </div>
                </div>

                <button className="w-full rounded-lg bg-red-500 text-white py-2 font-semibold hover:bg-red-600 transition">
                  Check out
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center mt-1">
                <div className="w-20 h-20 rounded-3xl bg-[#E5E8E5] flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-[#140B63]" />
                </div>

                <div>
                  <h3 className="text-base font-semibold">
                    No Active Session
                  </h3>

                  <p className="text-gray-500 mt-2 text-sm max-w-xs mx-auto">
                    Walk to any available seat and scan the QR code to check in.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ANNOUNCEMENTS */}
        <div className="bg-white p-5 rounded-xl border mt-4">

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Library Announcements</h2>
            <button className="text-[#140B63] font-semibold text-sm hover:underline">
              View all announcements
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-2xl border border-[#E5E8E5] p-4 bg-[#F8FAFC]">
              <div className="w-11 h-11 rounded-2xl bg-[#F0EEF8] flex items-center justify-center text-[#4C3D9A]">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Group study rooms are currently offline for maintenance onsite.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-[#E5E8E5] p-4 bg-[#F8FAFC]">
              <div className="w-11 h-11 rounded-2xl bg-[#F0EEF8] flex items-center justify-center text-[#4C3D9A]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Silent study area: Please keep quiet, turn off phone ringers, and maintain cleanliness.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-[#E5E8E5] p-4 bg-[#F8FAFC]">
              <div className="w-11 h-11 rounded-2xl bg-[#F0EEF8] flex items-center justify-center text-[#4C3D9A]">
                <Clock3 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Examination hours active: Library will close late at 10:00 PM.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}