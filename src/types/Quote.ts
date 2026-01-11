export interface QuoteLineItem {
  quoteLineItemID?: number;
  category: string;
  description: string;
  usage: number;
  unit: string;
  ratePerUnit: number;
  costPerPart: number;
  totalCost: number;
  displayOrder: number;
}

export interface QuoteQuantityTier {
  quoteQuantityTierID?: number;
  tierNumber: number;
  quantity: number;
  pricePerPart: number;
  totalCost: number;
  displayOrder: number;
}

export interface QuoteVersion {
  quoteVersionID?: number;
  quoteID?: number;
  versionNumber: number;
  createdDate: string;
  createdBy: string;
  changeNotes: string;
  totalCost: number;
  pricePerPart: number;
  quantity: number;
  machineID?: number | null;
  materialID?: number | null;
  colorantID?: number | null;
  additiveID?: number | null;
  lineItems: QuoteLineItem[];
  quantityTiers: QuoteQuantityTier[];

  // Contact Information
  companyName?: string;
  companyAddress?: string;
  contactName?: string;
  contactTitle?: string;
  contactPhone?: string;
  contactFax?: string;
  contactEmail?: string;

  // Part Information
  partNumber?: string;
  partName?: string;
  samplePart?: boolean;
  has3DCADFile?: boolean;
  drawingNumber?: string;
  revisionLevel?: string;
  revisionDate?: string | null;
  familyMold?: boolean;
  moldStatus?: string;
  moldNumber?: string;
  moldMaterial?: string;
  has2DDwg?: boolean;

  // Part Details
  numberOfDifferentParts?: number;
  numberOfCavities?: number;
  projectedAreaIn2?: number;
  cycleTimeSeconds?: number;
  partWeightGrams?: number;
  runnerWeightGrams?: number;
  shotWeightGrams?: number;
  regrindPercentAllowed?: number;
  pressSizeTons?: number;
  estimatedPressSizeTons?: number;
  volumeIn3?: number;

  // Primary Labor
  operatorsRequired?: number;
  firstPieceInspectionHoursPerRun?: number;
  inProcessInspectionHoursPerDay?: number;
  isirfairInspection?: boolean;
  numberOfDimsPerCavity?: number;

  // Other
  prototypes?: string;
  packagingDieCharge?: string;
  sonicWeldingHorn?: string;
  excessivePartStorage?: boolean;
  excessiveSetUpTime?: boolean;
  piecesPerWeek?: number;
  includeInQuote?: boolean;

  // Freight
  freightToSecondaryPerTruckload?: number;
  freightFromSecondaryPerTruckload?: number;
  freightToOffSiteWarehousePerTruckload?: number;
  freightToCustomerPerTruckload?: number;

  // Terms
  minimumRunQuantity?: number;
  fobPoint?: string;
  deliveryLeadTimeWeeks?: number;
  paymentTerms?: string;
  pricesHeldForDays?: number;

  // Sales
  salesRepresentative?: string;
  commissionToApply?: number;
  markupPercent?: number;
  ccQuoteTo?: string;

  // Quality
  cocsRequired?: string;
  tightTolerances?: boolean;
  uniqueMoldOrProcess?: boolean;
  existingCustomerOperations?: string;
  estimator?: string;
  quoteType?: string;

  // Cost Calculation Inputs
  machineRate?: number;
  setupCost?: number;
  purgeCost?: number;
  materialCostPerLb?: number;
  materialLossPercent?: number;
  scrapPercent?: number;
  regrindCostPerLb?: number;
  additiveCostPerLb?: number;
  colorantCostPerLb?: number;
  unusedRegrindValue?: number;
  moldMaintenancePercent?: number;
  moldAmortizationPercent?: number;

  // Labor Rates
  primaryLaborRate?: number;
  qualityLaborRate?: number;
  materialMixingRate?: number;
  secondaryLabor1Rate?: number;
  secondaryLabor2Rate?: number;

  // Hardware and Box
  selectedBoxID?: number | null;
  selectedHardware1ID?: number | null;
  hardware1QuantityPerPart?: number;
  selectedHardware2ID?: number | null;
  hardware2QuantityPerPart?: number;

  // Shipping
  shippingMethod?: string;
  shippingCost?: number;
}

export interface Quote {
  quoteID?: number;
  quoteNumber: string;
  customerID?: number | null;
  productID?: number | null;
  customerName: string;
  productName: string;
  createdDate: string;
  validUntil?: string | null;
  status: string;
  currentVersion: number;
  totalCost: number;
  pricePerPart: number;
  quantity: number;
  notes: string;
  createdBy: string;
  lastModifiedDate?: string | null;
  lastModifiedBy?: string | null;
  versions?: QuoteVersion[];

  // Contact Information
  companyName: string;
  companyAddress: string;
  contactName: string;
  contactTitle: string;
  contactPhone: string;
  contactFax: string;
  contactEmail: string;

  // Part Information
  partNumber: string;
  partName: string;
  samplePart: boolean;
  has3DCADFile: boolean;
  drawingNumber: string;
  revisionLevel: string;
  revisionDate?: string | null;
  familyMold: boolean;
  moldStatus: string;
  moldNumber: string;
  moldMaterial: string;
  has2DDwg: boolean;

  // Part Details
  numberOfDifferentParts: number;
  numberOfCavities: number;
  projectedAreaIn2: number;
  cycleTimeSeconds: number;
  partWeightGrams: number;
  runnerWeightGrams: number;
  shotWeightGrams: number;
  regrindPercentAllowed: number;
  pressSizeTons: number;
  estimatedPressSizeTons: number;
  volumeIn3: number;

  // Primary Labor
  operatorsRequired: number;
  firstPieceInspectionHoursPerRun: number;
  inProcessInspectionHoursPerDay: number;
  isirfairInspection: boolean;
  numberOfDimsPerCavity: number;

  // Other
  prototypes: string;
  packagingDieCharge: string;
  sonicWeldingHorn: string;
  excessivePartStorage: boolean;
  excessiveSetUpTime: boolean;
  piecesPerWeek: number;
  includeInQuote: boolean;

  // Terms
  minimumRunQuantity: number;
  fobPoint: string;
  deliveryLeadTimeWeeks: number;
  paymentTerms: string;
  pricesHeldForDays: number;

  // Sales
  salesRepresentative: string;
  commissionToApply: number;
  markupPercent: number;
  ccQuoteTo: string;

  // Quality
  cocsRequired: string;
  tightTolerances: boolean;
  uniqueMoldOrProcess: boolean;
  existingCustomerOperations: string;
  estimator: string;
  quoteType: string;
}

export interface CreateQuoteRequest {
  customerID?: number | null;
  productID?: number | null;
  customerName: string;
  productName: string;
  validUntil?: string | null;
  quantity: number;
  notes: string;
  machineID?: number | null;
  materialID?: number | null;
  colorantID?: number | null;
  additiveID?: number | null;
  lineItems: QuoteLineItem[];
  quantityTiers: QuoteQuantityTier[];

  // Contact Information
  companyName: string;
  companyAddress: string;
  contactName: string;
  contactTitle: string;
  contactPhone: string;
  contactFax: string;
  contactEmail: string;

  // Part Information
  partNumber: string;
  partName: string;
  samplePart: boolean;
  has3DCADFile: boolean;
  drawingNumber: string;
  revisionLevel: string;
  revisionDate?: string | null;
  familyMold: boolean;
  moldStatus: string;
  moldNumber: string;
  moldMaterial: string;
  has2DDwg: boolean;

  // Part Details
  numberOfDifferentParts: number;
  numberOfCavities: number;
  projectedAreaIn2: number;
  cycleTimeSeconds: number;
  partWeightGrams: number;
  runnerWeightGrams: number;
  shotWeightGrams: number;
  regrindPercentAllowed: number;
  pressSizeTons: number;
  estimatedPressSizeTons: number;
  volumeIn3: number;

  // Primary Labor
  operatorsRequired: number;
  firstPieceInspectionHoursPerRun: number;
  inProcessInspectionHoursPerDay: number;
  isirfairInspection: boolean;
  numberOfDimsPerCavity: number;

  // Other
  prototypes: string;
  packagingDieCharge: string;
  sonicWeldingHorn: string;
  excessivePartStorage: boolean;
  excessiveSetUpTime: boolean;
  piecesPerWeek: number;
  includeInQuote: boolean;

  // Terms
  minimumRunQuantity: number;
  fobPoint: string;
  deliveryLeadTimeWeeks: number;
  paymentTerms: string;
  pricesHeldForDays: number;

  // Sales
  salesRepresentative: string;
  commissionToApply: number;
  markupPercent: number;
  ccQuoteTo: string;

  // Quality
  cocsRequired: string;
  tightTolerances: boolean;
  uniqueMoldOrProcess: boolean;
  existingCustomerOperations: string;
  estimator: string;
  quoteType: string;
}

export interface UpdateQuoteRequest extends CreateQuoteRequest {
  status: string;
  changeNotes: string;
}
