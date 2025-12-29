export type Wallet = {
  coins_balance: number | string;
};

export type WalletTransaction = {
  id: number | string;
  change: number | string;
  balance_after: number | string;
  type: string;
  reference_id?: number | string | null;
  reference_type?: string | null;
  meta?: Record<string, any> | null;
  created_at?: string | null;
};

export type CoinPackage = {
  id: number | string;
  product_id?: string | null;
  name: string;
  coins: number | string;
  price: number | string;
  currency?: string | null;
  validity_days?: number | string | null;
  description?: string | null;
  is_active?: boolean | number | string;
};
