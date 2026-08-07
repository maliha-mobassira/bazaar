import { apiRequest } from "./client";

export interface SaleItemInput {
  productId: string;
  quantity: number;
}

export interface SaleResponse {
  id: string;
  tenantId: string;
  userId: string;
  totalAmount: string;
  createdAt: string;
}

export async function createSale(
  items: SaleItemInput[],
  metadata?: {
    discountAmount?: number;
    customerName?: string;
    customerPhone?: string;
  }
): Promise<SaleResponse> {
  return apiRequest<SaleResponse>("/api/pos", {
    method: "POST",
    body: JSON.stringify({
      items,
      discountAmount: metadata?.discountAmount,
      customerName: metadata?.customerName,
      customerPhone: metadata?.customerPhone,
    }),
  });
}
