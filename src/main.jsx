import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import Admin from "./Admin";
import Dashboard from "./Dashboard";
import AdminSections from "./AdminSections";
import AdminSeatManagement from "./AdminSeatManagement";
import AdminAnnouncements from "./AdminAnnouncements";
import SeatMap from "./SeatMap";
import CheckIn from "./CheckIn";
import HowItWorks from "./HowItWorks";
import MySessions from "./MySessions";
import StudentProfile from "./StudentProfile";
import StudentNotifications from "./StudentNotifications";
import StudentLayout from "./StudentLayout";
import AdminLayout from "./AdminLayout";
import AdminDashboard from "./AdminDashboard";
import AdminActiveSessions from "./AdminActiveSessions";
import AdminAnalytics from "./AdminAnalytics";
import { StudentSessionProvider } from "./StudentSessionContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
   <React.StrictMode>
      <BrowserRouter>
         <StudentSessionProvider>
            <Routes>
               <Route path="/" element={<App />} />
               <Route path="/admin" element={<Admin />} />
               <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/sections" element={<AdminSections />} />
                  <Route path="/admin/notifications" element={<AdminAnnouncements />} />
                  <Route path="/admin/seats" element={<AdminSeatManagement />} />
                  <Route path="/admin/active-sessions" element={<AdminActiveSessions />} />
                  <Route path="/admin/usage-analytics" element={<AdminAnalytics />} />
                  <Route path="/admin/usage-history" element={<Navigate to="/admin/usage-analytics" replace />} />
                  <Route path="/admin/analytics" element={<Navigate to="/admin/usage-analytics" replace />} />
               </Route>
               <Route element={<StudentLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/sections" element={<SeatMap />} />
                  <Route path="/check-in" element={<CheckIn />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/my-sessions" element={<MySessions />} />
                  <Route path="/profile" element={<StudentProfile />} />
                  <Route path="/notifications" element={<StudentNotifications />} />
                  <Route path="/seatmap" element={<Navigate to="/sections" replace />} />
                  <Route path="/seatmap/:sectionId" element={<SeatMap />} />
               </Route>
            </Routes>
         </StudentSessionProvider>
      </BrowserRouter>
   </React.StrictMode>
);