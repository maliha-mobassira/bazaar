import { apiRequest } from "./client";

export interface InventoryItem {
  id: string;
  tenantId: string;
  productId: string;
  quantity: number;
  name?: string;
  sku?: string;
  image?: string;
  category?: string;
  createdAt: string;
}

export async function getInventory(): Promise<InventoryItem[]> {
  return apiRequest<InventoryItem[]>("/api/inventory");
}

export async function createInventory(
  productId: string,
  quantity: number
): Promise<InventoryItem[]> {
  return apiRequest<InventoryItem[]>("/api/inventory", {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function updateInventory(
  productId: string,
  quantity: number
): Promise<InventoryItem[]> {
  return apiRequest<InventoryItem[]>("/api/inventory", {
    method: "PUT",
    body: JSON.stringify({ productId, quantity }),
  });
}
