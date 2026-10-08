/* eslint-disable react-refresh/only-export-components */
import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StudentSessionProvider } from "./StudentSessionContext";
import { AuthProvider } from "./AuthContext.jsx";
import RequireAuth from "./RequireAuth";
import "./index.css";

const App = lazy(() => import("./App"));
const Admin = lazy(() => import("./Admin"));
const Dashboard = lazy(() => import("./Dashboard"));
const AdminSections = lazy(() => import("./AdminSections"));
const AdminSeatManagement = lazy(() => import("./AdminSeatManagement"));
const AdminAnnouncements = lazy(() => import("./AdminAnnouncements"));
const SeatMap = lazy(() => import("./SeatMap"));
const CheckIn = lazy(() => import("./CheckIn"));
const HowItWorks = lazy(() => import("./HowItWorks"));
const MySessions = lazy(() => import("./MySessions"));
const StudentProfile = lazy(() => import("./StudentProfile"));
const StudentNotifications = lazy(() => import("./StudentNotifications"));
const StudentIssueReport = lazy(() => import("./StudentIssueReport"));
const ChangePassword = lazy(() => import("./ChangePassword"));
const StudentLayout = lazy(() => import("./StudentLayout"));
const AdminLayout = lazy(() => import("./AdminLayout"));
const AdminDashboard = lazy(() => import("./AdminDashboard"));
const AdminActiveSessions = lazy(() => import("./AdminActiveSessions"));
const AdminAnalytics = lazy(() => import("./AdminAnalytics"));

ReactDOM.createRoot(document.getElementById("root")).render(
   <React.StrictMode>
      <BrowserRouter>
         <AuthProvider>
          <StudentSessionProvider>
            <Suspense fallback={<div className="p-6 text-center text-sm text-gray-600">Loading page…</div>}>
               <Routes>
                  <Route path="/" element={<App />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route element={<RequireAuth role="admin" />}>
                     <Route path="/admin/change-password" element={<ChangePassword />} />
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
                  </Route>
                  <Route element={<RequireAuth role="student" />}>
                     <Route path="/change-password" element={<ChangePassword />} />
                     <Route element={<StudentLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/sections" element={<SeatMap />} />
                        <Route path="/check-in" element={<CheckIn />} />
                        <Route path="/how-it-works" element={<HowItWorks />} />
                        <Route path="/my-sessions" element={<MySessions />} />
                        <Route path="/profile" element={<StudentProfile />} />
                        <Route path="/notifications" element={<StudentNotifications />} />
                        <Route path="/report-issue" element={<StudentIssueReport />} />
                        <Route path="/seatmap" element={<Navigate to="/sections" replace />} />
                        <Route path="/seatmap/:sectionId" element={<SeatMap />} />
                     </Route>
                  </Route>
               </Routes>
            </Suspense>
          </StudentSessionProvider>
         </AuthProvider>
      </BrowserRouter>
   </React.StrictMode>
);