import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Admin from "./Admin";
import Dashboard from "./Dashboard";
import SeatMap from "./SeatMap";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
   <React.StrictMode>
      <BrowserRouter>
         <Routes>
            <Route path="/" element={<App />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/seatmap" element={<SeatMap />} />
         </Routes>
      </BrowserRouter>
   </React.StrictMode>
);