// src/types/Inventory.ts
export interface Material {
  materialID: number;
  name: string;
}

export interface Colorant {
  colorantID: number;
  name: string;
  code: string;
}

export interface Additive {
  additiveID: number;
  name: string;
  pricePerPound: number;
  letDownRatio: number;
}

export interface InventoryItem {
  itemID: number;
  name: string;
  type: 'Material' | 'Colorant' | 'Additive';
  quantityOnHand: number;
  reorderLevel?: number;
}