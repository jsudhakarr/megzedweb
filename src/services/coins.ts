import { apiService } from "./api";
import type { CoinPackage } from "../types/wallet";

const toInt = (v: any, d = 0) => {
  if (v === null || v === undefined) return d;
  if (typeof v === "number") return Math.trunc(v);
  if (typeof v === "string") return Number.parseInt(v, 10) || d;
  return d;
};

const toNum = (v: any, d = 0) => {
  if (v === null || v === undefined) return d;
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v) || d;
  return d;
};

const toBool = (v: any) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") return ["1", "true", "yes"].includes(v.toLowerCase());
  return false;
};

/** GET /api/v1/coin-packages */
export const getCoinPackages = async (): Promise<CoinPackage[]> => {
  const res: any = await apiService.getCoinPackages();
  const list: any[] = res?.data ?? res ?? [];
  const arr = Array.isArray(list) ? list : [];

  return arr.map((p: any) => ({
    ...p,
    id: toInt(p?.id),
    product_id: p?.product_id?.toString?.() ?? null,
    coins: toInt(p?.coins),
    price: toNum(p?.price),
    currency: (p?.currency ?? "INR").toString(),
    validity_days: p?.validity_days != null ? toInt(p?.validity_days) : null,
    is_active: toBool(p?.is_active),
  }));
};
