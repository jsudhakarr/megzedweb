// File: src/services/promotion.ts
import { apiService } from "./api";

export interface PromotionPlan {
  id: number;
  type: string;
  name: string;
  duration: number;
  durationDays?: number;
  coins: number;
  is_active: boolean | number | string;
  category_id?: number | string;
  category_name?: string;
  icon?: string;
  icon_url?: string;
}

export const promotionService = {
  getPlansByType: async (
    type: string,
    categoryId?: number | string
  ): Promise<PromotionPlan[]> => {
    const params = new URLSearchParams({ type: String(type) });
    if (categoryId !== undefined && categoryId !== null && String(categoryId).length > 0) {
      params.append("category_id", String(categoryId));
    }

    const res: any = await apiService.get(`/plans?${params.toString()}`);
    const list = Array.isArray(res) ? res : res?.data || res?.plans || [];
    return list.map((plan: any) => ({
      id: Number(plan?.id) || 0,
      type: String(plan?.type || type),
      name: String(plan?.name || ""),
      duration: Number(plan?.duration ?? plan?.duration_days ?? 0),
      durationDays: Number(plan?.duration_days ?? plan?.duration ?? 0),
      coins: Number(plan?.coins ?? 0),
      is_active: plan?.is_active ?? false,
      category_id: plan?.category_id,
      category_name: plan?.category_name,
      icon: plan?.icon,
      icon_url: plan?.icon_url,
    })) as PromotionPlan[];
  },

  purchasePlan: async (payload: any) => {
    const plan_id = payload?.plan_id;
    const item_id = payload?.item_id;
    const shop_id = payload?.shop_id;

    if (!plan_id) throw new Error("Missing plan_id");

    if (item_id) {
      // ✅ matches backend: POST api/v1/my-items/{item}/promote
      return await apiService.post(`/my-items/${item_id}/promote`, { plan_id });
    }

    if (shop_id) {
      // ✅ matches backend: POST api/v1/my-shops/{shop}/promote
      return await apiService.post(`/my-shops/${shop_id}/promote`, { plan_id });
    }

    throw new Error("Missing item_id or shop_id");
  },
};
