import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth.js";

export default function RequireAuth({ role }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm font-medium text-[#140B63]" role="status">
        Checking your session…
      </div>
    );
  }

  if (!session || !profile || profile.role !== role || profile.account_status !== "active") {
    return (
      <Navigate
        to={role === "admin" ? "/admin" : "/"}
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    );
  }

  const passwordPath = role === "admin" ? "/admin/change-password" : "/change-password";
  if (profile.must_change_password && location.pathname !== passwordPath) {
    return (
      <Navigate
        to={passwordPath}
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }
  return <Outlet />;
}
