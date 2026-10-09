import { useState } from "react";
import { AlertTriangle, CheckCircle2, Send } from "lucide-react";
import { issueReportCategories, submitStudentIssueReport } from "./lib/issueReportService";

const inputClassName = "mt-1 min-h-11 w-full rounded-lg border border-[#DDE3F2] bg-white px-3 py-2 text-sm text-[#140B63] outline-none focus:border-[#8B8FD1] focus:ring-2 focus:ring-[#E7E8F8]";

export default function StudentIssueReport() {
  const [category, setCategory] = useState(issueReportCategories[0]);
  const [seatName, setSeatName] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (details.trim().length < 5) {
      setError("Please describe the issue in at least 5 characters.");
      return;
    }

    setSaving(true);
    try {
      const result = await submitStudentIssueReport({ category, seatName, details });
      if (result.error) {
        console.error("Unable to submit student issue report:", result.error.message);
        setError("Your issue report could not be submitted. Please try again.");
        return;
      }
      setSuccess("Your report was sent to the library team. Thank you for letting us know.");
      setCategory(issueReportCategories[0]);
      setSeatName("");
      setDetails("");
    } catch (submitError) {
      console.error("Unable to request student issue report:", submitError);
      setError("Your issue report could not be submitted. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full w-full min-w-0 bg-[#F5F5F5] p-3 sm:p-4">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <header className="border-b border-black/10 pb-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#140B63]">Library feedback</p>
          <h1 className="mt-1 text-2xl font-bold text-[#140B63] sm:text-3xl">Report an Issue</h1>
          <p className="mt-1 text-sm text-gray-600">
            Let the library team know about a seat or study-space problem.
          </p>
        </header>

        <form data-tour-anchor="student-issue-form" onSubmit={submit} className="space-y-4 rounded-xl border border-[#DDE3F2] bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>Please do not include passwords or other sensitive personal information in your report.</p>
          </div>

          <label className="block text-sm font-semibold text-gray-700">
            Issue type
            <select
              required
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={inputClassName}
            >
              {issueReportCategories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>

          <label className="block text-sm font-semibold text-gray-700">
            Seat or location name <span className="font-normal text-gray-500">(optional)</span>
            <input
              type="text"
              maxLength={100}
              value={seatName}
              onChange={(event) => setSeatName(event.target.value)}
              placeholder="For example, RH-014 or Reference Hall"
              className={inputClassName}
            />
          </label>

          <label className="block text-sm font-semibold text-gray-700">
            Describe the issue
            <textarea
              required
              minLength={5}
              maxLength={2000}
              rows={5}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Tell us what happened and where it is."
              className={`${inputClassName} min-h-32 resize-y`}
            />
            <span className="mt-1 block text-right text-xs font-normal text-gray-500">{details.length}/2000</span>
          </label>

          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
          {success && (
            <p role="status" className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{success}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#140B63] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {saving ? "Sending…" : "Send report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
