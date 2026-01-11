import type { FormEvent, CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { fetchFields, submitAction, type ApiError } from '../../services/actionForms';
import type { ActionFormField, ActionFormValues } from '../../types/actionForm';
import Toast from '../ui/Toast';
import CheckboxField from './fields/CheckboxField';
import DateField from './fields/DateField';
import DateTimeField from './fields/DateTimeField';
import FileField from './fields/FileField';
import NumberField from './fields/NumberField';
import SelectField from './fields/SelectField';
import TextField from './fields/TextField';
import TimeField from './fields/TimeField';

const normalizeType = (type?: string) => (type ?? 'text').toLowerCase();

const formatValueForSubmit = (field: ActionFormField, value: ActionFormValues[number]) => {
  const type = normalizeType(field.type);

  if (type === 'datetime' && typeof value === 'string') {
    return value.replace('T', ' ');
  }

  return value;
};

const buildInitialValues = (fields: ActionFormField[]) => {
  const initial: ActionFormValues = {};
  fields.forEach((field) => {
    const type = normalizeType(field.type);
    if (type === 'checkbox') {
      initial[field.id] = field.options?.length ? [] : false;
    } else if (type === 'file') {
      initial[field.id] = null;
    } else {
      initial[field.id] = '';
    }
  });
  return initial;
};

const mapFieldErrors = (errors?: Record<string, string[]>) => {
  const mapped: Record<number, string> = {};
  if (!errors) return mapped;

  Object.entries(errors).forEach(([key, messages]) => {
    const match = key.match(/(\d+)/);
    if (!match) return;
    const fieldId = Number(match[1]);
    if (!Number.isNaN(fieldId)) {
      mapped[fieldId] = messages?.[0] ?? 'Invalid value';
    }
  });

  return mapped;
};

const useActionFormSchema = (categoryId: number) => {
  const [fields, setFields] = useState<ActionFormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchema = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const schema = await fetchFields(categoryId);
      setFields(schema.fields ?? []);
    } catch (loadError) {
      console.error('Failed to load action form schema', loadError);
      setError('Unable to load the action form. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    loadSchema();
  }, [loadSchema]);

  return { fields, loading, error, reload: loadSchema };
};

type ActionFormRendererProps = {
  itemId: number;
  categoryId: number;
  actionCode: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function ActionFormRenderer({
  itemId,
  categoryId,
  actionCode,
  onSuccess,
  onCancel,
}: ActionFormRendererProps) {
  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || '#0ea5e9';
  const [values, setValues] = useState<ActionFormValues>({});
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);
  const { fields, loading, error: schemaError } = useActionFormSchema(categoryId);

  useEffect(() => {
    setValues(buildInitialValues(fields));
    setFieldErrors({});
  }, [fields]);

  const updateValue = useCallback((fieldId: number, value: ActionFormValues[number]) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setFieldErrors((prev) => ({ ...prev, [fieldId]: '' }));
  }, []);

  const validate = () => {
    const errors: Record<number, string> = {};

    fields.forEach((field) => {
      if (!field.required) return;
      const value = values[field.id];
      const type = normalizeType(field.type);

      if (type === 'checkbox') {
        if (Array.isArray(value)) {
          if (value.length === 0) errors[field.id] = 'Select at least one option.';
        } else if (!value) {
          errors[field.id] = 'This field is required.';
        }
        return;
      }

      if (type === 'file') {
        if (!(value instanceof File)) {
          errors[field.id] = 'Please upload a file.';
        }
        return;
      }

      if (value === undefined || value === null || String(value).trim() === '') {
        errors[field.id] = 'This field is required.';
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setToast(null);
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const normalizedValues: ActionFormValues = {};
      fields.forEach((field) => {
        normalizedValues[field.id] = formatValueForSubmit(field, values[field.id]);
      });

      await submitAction(itemId, {
        action_code: actionCode,
        values: normalizedValues,
      });

      setToast({ message: 'Submitted successfully.', variant: 'success' });
      onSuccess?.();
    } catch (error) {
      const apiError = error as ApiError;
      const mappedErrors = mapFieldErrors(apiError.fieldErrors);
      if (Object.keys(mappedErrors).length > 0) setFieldErrors(mappedErrors);
      setToast({
        message: apiError.message || 'Submission failed. Please try again.',
        variant: 'error',
      });
      setSubmitError(apiError.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((skeleton) => (
            <div key={skeleton} className="space-y-2">
              <div className="h-4 w-40 rounded bg-slate-200" />
              <div className="h-10 w-full rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      );
    }

    if (schemaError || submitError) {
      return (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {schemaError || submitError}
        </div>
      );
    }

    if (fields.length === 0) {
      return (
        <p className="text-sm text-slate-600">
          No additional fields are required. Submit to send your request.
        </p>
      );
    }

    return (
      <div className="space-y-5">
        {fields.map((field) => {
          const type = normalizeType(field.type);
          const label = field.label || field.name || field.code || 'Field';
          const error = fieldErrors[field.id];

          if (type === 'textarea' || type === 'long_text') {
            return (
              <TextField
                key={field.id}
                id={`field-${field.id}`}
                label={label}
                value={String(values[field.id] ?? '')}
                required={Boolean(field.required)}
                error={error}
                multiline
                onChange={(value) => updateValue(field.id, value)}
              />
            );
          }

          if (type === 'number') {
            return (
              <NumberField
                key={field.id}
                id={`field-${field.id}`}
                label={label}
                value={String(values[field.id] ?? '')}
                required={Boolean(field.required)}
                error={error}
                onChange={(value) => updateValue(field.id, value)}
              />
            );
          }

          if (type === 'select' || type === 'dropdown') {
            return (
              <SelectField
                key={field.id}
                id={`field-${field.id}`}
                label={label}
                value={String(values[field.id] ?? '')}
                required={Boolean(field.required)}
                error={error}
                options={field.options}
                onChange={(value) => updateValue(field.id, value)}
              />
            );
          }

          if (type === 'radio') {
            return (
              <SelectField
                key={field.id}
                id={`field-${field.id}`}
                label={label}
                value={String(values[field.id] ?? '')}
                required={Boolean(field.required)}
                error={error}
                options={field.options}
                asRadio
                onChange={(value) => updateValue(field.id, value)}
              />
            );
          }

          if (type === 'checkbox') {
            return (
              <CheckboxField
                key={field.id}
                id={`field-${field.id}`}
                label={label}
                value={
                  Array.isArray(values[field.id])
                    ? (values[field.id] as string[])
                    : Boolean(values[field.id])
                }
                required={Boolean(field.required)}
                error={error}
                options={field.options}
                onChange={(value) => updateValue(field.id, value)}
              />
            );
          }

          if (type === 'date') {
            return (
              <DateField
                key={field.id}
                id={`field-${field.id}`}
                label={label}
                value={String(values[field.id] ?? '')}
                required={Boolean(field.required)}
                error={error}
                onChange={(value) => updateValue(field.id, value)}
              />
            );
          }

          if (type === 'time') {
            return (
              <TimeField
                key={field.id}
                id={`field-${field.id}`}
                label={label}
                value={String(values[field.id] ?? '')}
                required={Boolean(field.required)}
                error={error}
                onChange={(value) => updateValue(field.id, value)}
              />
            );
          }

          if (type === 'datetime') {
            return (
              <DateTimeField
                key={field.id}
                id={`field-${field.id}`}
                label={label}
                value={String(values[field.id] ?? '')}
                required={Boolean(field.required)}
                error={error}
                onChange={(value) => updateValue(field.id, value)}
              />
            );
          }

          if (type === 'file') {
            return (
              <FileField
                key={field.id}
                id={`field-${field.id}`}
                label={label}
                required={Boolean(field.required)}
                error={error}
                value={values[field.id] as File | null}
                onChange={(value) => updateValue(field.id, value)}
              />
            );
          }

          return (
            <TextField
              key={field.id}
              id={`field-${field.id}`}
              label={label}
              value={String(values[field.id] ?? '')}
              required={Boolean(field.required)}
              error={error}
              onChange={(value) => updateValue(field.id, value)}
            />
          );
        })}
      </div>
    );
  }, [fieldErrors, fields, loading, schemaError, submitError, updateValue, values]);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      style={{ '--tw-ring-color': primaryColor } as CSSProperties}
    >
      {toast ? (
        <div className="sticky top-2 z-10">
          <Toast message={toast.message} variant={toast.variant} />
        </div>
      ) : null}
      {content}
      <div className="flex flex-col items-end gap-3 pt-4 sm:flex-row sm:items-center sm:justify-end">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 sm:w-auto"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={submitting || loading}
          className="w-full rounded-xl px-6 py-2 text-sm font-semibold text-white shadow-sm sm:w-auto"
          style={{ backgroundColor: primaryColor, opacity: submitting || loading ? 0.7 : 1 }}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </form>
  );
}
