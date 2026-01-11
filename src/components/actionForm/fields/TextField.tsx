import type { ChangeEvent } from 'react';

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  onChange: (value: string) => void;
};

export default function TextField({
  id,
  label,
  value,
  required,
  placeholder,
  error,
  multiline,
  onChange,
}: TextFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={handleChange}
          className="w-full min-h-[120px] rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2"
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2"
        />
      )}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
