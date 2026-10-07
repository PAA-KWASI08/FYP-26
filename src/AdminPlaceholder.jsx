import { useLocation } from "react-router-dom";

const pageDetails = {
  "/admin/sections": {
    title: "Sections",
    description: "Section management tools will be added in the next phase.",
  },
  "/admin/seats": {
    title: "Seats",
    description: "Seat management tools will be added in the next phase.",
  },
  "/admin/active-sessions": {
    title: "Active Sessions",
    description: "Review current session records from the Admin Dashboard.",
  },
  "/admin/usage-history": {
    title: "Usage History",
    description: "Usage history tools will be added in the next phase.",
  },
};

export default function AdminPlaceholder() {
  const { pathname } = useLocation();
  const page = pageDetails[pathname] ?? pageDetails["/admin/sections"];

  return (
    <div className="p-3 sm:p-5">
      <section className="rounded-xl border border-[#DDE3F2] bg-[#FCFCFF] p-5 shadow-sm">
        <h2 className="text-lg font-bold text-[#140B63]">{page.title}</h2>
        <p className="mt-2 text-sm text-gray-600">{page.description}</p>
      </section>
    </div>
  );
}
