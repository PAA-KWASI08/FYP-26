import { useState } from "react";
import { Bell, Plus, Trash2 } from "lucide-react";
import ConfirmationDialog from "./ConfirmationDialog";
import {
  formatAnnouncementDate,
  isAnnouncementExpired,
} from "./announcementData";
import { useStudentSession } from "./studentSession";

const types = [
  "General",
  "Important",
  "Section Update",
  "Maintenance",
  "System Notice",
  "Examination or Academic Activity",
];
const initialForm = {
  title: "",
  message: "",
  type: "General",
  audience: "All Students",
  sectionId: "",
  status: "Draft",
  expiryDate: "",
};

function AnnouncementForm({ form, setForm, sections, onCancel, onSubmit, editing }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <form
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        className="my-auto w-full max-w-2xl rounded-xl border border-[#DDE3F2] bg-white p-4 shadow-xl sm:p-6"
        aria-labelledby="announcement-form-heading"
        aria-describedby="announcement-form-description"
      >
        <h2 id="announcement-form-heading" className="text-xl font-bold text-[#140B63]">
          {editing ? "Edit Announcement" : "Create Announcement"}
        </h2>
        <p id="announcement-form-description" className="mt-1 text-sm text-gray-500">Share a clear update with the intended students.</p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-gray-700">Title <span aria-hidden="true">*</span></span>
            <input
              required
              maxLength={120}
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              className="min-h-11 w-full rounded-lg border border-[#DDE3F2] px-3 py-2 text-sm outline-none focus:border-[#8B8FD1] focus:ring-2 focus:ring-[#E7E8F8]"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-gray-700">Message <span aria-hidden="true">*</span></span>
            <textarea
              required
              rows={5}
              maxLength={2000}
              value={form.message}
              onChange={(event) => update("message", event.target.value)}
              className="w-full resize-y rounded-lg border border-[#DDE3F2] px-3 py-2 text-sm outline-none focus:border-[#8B8FD1] focus:ring-2 focus:ring-[#E7E8F8]"
            />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-gray-700">Type</span>
            <select
              value={form.type}
              onChange={(event) => update("type", event.target.value)}
              className="min-h-11 w-full rounded-lg border border-[#DDE3F2] bg-white px-3 py-2 text-sm outline-none focus:border-[#8B8FD1] focus:ring-2 focus:ring-[#E7E8F8]"
            >
              {types.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-gray-700">Audience</span>
            <select
              value={form.audience}
              onChange={(event) => update("audience", event.target.value)}
              className="min-h-11 w-full rounded-lg border border-[#DDE3F2] bg-white px-3 py-2 text-sm outline-none focus:border-[#8B8FD1] focus:ring-2 focus:ring-[#E7E8F8]"
            >
              <option>All Students</option>
              <option>Specific Section</option>
            </select>
          </label>
          {form.audience === "Specific Section" && (
            <label>
              <span className="mb-1 block text-sm font-semibold text-gray-700">Section <span aria-hidden="true">*</span></span>
              <select
                required
                value={form.sectionId}
                onChange={(event) => update("sectionId", event.target.value)}
                className="min-h-11 w-full rounded-lg border border-[#DDE3F2] bg-white px-3 py-2 text-sm outline-none focus:border-[#8B8FD1] focus:ring-2 focus:ring-[#E7E8F8]"
              >
                <option value="">Select a section</option>
                {sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
              </select>
            </label>
          )}
          <label>
            <span className="mb-1 block text-sm font-semibold text-gray-700">Status</span>
            <select
              value={form.status}
              onChange={(event) => update("status", event.target.value)}
              className="min-h-11 w-full rounded-lg border border-[#DDE3F2] bg-white px-3 py-2 text-sm outline-none focus:border-[#8B8FD1] focus:ring-2 focus:ring-[#E7E8F8]"
            >
              <option>Draft</option>
              <option>Published</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-gray-700">Expiry date <span className="font-normal text-gray-500">(optional)</span></span>
            <input
              type="date"
              value={form.expiryDate}
              onChange={(event) => update("expiryDate", event.target.value)}
              className="min-h-11 w-full rounded-lg border border-[#DDE3F2] bg-white px-3 py-2 text-sm outline-none focus:border-[#8B8FD1] focus:ring-2 focus:ring-[#E7E8F8]"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="min-h-11 rounded-lg border border-[#DDE3F2] px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" className="min-h-11 rounded-lg bg-[#140B63] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#251b79]">
            {editing ? "Save changes" : "Save announcement"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StatusBadge({ announcement }) {
  const expired = announcement.status === "Published" && isAnnouncementExpired(announcement);
  const label = expired ? "Expired" : announcement.status;
  const color = expired
    ? "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]"
    : announcement.status === "Published"
      ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]"
      : "border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${color}`}>{label}</span>;
}

export default function AdminAnnouncements() {
  const {
    announcements,
    sections,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  } = useStudentSession();
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState("");

  const openCreateForm = () => {
    setForm({ ...initialForm });
    setEditingId(null);
    setFormOpen(true);
    setError("");
  };

  const openEditForm = (announcement) => {
    setForm({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      audience: announcement.audience,
      sectionId: announcement.sectionId ?? "",
      status: announcement.status,
      expiryDate: announcement.expiryDate ?? "",
    });
    setEditingId(announcement.id);
    setFormOpen(true);
    setError("");
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const commitForm = () => {
    const payload = {
      ...form,
      sectionId: form.audience === "Specific Section" ? form.sectionId : null,
      expiryDate: form.expiryDate || null,
    };
    const result = editingId
      ? updateAnnouncement(editingId, payload)
      : createAnnouncement(payload);
    if (!result.ok) {
      setError(result.message);
      setConfirmation(null);
      return;
    }
    closeForm();
    setConfirmation(null);
    setError("");
  };

  const requestSave = (event) => {
    event.preventDefault();
    if (form.audience === "Specific Section" && !form.sectionId) {
      setError("Choose a section for this announcement.");
      return;
    }

    const existing = announcements.find((item) => item.id === editingId);
    const requiresConfirmation = form.status === "Published"
      || existing?.status === "Published";
    if (requiresConfirmation) {
      setConfirmation({
        kind: "save",
        title: form.status === "Published" ? "Publish this announcement?" : "Save changes?",
        message: form.status === "Published"
          ? "This announcement will become visible to the selected students."
          : "This published announcement will be updated for the selected students.",
        confirmLabel: form.status === "Published" ? "Publish" : "Save changes",
      });
      return;
    }
    commitForm();
  };

  const requestStatus = (announcement) => {
    const nextStatus = announcement.status === "Published" ? "Draft" : "Published";
    const publishing = nextStatus === "Published";
    setConfirmation({
      kind: "status",
      announcementId: announcement.id,
      status: nextStatus,
      title: publishing ? "Publish this announcement?" : "Unpublish this announcement?",
      message: publishing
        ? "This announcement will become visible to the selected students."
        : "This will remove the announcement from active student notifications.",
      confirmLabel: publishing ? "Publish" : "Unpublish",
    });
  };

  const requestDelete = (announcement) => {
    setConfirmation({
      kind: "delete",
      announcementId: announcement.id,
      title: "Delete this announcement?",
      message: "This action cannot be easily undone.",
      confirmLabel: "Delete",
    });
  };

  const confirmAction = () => {
    if (confirmation.kind === "save") {
      commitForm();
    } else if (confirmation.kind === "status") {
      const result = updateAnnouncement(confirmation.announcementId, { status: confirmation.status });
      if (!result.ok) setError(result.message);
      setConfirmation(null);
    } else if (confirmation.kind === "delete") {
      const result = deleteAnnouncement(confirmation.announcementId);
      if (!result.ok) setError(result.message);
      setConfirmation(null);
    }
  };

  const getAudienceLabel = (announcement) => announcement.audience === "All Students"
    ? "All Students"
    : sections.find((section) => section.id === announcement.sectionId)?.name ?? "Section unavailable";

  const orderedAnnouncements = [...announcements].sort(
    (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
  );

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 p-3 sm:gap-5 sm:p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#140B63] sm:text-3xl">Notifications &amp; Announcements</h2>
          <p className="mt-1 text-sm text-gray-600">Create and manage information shown to students.</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#140B63] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#251b79] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B5FC7]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create Announcement
        </button>
      </header>

      {error && (
        <p role="alert" className="rounded-lg border border-[#F0D9CE] bg-[#FBF1EC] px-3 py-2 text-sm text-[#8A4934]">
          {error}
        </p>
      )}

      <section aria-label="Announcements" className="space-y-3">
        {orderedAnnouncements.length ? orderedAnnouncements.map((announcement) => (
          <article key={announcement.id} className="rounded-xl border border-[#DDE3F2] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="break-words text-lg font-bold text-[#140B63]">{announcement.title}</h3>
                  <StatusBadge announcement={announcement} />
                </div>
                <p className="mt-1 text-sm text-gray-700">{announcement.message}</p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                  <span>{announcement.type}</span>
                  <span>Audience: {getAudienceLabel(announcement)}</span>
                  <span>Created: {formatAnnouncementDate(announcement.createdAt)}</span>
                  <span>Expires: {formatAnnouncementDate(announcement.expiryDate)}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button type="button" onClick={() => openEditForm(announcement)} className="min-h-10 rounded-lg border border-[#DDE3F2] px-3 py-2 text-sm font-semibold text-[#140B63] hover:bg-[#F8F9FF]">
                  Edit
                </button>
                <button type="button" onClick={() => requestStatus(announcement)} className="min-h-10 rounded-lg border border-[#DDE3F2] px-3 py-2 text-sm font-semibold text-[#140B63] hover:bg-[#F8F9FF]">
                  {announcement.status === "Published" ? "Unpublish" : "Publish"}
                </button>
                <button type="button" onClick={() => requestDelete(announcement)} aria-label={`Delete ${announcement.title}`} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-[#F0D9CE] px-3 py-2 text-sm font-semibold text-[#8A4934] hover:bg-[#FBF1EC]">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </button>
              </div>
            </div>
          </article>
        )) : (
          <div className="rounded-xl border border-dashed border-[#DDE3F2] bg-white px-4 py-10 text-center">
            <Bell className="mx-auto h-7 w-7 text-[#7A80BD]" aria-hidden="true" />
            <p className="mt-2 font-semibold text-[#140B63]">No announcements yet</p>
            <p className="mt-1 text-sm text-gray-500">Create an announcement to share information with students.</p>
          </div>
        )}
      </section>

      {formOpen && (
        <AnnouncementForm
          form={form}
          setForm={setForm}
          sections={sections}
          editing={Boolean(editingId)}
          onCancel={closeForm}
          onSubmit={requestSave}
        />
      )}

      {confirmation && (
        <ConfirmationDialog
          title={confirmation.title}
          message={confirmation.message}
          confirmLabel={confirmation.confirmLabel}
          onConfirm={confirmAction}
          onCancel={() => setConfirmation(null)}
        />
      )}
    </div>
  );
}
