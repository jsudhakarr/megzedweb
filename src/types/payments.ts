export type PaymentGateway = {
  code: string;
  name: string;
  sort_order?: number | null;
  mode?: 'live' | 'sandbox' | string | null;
  currency?: string | null;
  public_config?: Record<string, string | number | boolean | null> | null;
  instructions?: string | null;
};

export type PaymentIntentPayload = {
  gateway_code: string;
  amount: number;
  currency: string;
  purpose: string;
  reference_id?: string | number | null;
  meta?: Record<string, unknown> | null;
};

export type PaymentIntentResponse = {
  transaction_id: string | number;
  status: string;
  gateway_code: string;
  amount: number;
  currency: string;
  [key: string]: unknown;
};

export type PaymentInitPayload = {
  gateway_code: string;
  package_id?: string | number | null;
  coins_amount?: number | null;
  platform?: 'android' | 'ios' | 'web' | string | null;
};

export type PaymentInitResponse = {
  transaction_id: string | number;
  status?: string;
  gateway_code?: string;
  currency?: string | null;
  razorpay_key_id?: string | null;
  razorpay_order_id?: string | null;
  amount_paise?: number | null;
  instructions?: string | null;
  [key: string]: unknown;
};

export type PaymentConfirmPayload = {
  gateway_code: string;
  transaction_id: string | number;
  payload?: Record<string, unknown>;
  [key: string]: unknown;
};

export type GooglePlayVerifyPayload = {
  product_id: string;
  purchase_token: string;
  purchase_type?: 'product' | 'subscription';
};
