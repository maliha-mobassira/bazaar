import { apiRequest } from "./client";

export interface SaleRecord {
  id: string;
  tenantId: string;
  userId: string;
  totalAmount: string;
  createdAt: string;
}

export interface SalesReportResponse {
  sales: SaleRecord[];
  totalRevenue: string;
}

export async function getSalesReport(): Promise<SalesReportResponse> {
  return apiRequest<SalesReportResponse>("/api/reports/sales");
}
