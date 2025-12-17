import { apiService } from "./api";
import type { Wallet, WalletTransaction } from "../types/wallet";

const toInt = (v: any, d = 0) => {
  if (v === null || v === undefined) return d;
  if (typeof v === "number") return Math.trunc(v);
  if (typeof v === "string") return Number.parseInt(v, 10) || d;
  return d;
};

/** GET /api/v1/wallet */
export const getWalletBalance = async (): Promise<Wallet> => {
  const res: any = await apiService.getWallet();
  const w: any = res?.data ?? res; // support {data:{...}} OR {...}
  return { coins_balance: toInt(w?.coins_balance, 0) };
};

/** GET /api/v1/wallet/transactions */
export const getWalletHistory = async (): Promise<WalletTransaction[]> => {
  const res: any = await apiService.getWalletTransactions();
  const list: any[] = res?.data ?? res?.transactions ?? res ?? [];
  const arr = Array.isArray(list) ? list : [];

  return arr.map((t: any) => ({
    ...t,
    id: toInt(t?.id),
    change: toInt(t?.change),
    balance_after: toInt(t?.balance_after),
  }));
};
