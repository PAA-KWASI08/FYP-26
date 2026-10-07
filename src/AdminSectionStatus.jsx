const statusStyles = {
  Open: {
    badge: "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]",
    indicator: "bg-[#16A34A]",
  },
  Closed: {
    badge: "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
    indicator: "bg-[#DC2626]",
  },
};

export default function AdminSectionStatus({ status }) {
  const styles = statusStyles[status];

  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${styles.indicator}`} aria-hidden="true" />
      {status}
    </span>
  );
}
