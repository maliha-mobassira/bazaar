import { apiRequest } from "./client";

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: string;
  image?: string;
  category?: string;
  quantity?: number | null;
  createdAt: string;
}

export async function getProducts(): Promise<Product[]> {
  return apiRequest<Product[]>("/api/products");
}

export async function createProduct(
  name: string,
  sku: string,
  price: string,
  image?: string,
  category?: string
): Promise<Product[]> {
  return apiRequest<Product[]>("/api/products", {
    method: "POST",
    body: JSON.stringify({ name, sku, price, image, category }),
  });
}

export async function deleteProduct(id: string): Promise<Product[]> {
  return apiRequest<Product[]>(`/api/products?id=${id}`, {
    method: "DELETE",
  });
}

export async function devImportProducts(): Promise<{
  imported: number;
  skipped: number;
  totalGenerated: number;
}> {
  return apiRequest<{
    imported: number;
    skipped: number;
    totalGenerated: number;
  }>("/api/dev/import", {
    method: "POST",
  });
}

export async function updateProduct(
  id: string,
  name: string,
  sku: string,
  price: string,
  image?: string,
  category?: string
): Promise<Product[]> {
  return apiRequest<Product[]>("/api/products", {
    method: "PUT",
    body: JSON.stringify({ id, name, sku, price, image, category }),
  });
}
