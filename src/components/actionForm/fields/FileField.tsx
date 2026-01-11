import type { ChangeEvent } from 'react';

type FileFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  onChange: (value: File | null) => void;
  value?: File | null;
};

export default function FileField({ id, label, required, error, onChange, value }: FileFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onChange(file);
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      <input
        id={id}
        type="file"
        required={required}
        onChange={handleChange}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white"
      />
      {value ? <p className="text-xs text-slate-500">Selected: {value.name}</p> : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
