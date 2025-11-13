// src/types/Product.ts
export interface Product {
  productID: number;
  partNumber: string;
  partName: string;
  description?: string;
  materialID: number;
  material?: { materialID: number; name: string };
  colorant?: { colorantID: number; name: string; code: string };
  colorantID?: number;
  moldId?: number;
  mold?: { moldID: number; name: string };
  batchSize?: number;
  note?: string;
  boxSize?: string;
  fullBoxQty?: number;
  imagePath?: string;
  moldPath?: string;
  cavities?: number;
  insertId?: number | null;
  binId?: string | null;
  unitPrice: number;
  colorantCode?: string | null;
  additives?: { additiveID: number; percentage: number }[];
}

export interface Mold {
  moldID: number;
  name: string;
  cavityCount: number;
  materialCompatibility?: string;
  maintenanceSchedule: string;
}