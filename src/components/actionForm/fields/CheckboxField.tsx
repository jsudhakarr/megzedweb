import type { ActionFormFieldOption } from '../../../types/actionForm';

type CheckboxFieldProps = {
  id: string;
  label: string;
  value: boolean | string[];
  required?: boolean;
  error?: string;
  options?: Array<ActionFormFieldOption | string>;
  onChange: (value: boolean | string[]) => void;
};

const resolveOptionValue = (option: ActionFormFieldOption | string) =>
  typeof option === 'string' ? option : option.value ?? option.label ?? '';

const resolveOptionLabel = (option: ActionFormFieldOption | string) =>
  typeof option === 'string' ? option : option.label ?? option.value ?? '';

export default function CheckboxField({
  id,
  label,
  value,
  required,
  error,
  options,
  onChange,
}: CheckboxFieldProps) {
  const optionList = options ?? [];
  const isMulti = optionList.length > 0;
  const selected = Array.isArray(value) ? value : [];

  const toggleOption = (optionValue: string) => {
    if (selected.includes(optionValue)) {
      onChange(selected.filter((entry) => entry !== optionValue));
      return;
    }
    onChange([...selected, optionValue]);
  };

  return (
    <div className="space-y-2">
      {isMulti ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">
            {label}
            {required ? <span className="text-rose-500"> *</span> : null}
          </p>
          {optionList.map((option, index) => {
            const optionValue = resolveOptionValue(option);
            const optionLabel = resolveOptionLabel(option);
            return (
              <label key={`${id}-${index}`} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selected.includes(optionValue)}
                  onChange={() => toggleOption(optionValue)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {optionLabel}
              </label>
            );
          })}
        </div>
      ) : (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <span className="font-semibold">
            {label}
            {required ? <span className="text-rose-500"> *</span> : null}
          </span>
        </label>
      )}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
