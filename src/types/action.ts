export interface ItemAction {
  id: number;
  code: string;
  label: string;
  group?: string | null;
  description?: string | null;
  icon?: string | null;
  icon_url?: string | null;
  slot?: number | null;
  is_primary?: boolean;
  pending?: boolean;
  submission_id?: number | null;
  submission_status?: string | null;
  submission_created_at?: string | null;
  submission_updated_at?: string | null;
  fields?: ActionFormField[] | null;
  form_fields?: ActionFormField[] | null;
  formFields?: ActionFormField[] | null;
}

export interface ActionFormField {
  id?: number | string;
  field_id?: number | string;
  code?: string;
  label?: string;
  name?: string;
  type?: string;
  required?: boolean;
  options?: Array<{ label?: string; value?: string } | string>;
}

export interface ActionSubmission {
  id: number;
  uid?: string | null;
  status?: string | null;
  action_code?: string | null;
  action?: {
    id?: number;
    label?: string;
    code?: string;
  } | null;
  action_label?: string | null;
  actionLabel?: string | null;
  item_name?: string | null;
  item_image?: string | null;
  item_address?: string | null;
  item_lat?: string | number | null;
  item_lng?: string | number | null;
  owner_mobile?: string | null;
  buyer_name?: string | null;
  buyer_mobile?: string | null;
  lister_name?: string | null;
  submitted_values?: Array<{
    field_id?: number | string;
    label?: string;
    type?: string;
    value?: string;
  }> | null;
  item?: {
    id?: number;
    name?: string;
    title?: string;
    price?: string;
    address?: string;
    latitude?: string | number;
    longitude?: string | number;
    feature_photo?: { url?: string | null } | null;
    item_photos?: Array<{ url?: string | null }> | null;
    user?: { mobile?: string | null } | null;
    shop?: { user?: { mobile?: string | null } | null; phone?: string | null } | null;
  } | null;
  form_data?: Record<string, any> | Array<any> | null;
  form_fields?: Record<string, any> | Array<any> | null;
  fields?: Record<string, any> | Array<any> | null;
  data?: Record<string, any> | Array<any> | null;
  created_at?: string | null;
  updated_at?: string | null;
  submission_created_at?: string | null;
  submission_updated_at?: string | null;
  transaction_id?: number | null;
  transaction_type?: string | null;
  contact?: {
    phone?: string | null;
    whatsapp?: string | null;
  } | null;
}

export interface ActionSubmissionPayload {
  item_id: number;
  action_id: number;
  fields?: Array<{
    field_id?: number | string;
    label?: string;
    value: string;
  }>;
  message?: string;
}
