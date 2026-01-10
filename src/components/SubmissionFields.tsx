type SubmissionField = {
  label: string;
  value: string;
};

type SubmissionFieldsProps = {
  fields: SubmissionField[];
};

export default function SubmissionFields({ fields }: SubmissionFieldsProps) {
  if (!fields.length) {
    return <p className="text-sm text-slate-500">No submitted fields.</p>;
  }

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div
          key={`${field.label}-${index}`}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
        >
          <span className="text-sm font-medium text-slate-600">{field.label}</span>
          <span className="text-sm font-semibold text-slate-900 break-words">{field.value}</span>
        </div>
      ))}
    </div>
  );
}
