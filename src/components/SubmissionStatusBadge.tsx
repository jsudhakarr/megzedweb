type SubmissionStatusBadgeProps = {
  status?: string | null;
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  accepted: { label: "Accepted", className: "bg-emerald-100 text-emerald-700" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", className: "bg-slate-900 text-white" },
  cancelled: { label: "Cancelled", className: "bg-rose-100 text-rose-700" },
  rejected: { label: "Rejected", className: "bg-rose-100 text-rose-700" },
};

export default function SubmissionStatusBadge({ status }: SubmissionStatusBadgeProps) {
  const normalized = (status ?? "pending").toString().toLowerCase();
  const resolved = STATUS_STYLES[normalized] ?? {
    label: status ?? "View",
    className: "bg-slate-100 text-slate-700",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${resolved.className}`}>
      {resolved.label}
    </span>
  );
}
