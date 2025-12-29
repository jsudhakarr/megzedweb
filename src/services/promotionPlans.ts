import { apiService } from "./api";

export type PromotionPlansResponse = any;

/** GET /api/v1/promotion-plans */
export const getPromotionPlans = async (): Promise<PromotionPlansResponse> => {
  return apiService.getPromotionPlans();
};

/** GET /api/v1/promotion-plans/grouped */
export const getPromotionPlansGrouped = async (): Promise<PromotionPlansResponse> => {
  return apiService.getPromotionPlansGrouped();
};

/** GET /api/v1/promotion-plans/{id} */
export const getPromotionPlanById = async (id: number) => {
  return apiService.getPromotionPlan(id);
};
