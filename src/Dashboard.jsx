import libraryImage from "./assets/images/balme-library.jpg";
import scan2seat from "./assets/images/scan2seat.png";
import { Armchair, Users, Bookmark, Clock3, Home, MapPin, Bell, QrCode, HelpCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex overflow-hidden">

      {/* SIDEBAR */}
      <div
        className="w-[240px] min-h-screen relative text-white flex flex-col justify-between p-4 bg-cover bg-center"
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
      <div className="flex-1 p-6 overflow-y-auto">

        {/* TOP BAR */}
        <div className="flex flex-row flex-wrap items-start justify-between gap-4">

          <div className="min-w-0 flex-1">
            <h2 className="text-sm text-[#140B63]">
              Welcome Back,
            </h2>

            <h1 className="text-4xl font-bold mt-2">
              Student 1
            </h1>

            <p className="text-gray-500">
              Student ID: 22259801
            </p>
          </div>

          {/* Student Card */}
          <div className="flex-none bg-[#EEEEEE] px-3 py-2 rounded-md w-[150px] border">
            <div className="flex items-center justify-between gap-3">
              <div className="w-9 h-9 rounded-full bg-[#140B63] text-white flex items-center justify-center text-sm font-semibold">
                S
              </div>

              <div>
                <h2 className="font-bold text-base">
                  Student 1
                </h2>

                <p className="text-gray-500 text-xs">
                  22259801
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 border-b border-black/30"></div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">

          {/* Card */}
          <div className="bg-white p-4 rounded-xl border">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#DDE4DE] flex items-center justify-center">
                <Armchair className="w-6 h-6 text-[#140B63]" />
              </div>

              <div>
                <h1 className="text-4xl font-bold">
                  126
                </h1>

                <h2 className="font-bold text-xl">
                  Available Seats
                </h2>

                <p className="text-gray-500 text-xs">
                  Find a seat and get started
                </p>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white p-4 rounded-xl border">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#F1DADA] flex items-center justify-center">
                <Users className="w-6 h-6 text-[#140B63]" />
              </div>

              <div>
                <h1 className="text-4xl font-bold">
                  74
                </h1>

                <h2 className="font-bold text-xl">
                  Occupied Seats
                </h2>

                <p className="text-gray-500 text-xs">
                  Currently in use
                </p>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white p-4 rounded-xl border">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#ECE7CF] flex items-center justify-center">
                <Bookmark className="w-6 h-6 text-[#140B63]" />
              </div>

              <div>
                <h1 className="text-4xl font-bold">
                  10
                </h1>

                <h2 className="font-bold text-xl">
                  Reserved Seats
                </h2>

                <p className="text-gray-500 text-xs">
                  View all active bookings
                </p>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white p-4 rounded-xl border">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#DDDBE5] flex items-center justify-center">
                <Clock3 className="w-6 h-6 text-[#140B63]" />
              </div>

              <div>
                <h1 className="text-3xl font-bold">
                  2h 10m
                </h1>

                <h2 className="font-bold text-lg">
                  Today’s study time
                </h2>

                <p className="text-gray-500 text-xs">
                  Keep up the great work!
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* QUICK ACTIONS + RESERVATION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">

          {/* QUICK ACTIONS */}
          <div className="bg-white p-4 rounded-xl border">
            <h2 className="text-xl font-bold mb-3">
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <button className="bg-[#E8ECE8] p-4 rounded-lg text-left">
                <h3 className="font-bold text-base">
                  View Seat Map
                </h3>

                <p className="text-sm text-gray-500 mt-2">
                  See available seats
                </p>
              </button>

              <button className="bg-[#F0E8E8] p-4 rounded-lg text-left">
                <h3 className="font-bold text-base">
                  Reserve / Check in
                </h3>

                <p className="text-sm text-gray-500 mt-2">
                  Book/check in to seat
                </p>
              </button>

              <button className="bg-[#EFEDE4] p-4 rounded-lg text-left">
                <h3 className="font-bold text-base">
                  My Reservation
                </h3>

                <p className="text-sm text-gray-500 mt-2">
                  View or cancel booking
                </p>
              </button>

              <button className="bg-[#E7E6EC] p-4 rounded-lg text-left">
                <h3 className="font-bold text-base">
                  Study History
                </h3>

                <p className="text-sm text-gray-500 mt-2">
                  View your past activities
                </p>
              </button>

            </div>
          </div>

          {/* CURRENT RESERVATION */}
          <div className="bg-white p-4 rounded-xl border relative">

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                My Current Reservation
              </h2>

              <span className="bg-red-100 text-red-500 px-3 py-1 rounded-full text-sm font-semibold">
                Inactive
              </span>
            </div>

            <div className="flex items-start gap-3 mt-5">

              <div className="w-16 h-16 rounded-lg bg-[#E5E8E5]"></div>

              <div>
                <h3 className="text-base font-semibold">
                  No seat is currently Reserved for you.
                </h3>

                <p className="text-gray-500 mt-2 text-sm">
                  Check for available seat and book or check in.
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* ANNOUNCEMENTS */}
        <div className="bg-white p-5 rounded-xl border mt-8">

          <h2 className="text-2xl font-bold mb-3">
            Library Announcements
          </h2>

          <div className="text-gray-600 space-y-2 text-sm">
            <p>Group study rooms are not available onsite</p>
            <p>Please keep quiet and maintain cleanliness</p>
            <p>Library will close at 10:00 PM</p>
          </div>

          <button className="mt-4 text-[#140B63] font-semibold underline text-sm">
            View all announcements
          </button>

        </div>

      </div>
    </div>
  );
}