// src/types/Product.ts
export interface Product {
  productID: number;
  name: string;
  partNumber: string;
  description?: string;
  unitPrice?: number;
}