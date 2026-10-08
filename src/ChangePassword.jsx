import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";

function isStrongPassword(password) {
  return password.length >= 8
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, changePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isInitialChange = profile.must_change_password;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!isStrongPassword(password)) {
      setError("Use at least 8 characters with uppercase and lowercase letters, a number, and a symbol.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const result = await changePassword(password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      const returnTo = typeof location.state?.from === "string"
        && location.state.from.startsWith("/")
        && !location.state.from.startsWith("//")
        ? location.state.from
        : null;
      navigate(
        profile.role === "admin" ? "/admin/dashboard" : returnTo ?? "/dashboard",
        { replace: true },
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F5F5] p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-xl border border-[#DDE3F2] bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#5B5FC7]">
          {profile.role === "admin" ? "Administrator account" : "Student account"}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[#140B63]">
          {isInitialChange ? "Set your personal password" : "Change your password"}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {isInitialChange
            ? "Your temporary password must be changed before using the library system."
            : "Use a unique password that you do not use for another account."}
        </p>
        <label className="mt-5 block text-sm font-semibold text-gray-700">
          New password
          <input
            required
            minLength={8}
            autoComplete="new-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-[#DDE3F2] px-3 py-2 outline-none focus:border-[#5B5FC7]"
          />
        </label>
        <label className="mt-3 block text-sm font-semibold text-gray-700">
          Confirm new password
          <input
            required
            minLength={8}
            autoComplete="new-password"
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-[#DDE3F2] px-3 py-2 outline-none focus:border-[#5B5FC7]"
          />
        </label>
        <p className="mt-3 text-xs text-gray-500">
          Use at least 8 characters, including uppercase and lowercase letters, a number, and a symbol.
        </p>
        {error && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="mt-5 min-h-11 w-full rounded-lg bg-[#140B63] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Updating…" : "Update password"}
        </button>
      </form>
    </main>
  );
}
