import type { ChangeEvent } from 'react';
import type { ActionFormFieldOption } from '../../../types/actionForm';

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  required?: boolean;
  error?: string;
  options?: Array<ActionFormFieldOption | string>;
  asRadio?: boolean;
  onChange: (value: string) => void;
};

const resolveOptionValue = (option: ActionFormFieldOption | string) =>
  typeof option === 'string' ? option : option.value ?? option.label ?? '';

const resolveOptionLabel = (option: ActionFormFieldOption | string) =>
  typeof option === 'string' ? option : option.label ?? option.value ?? '';

export default function SelectField({
  id,
  label,
  value,
  required,
  error,
  options = [],
  asRadio,
  onChange,
}: SelectFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </p>
      {asRadio ? (
        <div className="space-y-2">
          {options.map((option, index) => {
            const optionValue = resolveOptionValue(option);
            const optionLabel = resolveOptionLabel(option);
            return (
              <label key={`${id}-${index}`} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name={id}
                  value={optionValue}
                  checked={value === optionValue}
                  onChange={() => onChange(optionValue)}
                  className="h-4 w-4 text-slate-900"
                />
                {optionLabel}
              </label>
            );
          })}
        </div>
      ) : (
        <select
          id={id}
          value={value}
          required={required}
          onChange={handleChange}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white"
        >
          <option value="">Select an option</option>
          {options.map((option, index) => {
            const optionValue = resolveOptionValue(option);
            const optionLabel = resolveOptionLabel(option);
            return (
              <option key={`${id}-${index}`} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>
      )}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
