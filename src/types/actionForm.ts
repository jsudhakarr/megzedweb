export type ActionFieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'SELECT'
  | 'RADIO'
  | 'CHECKBOX'
  | 'DATE'
  | 'TIME'
  | 'DATETIME'
  | 'FILE'
  | string;

export interface ActionFormFieldOption {
  label?: string;
  value?: string;
}

export interface ActionFormField {
  id: number;
  field_id?: number;
  label?: string;
  name?: string;
  code?: string;
  type: ActionFieldType;
  required?: boolean;
  options?: Array<ActionFormFieldOption | string>;
}

export interface ActionFormSchema {
  category_id: number;
  fields: ActionFormField[];
}

export type ActionFormValue = string | number | boolean | string[] | File | null;

export type ActionFormValues = Record<number, ActionFormValue>;

export interface ActionFormSubmissionPayload {
  action_code: string;
  values: ActionFormValues;
}

export interface ActionFormSubmitResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}
