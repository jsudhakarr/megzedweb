// File: src/services/promotion.ts
import { apiService } from "./api";

export interface PromotionPlan {
  id: number;
  type: string;
  name: string;
  duration: number;
  coins: number;
  is_active: boolean | number | string;
}

export const promotionService = {
  getPlansByType: async (type: string): Promise<PromotionPlan[]> => {
    const res: any = await apiService.get(
      `/promotion-plans?type=${encodeURIComponent(type)}`
    );
    const list = Array.isArray(res) ? res : res?.data || [];
    return list as PromotionPlan[];
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
