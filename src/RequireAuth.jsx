import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth.js";

export default function RequireAuth({ role }) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm font-medium text-[#140B63]" role="status">
        Checking your session…
      </div>
    );
  }

  if (!session || !profile || profile.role !== role || profile.account_status !== "active") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
