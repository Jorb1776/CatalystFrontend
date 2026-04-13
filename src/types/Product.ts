// src/types/Product.ts
export interface Mold {
  moldID: number;
  baseNumber: string;
  materialCompatibility?: string;
  maintenanceSchedule: string;
  shelfLocation?: string;
  physicalLocation?: string;
}

export interface MoldInsert {
  moldInsertId: number;
  moldId: number;
  insertCode: string;
  colorCode: string;
  fullNumber: string;
  baseNumber: string;
  insertLocation?: string;
  mold?: Mold;
}

export interface Product {
  productID: number;
  partNumber: string;
  partName: string;
  description?: string;
  materialID: number;
  material?: { materialID: number; name: string };
  colorant?: { colorantID: number; name: string; code: string };
  colorantID?: number;
  moldInsertId?: number | null;
  moldInsert?: MoldInsert;
  batchSize?: number;
  note?: string;
  boxSize?: string;
  fullBoxQty?: number;
  imagePath?: string;
  moldPath?: string;
  cavities?: number;
  binId?: string | null;
  unitPrice: number;
  colorantCode?: string | null;
  additives?: { additiveID: number; percentage: number }[];
  qbQuantityOnHand?: number;
  qbReorderPoint?: number;
  qbSales12Months?: number;
  qbIsActive?: boolean;
  qbOnOrder?: number;
  qbAssemblyDemand?: number;
  qbLastSyncDate?: string | null;
}