import { useMemo, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import { useAppSettings } from "../contexts/AppSettingsContext";
import type { ActionFormField, ItemAction } from "../types/action";
import type { Item } from "../services/api";

type ActionFormLocationState = {
  item?: Item;
  action?: ItemAction;
};

const normalizeFieldLabel = (field: ActionFormField) =>
  field.label || field.name || field.code || "Field";

export default function ActionForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || "#0ea5e9";
  const state = location.state as ActionFormLocationState | null;
  const item = state?.item;
  const action = state?.action;
  const [submitting, setSubmitting] = useState(false);

  const fields = useMemo<ActionFormField[]>(() => {
    if (!action) return [];
    return (
      action.fields ||
      action.form_fields ||
      action.formFields ||
      []
    );
  }, [action]);

  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    fields.forEach((field, index) => {
      const key = String(field.field_id ?? field.id ?? field.code ?? index);
      initial[key] = "";
    });
    return initial;
  });

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!item || !action) return;
    setSubmitting(true);

    try {
      const payloadFields = fields.map((field, index) => {
        const key = String(field.field_id ?? field.id ?? field.code ?? index);
        return {
          field_id: field.field_id ?? field.id ?? field.code ?? key,
          label: normalizeFieldLabel(field),
          value: formValues[key] ?? "",
        };
      });

      const response = await apiService.createActionSubmission({
        item_id: item.id,
        action_id: action.id,
        fields: payloadFields,
      });
      const submissionId =
        response?.data?.id ??
        response?.data?.submission_id ??
        response?.id ??
        response?.submission_id;

      if (submissionId) {
        navigate(`/submission-details/${submissionId}`);
      } else {
        navigate(`/item/${item.id}`);
      }
    } catch (error) {
      console.error("Failed to submit action:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!item || !action) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Action not available</h2>
          <p className="text-sm text-slate-600 mb-4">Please return to the item and try again.</p>
          <button
            onClick={() => navigate("/items")}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold"
          >
            Browse Items
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-10">
          <div className="mb-6">
            <p className="text-sm text-slate-500 mb-2">Submitting request for</p>
            <h1 className="text-2xl font-bold text-slate-900">{action.label}</h1>
            <p className="text-sm text-slate-500 mt-2">{item.name}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {fields.length === 0 ? (
              <p className="text-sm text-slate-600">
                No additional fields are required. Submit to send your request.
              </p>
            ) : (
              fields.map((field, index) => {
                const key = String(field.field_id ?? field.id ?? field.code ?? index);
                const label = normalizeFieldLabel(field);
                const type = (field.type ?? "text").toLowerCase();
                const options = Array.isArray(field.options) ? field.options : [];

                if (type === "textarea" || type === "long_text") {
                  return (
                    <div key={key} className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{label}</label>
                      <textarea
                        required={Boolean(field.required)}
                        value={formValues[key]}
                        onChange={(event) => handleChange(key, event.target.value)}
                        className="w-full min-h-[120px] rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2"
                        style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
                      />
                    </div>
                  );
                }

                if (type === "select" || type === "dropdown") {
                  return (
                    <div key={key} className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{label}</label>
                      <select
                        required={Boolean(field.required)}
                        value={formValues[key]}
                        onChange={(event) => handleChange(key, event.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white"
                        style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
                      >
                        <option value="">Select an option</option>
                        {options.map((option, optionIndex) => {
                          const value = typeof option === "string" ? option : option.value ?? option.label ?? "";
                          const labelText = typeof option === "string" ? option : option.label ?? option.value ?? "";
                          return (
                            <option key={`${key}-${optionIndex}`} value={value}>
                              {labelText}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  );
                }

                return (
                  <div key={key} className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{label}</label>
                    <input
                      type="text"
                      required={Boolean(field.required)}
                      value={formValues[key]}
                      onChange={(event) => handleChange(key, event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2"
                      style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
                    />
                  </div>
                );
              })
            )}

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(`/item/${item.id}`)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 rounded-xl text-white font-semibold shadow-sm"
                style={{ backgroundColor: primaryColor, opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
