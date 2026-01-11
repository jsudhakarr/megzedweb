import { apiRequest, type ApiError } from './api';
import type {
  ActionFormSchema,
  ActionFormSubmissionPayload,
  ActionFormSubmitResponse,
  ActionFormValue,
  ActionFormValues,
} from '../types/actionForm';

const isFileValue = (value: ActionFormValue): value is File => value instanceof File;

const hasFileValue = (values: ActionFormValues) =>
  Object.values(values).some((value) => isFileValue(value));

const appendFormValue = (formData: FormData, fieldId: number, value: ActionFormValue) => {
  if (value === null || value === undefined || value === '') return;
  const key = `values[${fieldId}]`;

  if (Array.isArray(value)) {
    value.forEach((entry) => {
      formData.append(`${key}[]`, entry);
    });
    return;
  }

  if (isFileValue(value)) {
    formData.append(key, value);
    return;
  }

  formData.append(key, String(value));
};

export const fetchFields = async (categoryId: number): Promise<ActionFormSchema> => {
  const response = await apiRequest<{ success: boolean; data: ActionFormSchema }>({
    endpoint: `/categories/${categoryId}/form-fields`,
    method: 'GET',
  });

  const normalizedFields = (response.data.fields ?? []).map((field, index) => ({
    ...field,
    id: Number(field.id ?? field.field_id ?? index),
  }));

  return {
    ...response.data,
    fields: normalizedFields,
  };
};

export const submitAction = async (
  itemId: number,
  payload: ActionFormSubmissionPayload
): Promise<ActionFormSubmitResponse> => {
  const hasFile = hasFileValue(payload.values);

  if (hasFile) {
    const formData = new FormData();
    formData.append('action_code', payload.action_code);

    Object.entries(payload.values).forEach(([fieldId, value]) => {
      appendFormValue(formData, Number(fieldId), value);
    });

    return apiRequest<ActionFormSubmitResponse>({
      endpoint: `/items/${itemId}/action-submit`,
      method: 'POST',
      body: formData,
    });
  }

  return apiRequest<ActionFormSubmitResponse>({
    endpoint: `/items/${itemId}/action-submit`,
    method: 'POST',
    body: payload,
  });
};

export type { ApiError };
