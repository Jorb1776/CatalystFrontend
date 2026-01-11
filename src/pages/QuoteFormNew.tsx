import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "../axios";
import toast from "react-hot-toast";
import CollapsibleSection from "../components/CollapsibleSection";
import {
  Quote,
  QuoteLineItem,
  CreateQuoteRequest,
  UpdateQuoteRequest,
  QuoteQuantityTier,
} from "../types/Quote";
import { Box } from "../types/Box";
import { Hardware } from "../types/Hardware";

interface Customer {
  customerID: number;
  name: string;
}

interface Product {
  productID: number;
  partName: string;
  partNumber: string;
  cavities: number;
  partWeight?: number;
  shotSizeOz: number;
  materialID: number;
  colorantID?: number;
  moldInsert?: {
    baseNumber: string;
    fullNumber: string;
  };
}

interface Machine {
  id: number;
  machineID: string;
  name: string;
  hourlyRate: number;
  clampingForceTF: number;
}

interface Material {
  materialID: number;
  name: string;
  meltDensity: number;
  supplierID: number;
  stockQuantity: number;
  reorderLevel: number;
  unitCost: number;
}

interface Colorant {
  colorantID: number;
  name: string;
  code: string;
  pricePerPound: number;
  letDownRatio: number;
}

interface Additive {
  additiveID: number;
  name: string;
  type: string;
  pricePerPound: number;
  letDownRatio: number;
}

const QuoteFormNew: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const productIdParam = searchParams.get("productId");
  const versionParam = searchParams.get("version");

  // Dropdown data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [colorants, setColorants] = useState<Colorant[]>([]);
  const [additives, setAdditives] = useState<Additive[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [hardware, setHardware] = useState<Hardware[]>([]);

  // Track last loaded quote to prevent duplicate toasts
  const lastLoadedQuote = useRef<string>("");

  // Track if shot weight was loaded from a quote to prevent auto-calculation from overwriting it
  const shotWeightLoadedFromQuote = useRef(false);

  // ========== QUOTE HEADER ==========
  const [quoteType, setQuoteType] = useState("Estimate");
  const [customerID, setCustomerID] = useState<number | null>(null);
  const [productID, setProductID] = useState<number | null>(
    productIdParam ? parseInt(productIdParam) : null
  );
  const [customerInputMode, setCustomerInputMode] = useState<
    "select" | "manual"
  >("select");
  const [productInputMode, setProductInputMode] = useState<"select" | "manual">(
    "select"
  );
  const [manualCustomerName, setManualCustomerName] = useState("");
  const [manualProductName, setManualProductName] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [changeNotes, setChangeNotes] = useState("");

  // ========== CONTACT INFORMATION ==========
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactFax, setContactFax] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // ========== PART INFORMATION ==========
  const [partNumber, setPartNumber] = useState("");
  const [partName, setPartName] = useState("");
  const [samplePart, setSamplePart] = useState(false);
  const [has3DCADFile, setHas3DCADFile] = useState(false);
  const [drawingNumber, setDrawingNumber] = useState("");
  const [revisionLevel, setRevisionLevel] = useState("");
  const [revisionDate, setRevisionDate] = useState("");
  const [familyMold, setFamilyMold] = useState(false);
  const [moldStatus, setMoldStatus] = useState("");
  const [moldNumber, setMoldNumber] = useState("");
  const [moldMaterial, setMoldMaterial] = useState("");
  const [has2DDwg, setHas2DDwg] = useState(false);

  // ========== PART DETAILS ==========
  const [numberOfDifferentParts, setNumberOfDifferentParts] = useState(1);
  const [numberOfCavities, setNumberOfCavities] = useState(1);
  const [projectedAreaIn2, setProjectedAreaIn2] = useState(0);
  const [cycleTimeSeconds, setCycleTimeSeconds] = useState(30.0);
  const [partWeightGrams, setPartWeightGrams] = useState(0);
  const [runnerWeightGrams, setRunnerWeightGrams] = useState(0);
  const [shotWeightGrams, setShotWeightGrams] = useState(0);
  const [regrindPercentAllowed, setRegrindPercentAllowed] = useState(0);
  const [pressSizeTons, setPressSizeTons] = useState(0);
  const [estimatedPressSizeTons, setEstimatedPressSizeTons] = useState(0);
  const [volumeIn3, setVolumeIn3] = useState(0);

  // ========== LABOR ==========
  // Primary Labor (Machine Operators)
  const [operatorRequired, setOperatorRequired] = useState(false);
  const [primaryLaborRate, setPrimaryLaborRate] = useState(15);

  // Quality Labor - Always 0.5 hours
  const [qualityLaborRate, setQualityLaborRate] = useState(18);
  const [isirfairInspection, setIsirfairInspection] = useState(false);

  // Material Mixing Labor - Auto 0.5 hr if colorant or additive selected
  const [materialMixingRate, setMaterialMixingRate] = useState(15);

  // Secondary Operations Labor - Input is per-piece time
  const [secondaryLabor1TimePerPiece, setSecondaryLabor1TimePerPiece] =
    useState(0); // seconds per piece
  const [secondaryLabor1Rate, setSecondaryLabor1Rate] = useState(15);
  const [secondaryLabor1Description, setSecondaryLabor1Description] =
    useState("");

  const [secondaryLabor2TimePerPiece, setSecondaryLabor2TimePerPiece] =
    useState(0); // seconds per piece
  const [secondaryLabor2Rate, setSecondaryLabor2Rate] = useState(15);
  const [secondaryLabor2Description, setSecondaryLabor2Description] =
    useState("");

  // ========== OTHER ==========
  const [prototypes, setPrototypes] = useState("");
  const [packagingDieCharge, setPackagingDieCharge] = useState("");
  const [sonicWeldingHorn, setSonicWeldingHorn] = useState("");
  const [excessivePartStorage, setExcessivePartStorage] = useState(false);
  const [excessiveSetUpTime, setExcessiveSetUpTime] = useState(false);
  const [piecesPerWeek, setPiecesPerWeek] = useState(0);
  // ========== TERMS ==========
  const [minimumRunQuantity, setMinimumRunQuantity] = useState(0);
  const [fobPoint, setFobPoint] = useState("");
  const [deliveryLeadTimeWeeks, setDeliveryLeadTimeWeeks] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState("");
  const [pricesHeldForDays, setPricesHeldForDays] = useState(30);

  // ========== SALES ==========
  const [salesRepresentative, setSalesRepresentative] = useState("");
  const [estimator, setEstimator] = useState("");
  const [ccQuoteTo, setCcQuoteTo] = useState("");

  // ========== QUALITY ==========
  const [cocsRequired, setCocsRequired] = useState("");
  const [tightTolerances, setTightTolerances] = useState(false);
  const [uniqueMoldOrProcess, setUniqueMoldOrProcess] = useState(false);
  const [existingCustomerOps, setExistingCustomerOps] = useState("");

  // ========== MATERIALS ==========
  const [materialID, setMaterialID] = useState<number | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const [meltDensity, setMeltDensity] = useState(0);
  const [colorantID, setColorantID] = useState<number | null>(null);
  const [additiveID, setAdditiveID] = useState<number | null>(null);

  // ========== BOXES ==========
  const [selectedBoxID, setSelectedBoxID] = useState<number | null>(null);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [actualPartsPerBox, setActualPartsPerBox] = useState<number | null>(
    null
  );

  // ========== HARDWARE ==========
  const [selectedHardware1ID, setSelectedHardware1ID] = useState<number | null>(
    null
  );
  const [selectedHardware1, setSelectedHardware1] = useState<Hardware | null>(
    null
  );
  const [hardware1QuantityPerPart, setHardware1QuantityPerPart] = useState(0);

  const [selectedHardware2ID, setSelectedHardware2ID] = useState<number | null>(
    null
  );
  const [selectedHardware2, setSelectedHardware2] = useState<Hardware | null>(
    null
  );
  const [hardware2QuantityPerPart, setHardware2QuantityPerPart] = useState(0);

  // ========== SHIPPING ==========
  const [shippingMethod, setShippingMethod] = useState<
    "UPS" | "Skid" | "Billed to Customer" | ""
  >("");
  const [shippingCost, setShippingCost] = useState(0);

  // ========== MOLD COSTS ==========
  const [moldMaintenancePercent, setMoldMaintenancePercent] = useState(0.15); // % of amortization
  const [moldAmortizationPercent, setMoldAmortizationPercent] = useState(0.05); // % of subtotal

  // ========== COST INPUTS (from original form) ==========
  const [machineID, setMachineID] = useState<number | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [machineRate, setMachineRate] = useState(0); // $/hour for machine operation
  const [setupCost, setSetupCost] = useState(250); // Setup fee, default $250
  const [purgeCost, setPurgeCost] = useState(0); // Purge/cleaning cost per run
  const [materialCostPerLb, setMaterialCostPerLb] = useState(0);
  const [materialLossPercent, setMaterialLossPercent] = useState(0);
  const [scrapPercent, setScrapPercent] = useState(0.005); // Default 0.5%, stored as decimal (0.005 = 0.5%)
  const [regrindLbs, setRegrindLbs] = useState(0);
  const [regrindCostPerLb, setRegrindCostPerLb] = useState(0);
  const [additiveLbs, setAdditiveLbs] = useState(0);
  const [additiveCostPerLb, setAdditiveCostPerLb] = useState(0);
  const [unusedRegrindLbs, setUnusedRegrindLbs] = useState(0);
  const [unusedRegrindValue, setUnusedRegrindValue] = useState(2.2);
  const [colorantLbs, setColorantLbs] = useState(0);
  const [colorantCostPerLb, setColorantCostPerLb] = useState(0);
  const [commissionPercent, setCommissionPercent] = useState(0.03);
  const [markupPercent, setMarkupPercent] = useState(0);

  // ========== QUANTITY TIERS ==========
  const [quantityTiers, setQuantityTiers] = useState<QuoteQuantityTier[]>([
    {
      tierNumber: 1,
      quantity: 1000,
      pricePerPart: 0,
      totalCost: 0,
      displayOrder: 0,
    },
    {
      tierNumber: 2,
      quantity: 2500,
      pricePerPart: 0,
      totalCost: 0,
      displayOrder: 1,
    },
    {
      tierNumber: 3,
      quantity: 5000,
      pricePerPart: 0,
      totalCost: 0,
      displayOrder: 2,
    },
    {
      tierNumber: 4,
      quantity: 10000,
      pricePerPart: 0,
      totalCost: 0,
      displayOrder: 2,
    },
  ]);

  // ========== BREAKDOWN MODAL ==========
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedTierIndex, setSelectedTierIndex] = useState<number | null>(
    null
  );
  const [showDetailedLineItems, setShowDetailedLineItems] = useState(false);
  const [isLoadingFromVersion, setIsLoadingFromVersion] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    fetchMachines();
    fetchMaterials();
    fetchColorants();
    fetchAdditives();
    fetchBoxes();
    fetchHardware();
  }, []);

  // Load existing quote when id is present
  useEffect(() => {
    if (id) {
      const version = versionParam ? parseInt(versionParam) : undefined;
      fetchQuote(id, version);
    }
  }, [id, versionParam]);

  // Get unique machine tonnages sorted in ascending order
  const uniqueTonnages = React.useMemo(() => {
    const tonnageSet = new Set(machines.map((m) => m.clampingForceTF));
    return Array.from(tonnageSet).sort((a, b) => a - b);
  }, [machines]);

  useEffect(() => {
    if (machineID && !isLoadingFromVersion) {
      const machine = machines.find((m) => m.id === machineID);
      setSelectedMachine(machine || null);

      // Auto-set machine rate from database
      if (machine) {
        setMachineRate(machine.hourlyRate);
      }
    } else if (machineID) {
      // Just set selectedMachine without overriding rate
      const machine = machines.find((m) => m.id === machineID);
      setSelectedMachine(machine || null);
    }
  }, [machineID, machines, isLoadingFromVersion]);

  // Auto-populate part info when product is selected
  useEffect(() => {
    if (productID && productInputMode === "select") {
      const product = products.find((p) => p.productID === productID);
      if (product) {
        setPartNumber(product.partNumber);
        setPartName(product.partName);
        setNumberOfCavities(product.cavities || 1);
        if (product.partWeight) {
          setPartWeightGrams(product.partWeight);
        }
        setShotWeightGrams(product.shotSizeOz * 28.3495); // Convert oz to grams

        // Set mold number if available
        if (product.moldInsert?.baseNumber) {
          setMoldNumber(product.moldInsert.baseNumber);
        }
      }
    }
  }, [productID, products, productInputMode]);

  // Auto-populate material properties when material is selected
  useEffect(() => {
    if (materialID && !isLoadingFromVersion) {
      const material = materials.find((m) => m.materialID === materialID);
      setSelectedMaterial(material || null);
      if (material) {
        setMeltDensity(material.meltDensity);
        setMaterialCostPerLb(material.unitCost);
      }
    } else if (materialID) {
      // Just set selectedMaterial without overriding cost
      const material = materials.find((m) => m.materialID === materialID);
      setSelectedMaterial(material || null);
      if (material) {
        setMeltDensity(material.meltDensity);
      }
    }
  }, [materialID, materials, isLoadingFromVersion]);

  // Auto-populate box when selected
  useEffect(() => {
    if (selectedBoxID) {
      const box = boxes.find((b) => b.boxID === selectedBoxID);
      setSelectedBox(box || null);
    } else {
      setSelectedBox(null);
    }
  }, [selectedBoxID, boxes]);

  // Auto-populate hardware 1 when selected
  useEffect(() => {
    if (selectedHardware1ID) {
      const hw = hardware.find((h) => h.hardwareID === selectedHardware1ID);
      setSelectedHardware1(hw || null);
    } else {
      setSelectedHardware1(null);
    }
  }, [selectedHardware1ID, hardware]);

  // Auto-populate hardware 2 when selected
  useEffect(() => {
    if (selectedHardware2ID) {
      const hw = hardware.find((h) => h.hardwareID === selectedHardware2ID);
      setSelectedHardware2(hw || null);
    } else {
      setSelectedHardware2(null);
    }
  }, [selectedHardware2ID, hardware]);

  // Auto-populate colorant cost when selected (only for new selections, not loaded quotes)
  useEffect(() => {
    if (colorantID && !isLoadingFromVersion) {
      const colorant = colorants.find((c) => c.colorantID === colorantID);
      if (colorant && colorant.pricePerPound > 0) {
        setColorantCostPerLb(colorant.pricePerPound);
      }
    }
  }, [colorantID, colorants, isLoadingFromVersion]);

  // Auto-populate additive cost when selected (only for new selections, not loaded quotes)
  useEffect(() => {
    if (additiveID && !isLoadingFromVersion) {
      const additive = additives.find((a) => a.additiveID === additiveID);
      if (additive && additive.pricePerPound > 0) {
        setAdditiveCostPerLb(additive.pricePerPound);
      }
    }
  }, [additiveID, additives, isLoadingFromVersion]);

  // Auto-calculate colorant pounds based on material weight and letDownRatio
  useEffect(() => {
    if (colorantID && quantityTiers[0]?.quantity > 0) {
      const colorant = colorants.find((c) => c.colorantID === colorantID);
      if (colorant && colorant.letDownRatio > 0) {
        // Calculate total material weight for the run
        const partWeightLbs = partWeightGrams / 453.592;
        const runnerWeightLbs = runnerWeightGrams / 453.592;
        const shotWeightLbs = partWeightLbs + runnerWeightLbs;
        const scrapMultiplier =
          scrapPercent > 0 && scrapPercent < 1 ? 1 + scrapPercent : 1;
        const grossWeightLbsPerPart = shotWeightLbs * scrapMultiplier;
        const totalMaterialLbs =
          grossWeightLbsPerPart * quantityTiers[0].quantity;

        // Calculate colorant pounds using letDownRatio
        const calculatedColorantLbs = totalMaterialLbs * colorant.letDownRatio;
        setColorantLbs(calculatedColorantLbs);
      }
    } else {
      setColorantLbs(0);
    }
  }, [
    colorantID,
    colorants,
    partWeightGrams,
    runnerWeightGrams,
    scrapPercent,
    quantityTiers,
  ]);

  // Auto-calculate additive pounds based on material weight and letDownRatio
  useEffect(() => {
    if (additiveID && quantityTiers[0]?.quantity > 0) {
      const additive = additives.find((a) => a.additiveID === additiveID);
      if (additive && additive.letDownRatio > 0) {
        // Calculate total material weight for the run
        const partWeightLbs = partWeightGrams / 453.592;
        const runnerWeightLbs = runnerWeightGrams / 453.592;
        const shotWeightLbs = partWeightLbs + runnerWeightLbs;
        const scrapMultiplier =
          scrapPercent > 0 && scrapPercent < 1 ? 1 + scrapPercent : 1;
        const grossWeightLbsPerPart = shotWeightLbs * scrapMultiplier;
        const totalMaterialLbs =
          grossWeightLbsPerPart * quantityTiers[0].quantity;

        // Calculate additive pounds using letDownRatio
        const calculatedAdditiveLbs = totalMaterialLbs * additive.letDownRatio;
        setAdditiveLbs(calculatedAdditiveLbs);
      }
    } else {
      setAdditiveLbs(0);
    }
  }, [
    additiveID,
    additives,
    partWeightGrams,
    runnerWeightGrams,
    scrapPercent,
    quantityTiers,
  ]);

  // Auto-calculate shot weight (part weight + runner weight)
  useEffect(() => {
    if (!isLoadingFromVersion) {
      // If shot weight was loaded from quote, reset flag on first manual change and don't auto-calculate yet
      if (shotWeightLoadedFromQuote.current) {
        shotWeightLoadedFromQuote.current = false;
      } else {
        // Auto-calculate shot weight when user manually changes part or runner weight
        const partWeight = Number(partWeightGrams) || 0;
        const runnerWeight = Number(runnerWeightGrams) || 0;
        const calculated = partWeight + runnerWeight;
        setShotWeightGrams(isNaN(calculated) ? 0 : calculated);
      }
    }
  }, [partWeightGrams, runnerWeightGrams, isLoadingFromVersion]);

  // Auto-calculate estimated press size
  useEffect(() => {
    const calculated = 2.5 * (numberOfCavities * projectedAreaIn2) * 1.1;
    setEstimatedPressSizeTons(calculated);
  }, [numberOfCavities, projectedAreaIn2]);

  useEffect(() => {
    // Auto-calculate quantity tiers
    const updatedTiers = quantityTiers.map((tier) => {
      const lineItems = calculateLineItems(tier.quantity);
      const pricePerPart = lineItems.reduce(
        (sum, item) => sum + item.costPerPart,
        0
      );
      const totalCost = pricePerPart * tier.quantity;
      return { ...tier, pricePerPart, totalCost };
    });
    setQuantityTiers(updatedTiers);
  }, [
    machineRate,
    setupCost,
    purgeCost,
    materialCostPerLb,
    materialLossPercent,
    scrapPercent,
    commissionPercent,
    operatorRequired,
    primaryLaborRate,
    qualityLaborRate,
    materialMixingRate,
    colorantID,
    additiveLbs,
    secondaryLabor1TimePerPiece,
    secondaryLabor1Rate,
    secondaryLabor2TimePerPiece,
    secondaryLabor2Rate,
    cycleTimeSeconds,
    numberOfCavities,
    partWeightGrams,
    runnerWeightGrams,
    regrindPercentAllowed,
    unusedRegrindValue,
    colorantLbs,
    colorantCostPerLb,
    selectedBox,
    volumeIn3,
    selectedHardware1,
    hardware1QuantityPerPart,
    selectedHardware2,
    hardware2QuantityPerPart,
    shippingMethod,
    shippingCost,
    moldMaintenancePercent,
    moldAmortizationPercent,
  ]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get<Customer[]>("/api/customers");
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get<Product[]>("/api/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchMachines = async () => {
    try {
      const response = await axios.get<Machine[]>("/api/machines");
      setMachines(response.data);
    } catch (error) {
      console.error("Error fetching machines:", error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await axios.get<Material[]>("/api/materials");
      setMaterials(response.data);
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const fetchColorants = async () => {
    try {
      const response = await axios.get<Colorant[]>("/api/colorants");
      setColorants(response.data);
    } catch (error) {
      console.error("Error fetching colorants:", error);
    }
  };

  const fetchAdditives = async () => {
    try {
      const response = await axios.get<Additive[]>("/api/additives");
      setAdditives(response.data);
    } catch (error) {
      console.error("Error fetching additives:", error);
    }
  };

  const fetchBoxes = async () => {
    try {
      const response = await axios.get<Box[]>("/api/boxes");
      setBoxes(response.data);
    } catch (error) {
      console.error("Error fetching boxes:", error);
    }
  };

  const fetchHardware = async () => {
    try {
      const response = await axios.get<Hardware[]>("/api/hardware");
      setHardware(response.data);
    } catch (error) {
      console.error("Error fetching hardware:", error);
    }
  };

  const fetchQuote = async (quoteId: string, version?: number) => {
    try {
      setIsLoadingFromVersion(true); // Prevent auto-population during load

      const url = version
        ? `/api/quotes/${quoteId}?version=${version}`
        : `/api/quotes/${quoteId}`;
      const response = await axios.get<Quote>(url);
      const quote = response.data;

      // Quote Header
      setQuoteType(quote.quoteType || "Estimate");
      setCustomerID(quote.customerID ?? null);
      setProductID(quote.productID ?? null);
      setValidUntil(quote.validUntil || "");
      setNotes(quote.notes || "");

      // Determine input modes
      if (quote.customerID) {
        setCustomerInputMode("select");
      } else {
        setCustomerInputMode("manual");
        setManualCustomerName(quote.customerName || "");
      }

      if (quote.productID) {
        setProductInputMode("select");
      } else {
        setProductInputMode("manual");
        setManualProductName(quote.productName || "");
      }

      // Contact Information
      setCompanyName(quote.companyName || "");
      setCompanyAddress(quote.companyAddress || "");
      setContactName(quote.contactName || "");
      setContactTitle(quote.contactTitle || "");
      setContactPhone(quote.contactPhone || "");
      setContactFax(quote.contactFax || "");
      setContactEmail(quote.contactEmail || "");

      // Part Information
      setPartNumber(quote.partNumber || "");
      setPartName(quote.partName || "");
      setSamplePart(quote.samplePart || false);
      setHas3DCADFile(quote.has3DCADFile || false);
      setDrawingNumber(quote.drawingNumber || "");
      setRevisionLevel(quote.revisionLevel || "");
      setRevisionDate(quote.revisionDate || "");
      setFamilyMold(quote.familyMold || false);
      setMoldStatus(quote.moldStatus || "");
      setMoldNumber(quote.moldNumber || "");
      setMoldMaterial(quote.moldMaterial || "");
      setHas2DDwg(quote.has2DDwg || false);

      // Part Details
      setNumberOfDifferentParts(quote.numberOfDifferentParts || 1);
      setNumberOfCavities(quote.numberOfCavities || 1);
      setProjectedAreaIn2(quote.projectedAreaIn2 || 0);
      setCycleTimeSeconds(quote.cycleTimeSeconds || 30.0);
      setPartWeightGrams(quote.partWeightGrams || 0);
      setRunnerWeightGrams(quote.runnerWeightGrams || 0);
      setShotWeightGrams(quote.shotWeightGrams || 0);
      shotWeightLoadedFromQuote.current = true; // Mark that shot weight was loaded from quote
      setRegrindPercentAllowed(quote.regrindPercentAllowed || 0);
      setPressSizeTons(quote.pressSizeTons || 0);
      setEstimatedPressSizeTons(quote.estimatedPressSizeTons || 0);
      setVolumeIn3(quote.volumeIn3 || 0);

      // Labor
      setOperatorRequired(quote.operatorsRequired > 0);
      setIsirfairInspection(quote.isirfairInspection || false);

      // Other
      setPrototypes(quote.prototypes || "");
      setPackagingDieCharge(quote.packagingDieCharge || "");
      setSonicWeldingHorn(quote.sonicWeldingHorn || "");
      setExcessivePartStorage(quote.excessivePartStorage || false);
      setExcessiveSetUpTime(quote.excessiveSetUpTime || false);
      setPiecesPerWeek(quote.piecesPerWeek || 0);

      // Terms
      setMinimumRunQuantity(quote.minimumRunQuantity || 0);
      setFobPoint(quote.fobPoint || "");
      setDeliveryLeadTimeWeeks(quote.deliveryLeadTimeWeeks || 0);
      setPaymentTerms(quote.paymentTerms || "");
      setPricesHeldForDays(quote.pricesHeldForDays || 30);

      // Sales
      setSalesRepresentative(quote.salesRepresentative || "");
      setEstimator(quote.estimator || "");
      setCcQuoteTo(quote.ccQuoteTo || "");
      // Commission and Markup are loaded from version data below

      // Quality
      setCocsRequired(quote.cocsRequired || "");
      setTightTolerances(quote.tightTolerances || false);
      setUniqueMoldOrProcess(quote.uniqueMoldOrProcess || false);
      setExistingCustomerOps(quote.existingCustomerOperations || "");

      // Get the latest version data if available
      if (quote.versions && quote.versions.length > 0) {
        const latestVersion = quote.versions[quote.versions.length - 1];

        // Set IDs from version
        setMachineID(latestVersion.machineID ?? null);
        setMaterialID(latestVersion.materialID ?? null);
        setColorantID(latestVersion.colorantID ?? null);
        setAdditiveID(latestVersion.additiveID ?? null);

        // Set quantity tiers from version
        if (
          latestVersion.quantityTiers &&
          latestVersion.quantityTiers.length > 0
        ) {
          setQuantityTiers(latestVersion.quantityTiers);
        }

        // Load part details from version
        if (latestVersion.partWeightGrams !== undefined)
          setPartWeightGrams(latestVersion.partWeightGrams);
        if (latestVersion.runnerWeightGrams !== undefined)
          setRunnerWeightGrams(latestVersion.runnerWeightGrams);
        if (latestVersion.shotWeightGrams !== undefined) {
          setShotWeightGrams(latestVersion.shotWeightGrams);
          shotWeightLoadedFromQuote.current = true; // Mark that shot weight was loaded from version
        }
        if (latestVersion.cycleTimeSeconds !== undefined)
          setCycleTimeSeconds(latestVersion.cycleTimeSeconds);
        if (latestVersion.numberOfCavities !== undefined)
          setNumberOfCavities(latestVersion.numberOfCavities);
        if (latestVersion.projectedAreaIn2 !== undefined)
          setProjectedAreaIn2(latestVersion.projectedAreaIn2);
        if (latestVersion.regrindPercentAllowed !== undefined)
          setRegrindPercentAllowed(latestVersion.regrindPercentAllowed);
        if (latestVersion.pressSizeTons !== undefined)
          setPressSizeTons(latestVersion.pressSizeTons);
        if (latestVersion.estimatedPressSizeTons !== undefined)
          setEstimatedPressSizeTons(latestVersion.estimatedPressSizeTons);
        if (latestVersion.volumeIn3 !== undefined)
          setVolumeIn3(latestVersion.volumeIn3);
        if (latestVersion.numberOfDifferentParts !== undefined)
          setNumberOfDifferentParts(latestVersion.numberOfDifferentParts);

        // Load calculation inputs from version
        if (latestVersion.machineRate !== undefined)
          setMachineRate(latestVersion.machineRate);
        if (latestVersion.setupCost !== undefined)
          setSetupCost(latestVersion.setupCost);
        if (latestVersion.purgeCost !== undefined)
          setPurgeCost(latestVersion.purgeCost);
        if (latestVersion.materialCostPerLb !== undefined)
          setMaterialCostPerLb(latestVersion.materialCostPerLb);
        if (latestVersion.materialLossPercent !== undefined)
          setMaterialLossPercent(latestVersion.materialLossPercent);
        if (latestVersion.scrapPercent !== undefined)
          setScrapPercent(latestVersion.scrapPercent);
        if (latestVersion.regrindCostPerLb !== undefined)
          setRegrindCostPerLb(latestVersion.regrindCostPerLb);
        if (latestVersion.additiveCostPerLb !== undefined)
          setAdditiveCostPerLb(latestVersion.additiveCostPerLb);
        if (latestVersion.colorantCostPerLb !== undefined)
          setColorantCostPerLb(latestVersion.colorantCostPerLb);
        if (latestVersion.unusedRegrindValue !== undefined)
          setUnusedRegrindValue(latestVersion.unusedRegrindValue);
        if (latestVersion.moldMaintenancePercent !== undefined)
          setMoldMaintenancePercent(latestVersion.moldMaintenancePercent);
        if (latestVersion.moldAmortizationPercent !== undefined)
          setMoldAmortizationPercent(latestVersion.moldAmortizationPercent);

        // Load labor rates from version
        if (latestVersion.primaryLaborRate !== undefined)
          setPrimaryLaborRate(latestVersion.primaryLaborRate);
        if (latestVersion.qualityLaborRate !== undefined)
          setQualityLaborRate(latestVersion.qualityLaborRate);
        if (latestVersion.materialMixingRate !== undefined)
          setMaterialMixingRate(latestVersion.materialMixingRate);
        if (latestVersion.secondaryLabor1Rate !== undefined)
          setSecondaryLabor1Rate(latestVersion.secondaryLabor1Rate);
        if (latestVersion.secondaryLabor2Rate !== undefined)
          setSecondaryLabor2Rate(latestVersion.secondaryLabor2Rate);

        // Load hardware and box from version
        if (latestVersion.selectedBoxID !== undefined)
          setSelectedBoxID(latestVersion.selectedBoxID);
        if (latestVersion.selectedHardware1ID !== undefined)
          setSelectedHardware1ID(latestVersion.selectedHardware1ID);
        if (latestVersion.hardware1QuantityPerPart !== undefined)
          setHardware1QuantityPerPart(latestVersion.hardware1QuantityPerPart);
        if (latestVersion.selectedHardware2ID !== undefined)
          setSelectedHardware2ID(latestVersion.selectedHardware2ID);
        if (latestVersion.hardware2QuantityPerPart !== undefined)
          setHardware2QuantityPerPart(latestVersion.hardware2QuantityPerPart);

        // Load shipping from version
        if (latestVersion.shippingMethod !== undefined) {
          setShippingMethod(
            latestVersion.shippingMethod as
              | ""
              | "UPS"
              | "Skid"
              | "Billed to Customer"
          );
        }
        if (latestVersion.shippingCost !== undefined)
          setShippingCost(latestVersion.shippingCost);

        // Load sales data from version
        setCommissionPercent(latestVersion.commissionToApply ?? 0.03);
        setMarkupPercent(latestVersion.markupPercent ?? 0);
      }

      // Only show toast if this is a different quote/version than last loaded
      const loadKey = `${quoteId}-${version || "latest"}`;
      if (lastLoadedQuote.current !== loadKey) {
        const versionMessage = version
          ? `Quote loaded successfully (Version ${version})`
          : "Quote loaded successfully";
        toast.success(versionMessage);
        lastLoadedQuote.current = loadKey;
      }

      // Delay re-enabling auto-population to ensure all loaded values are set first
      setTimeout(() => {
        setIsLoadingFromVersion(false);
      }, 0);
    } catch (error) {
      console.error("Error fetching quote:", error);
      toast.error("Failed to load quote");
      setTimeout(() => {
        setIsLoadingFromVersion(false);
      }, 0);
    }
  };

  // Helper function to calculate parts per box
  const calculatePartsPerBox = (
    boxVolume: number,
    partVolume: number
  ): number => {
    // If manual override is set, use it
    if (actualPartsPerBox && actualPartsPerBox > 0) {
      return actualPartsPerBox;
    }

    // Otherwise, use automatic calculation with 45% packing efficiency
    const packingEfficiency = 0.45;
    const exactPartsPerBox = Math.floor(
      (boxVolume / partVolume) * packingEfficiency
    );
    return Math.floor(exactPartsPerBox / 50) * 50;
  };

  //BREAKDOWN
  const calculateLineItems = (quantity: number): QuoteLineItem[] => {
    const items: QuoteLineItem[] = [];
    let order = 0;

    // Calculate machine hours based on production time
    const cyclesNeeded = quantity / (numberOfCavities || 1);
    const machineHours = (cyclesNeeded * cycleTimeSeconds) / 3600;

    if (machineHours > 0 && machineRate > 0) {
      items.push({
        category: "Machine Hours",
        description: `Machine time at $${machineRate.toFixed(2)}/hour`,
        usage: machineHours,
        unit: "Hours",
        ratePerUnit: machineRate,
        costPerPart: (machineHours * machineRate) / quantity,
        totalCost: machineHours * machineRate,
        displayOrder: order++,
      });
    }

    // Setup cost
    if (setupCost > 0) {
      items.push({
        category: "Set-Up",
        description: "Machine setup fee",
        usage: 1,
        unit: "Setup",
        ratePerUnit: setupCost,
        costPerPart: setupCost / quantity,
        totalCost: setupCost,
        displayOrder: order++,
      });
    }

    // Purge/cleaning cost
    if (purgeCost > 0) {
      items.push({
        category: "Purge/Cleaning",
        description: "Purge and cleaning cost",
        usage: 1,
        unit: "Run",
        ratePerUnit: purgeCost,
        costPerPart: purgeCost / quantity,
        totalCost: purgeCost,
        displayOrder: order++,
      });
    }

    // Calculate material based on part weight + runner weight (total shot weight)
    let baseMaterialCost = 0;
    if (partWeightGrams > 0) {
      const materialLbsPerPart =
        (partWeightGrams + runnerWeightGrams) / 453.592; // Convert grams to pounds
      const baseMaterialLbs = materialLbsPerPart * quantity;
      baseMaterialCost = baseMaterialLbs * materialCostPerLb;

      // Account for scrap percentage using additive method
      const scrapAdder = scrapPercent > 0 ? baseMaterialCost * scrapPercent : 0;
      const totalCost = baseMaterialCost + scrapAdder;

      const description =
        scrapPercent > 0
          ? `Base material (part + runner weight + ${(
              scrapPercent * 100
            ).toFixed(1)}% scrap adder)`
          : "Base material (part + runner weight)";

      items.push({
        category: "Material",
        description: description,
        usage: baseMaterialLbs,
        unit: "Pounds",
        ratePerUnit: materialCostPerLb,
        costPerPart: totalCost / quantity,
        totalCost: totalCost,
        displayOrder: order++,
      });
    }

    // Add material loss as a percentage of base material cost
    if (materialLossPercent > 0 && baseMaterialCost > 0) {
      const materialLossDollars =
        baseMaterialCost * (materialLossPercent / 100);
      items.push({
        category: "Material Loss",
        description: `Material loss/waste (${materialLossPercent.toFixed(
          1
        )}% of material)`,
        usage: materialLossPercent,
        unit: "Percent",
        ratePerUnit: baseMaterialCost,
        costPerPart: materialLossDollars / quantity,
        totalCost: materialLossDollars,
        displayOrder: order++,
      });
    }

    if (colorantLbs > 0) {
      const totalCost = colorantLbs * colorantCostPerLb;
      items.push({
        category: "Colorant",
        description: "Colorant additive",
        usage: colorantLbs,
        unit: "Pounds",
        ratePerUnit: colorantCostPerLb,
        costPerPart: totalCost / quantity,
        totalCost: totalCost,
        displayOrder: order++,
      });
    }
    if (additiveLbs > 0) {
      const totalCost = additiveLbs * additiveCostPerLb;
      items.push({
        category: "Additive",
        description: "Additive",
        usage: additiveLbs,
        unit: "Pounds",
        ratePerUnit: additiveCostPerLb,
        costPerPart: totalCost / quantity,
        totalCost: totalCost,
        displayOrder: order++,
      });
    }

    // Calculate unused regrind credit (runner material recovery)
    if (runnerWeightGrams > 0 && regrindPercentAllowed > 0) {
      const runnerLbsPerPart = runnerWeightGrams / 453.592; // Convert grams to pounds
      const totalRunnerLbs = runnerLbsPerPart * quantity;
      const regrindUsablePercent = regrindPercentAllowed / 100;
      const regrindCreditLbs = totalRunnerLbs * regrindUsablePercent;
      const regrindValuePerLb = unusedRegrindValue; // Value/credit for regrind material
      const totalCredit = regrindCreditLbs * regrindValuePerLb;

      items.push({
        category: "Regrind Credit",
        description: `Runner regrind recovery (${regrindPercentAllowed}% @ $${regrindValuePerLb.toFixed(
          2
        )}/lb)`,
        usage: regrindCreditLbs,
        unit: "Pounds",
        ratePerUnit: -regrindValuePerLb, // Negative because it's a credit
        costPerPart: -totalCredit / quantity, // Negative cost (credit)
        totalCost: -totalCredit,
        displayOrder: order++,
      });
    }

    // Primary Labor - Calculate hours based on production time
    if (operatorRequired && primaryLaborRate > 0) {
      // Calculate production hours: (quantity / cavities) × (cycleTime in seconds / 3600)
      const cyclesNeeded = quantity / (numberOfCavities || 1);
      const primaryLaborHours = (cyclesNeeded * cycleTimeSeconds) / 3600;
      const totalCost = primaryLaborHours * primaryLaborRate;
      items.push({
        category: "Primary Labor",
        description: "Machine operator labor",
        usage: primaryLaborHours,
        unit: "Hours",
        ratePerUnit: primaryLaborRate,
        costPerPart: totalCost / quantity,
        totalCost: totalCost,
        displayOrder: order++,
      });
    }

    // Quality Labor - Always 0.5 hours if enabled
    if (qualityLaborRate > 0) {
      const qualityLaborHours = 0.5;
      const totalCost = qualityLaborHours * qualityLaborRate;
      items.push({
        category: "Quality Labor",
        description: "Quality inspection labor",
        usage: qualityLaborHours,
        unit: "Hours",
        ratePerUnit: qualityLaborRate,
        costPerPart: totalCost / quantity,
        totalCost: totalCost,
        displayOrder: order++,
      });
    }

    // Material Mixing Labor - 0.5 hr if colorant or additive selected
    if ((colorantID || additiveLbs > 0) && materialMixingRate > 0) {
      const mixingHours = 0.5;
      const totalCost = mixingHours * materialMixingRate;
      items.push({
        category: "Material Mixing",
        description: "Material mixing labor (0.5 hr)",
        usage: mixingHours,
        unit: "Hours",
        ratePerUnit: materialMixingRate,
        costPerPart: totalCost / quantity,
        totalCost: totalCost,
        displayOrder: order++,
      });
    }

    // Secondary Labor #1 - Calculate from per-piece time
    if (secondaryLabor1TimePerPiece > 0 && secondaryLabor1Rate > 0) {
      const totalHours = (secondaryLabor1TimePerPiece / 3600) * quantity;
      const totalCost = totalHours * secondaryLabor1Rate;
      const description =
        secondaryLabor1Description || "Secondary operation #1";
      items.push({
        category: "Secondary Op #1",
        description: description,
        usage: totalHours,
        unit: "Hours",
        ratePerUnit: secondaryLabor1Rate,
        costPerPart: totalCost / quantity,
        totalCost: totalCost,
        displayOrder: order++,
      });
    }

    // Secondary Labor #2 - Calculate from per-piece time
    if (secondaryLabor2TimePerPiece > 0 && secondaryLabor2Rate > 0) {
      const totalHours = (secondaryLabor2TimePerPiece / 3600) * quantity;
      const totalCost = totalHours * secondaryLabor2Rate;
      const description =
        secondaryLabor2Description || "Secondary operation #2";
      items.push({
        category: "Secondary Op #2",
        description: description,
        usage: totalHours,
        unit: "Hours",
        ratePerUnit: secondaryLabor2Rate,
        costPerPart: totalCost / quantity,
        totalCost: totalCost,
        displayOrder: order++,
      });
    }

    // Box Cost - Calculate based on parts per box
    if (selectedBox && volumeIn3 > 0 && selectedBox.cost > 0) {
      // Calculate box volume in cubic inches
      const boxVolume =
        selectedBox.length * selectedBox.width * selectedBox.height;

      // Calculate parts per box (uses manual override if set, otherwise auto-calculates)
      const partsPerBox = calculatePartsPerBox(boxVolume, volumeIn3);

      if (partsPerBox > 0) {
        // Calculate cost per part
        const costPerPart = selectedBox.cost / partsPerBox;

        // Calculate number of boxes needed for this quantity
        const boxesNeeded = Math.ceil(quantity / partsPerBox);
        const totalCost = boxesNeeded * selectedBox.cost;

        items.push({
          category: "Packaging",
          description: `${selectedBox.name} (${partsPerBox} parts/box, ${boxesNeeded} boxes)`,
          usage: boxesNeeded,
          unit: "Boxes",
          ratePerUnit: selectedBox.cost,
          costPerPart: costPerPart,
          totalCost: totalCost,
          displayOrder: order++,
        });
      }
    }

    // Hardware 1 Cost - Calculate based on quantity needed per part
    if (
      selectedHardware1 &&
      hardware1QuantityPerPart > 0 &&
      selectedHardware1.cost > 0
    ) {
      const totalHardwareNeeded = quantity * hardware1QuantityPerPart;
      const totalCost = totalHardwareNeeded * selectedHardware1.cost;
      const costPerPart = hardware1QuantityPerPart * selectedHardware1.cost;

      items.push({
        category: "Hardware 1",
        description: `${selectedHardware1.name} (${hardware1QuantityPerPart} per part, ${totalHardwareNeeded} total)`,
        usage: totalHardwareNeeded,
        unit: "Pieces",
        ratePerUnit: selectedHardware1.cost,
        costPerPart: costPerPart,
        totalCost: totalCost,
        displayOrder: order++,
      });
    }

    // Hardware 2 Cost - Calculate based on quantity needed per part
    if (
      selectedHardware2 &&
      hardware2QuantityPerPart > 0 &&
      selectedHardware2.cost > 0
    ) {
      const totalHardwareNeeded = quantity * hardware2QuantityPerPart;
      const totalCost = totalHardwareNeeded * selectedHardware2.cost;
      const costPerPart = hardware2QuantityPerPart * selectedHardware2.cost;

      items.push({
        category: "Hardware 2",
        description: `${selectedHardware2.name} (${hardware2QuantityPerPart} per part, ${totalHardwareNeeded} total)`,
        usage: totalHardwareNeeded,
        unit: "Pieces",
        ratePerUnit: selectedHardware2.cost,
        costPerPart: costPerPart,
        totalCost: totalCost,
        displayOrder: order++,
      });
    }

    // Shipping Cost
    if (
      shippingMethod &&
      shippingMethod !== "Billed to Customer" &&
      shippingCost > 0
    ) {
      let totalCost = shippingCost;
      let usage = 1;
      let unit = "Shipment";
      let description = `Shipping via ${shippingMethod}`;

      // Calculate boxes needed first (used by both UPS and Skid)
      let boxesNeeded = 0;
      if (selectedBox && volumeIn3 > 0) {
        const boxVolume =
          selectedBox.length * selectedBox.width * selectedBox.height;
        const partsPerBox = calculatePartsPerBox(boxVolume, volumeIn3);
        if (partsPerBox > 0) {
          boxesNeeded = Math.ceil(quantity / partsPerBox);
        }
      }

      // For UPS, calculate per-box cost
      if (shippingMethod === "UPS" && boxesNeeded > 0) {
        totalCost = shippingCost * boxesNeeded;
        usage = boxesNeeded;
        unit = "Boxes";
        description = `Shipping via ${shippingMethod} (${boxesNeeded} boxes @ $${shippingCost.toFixed(
          2
        )}/box)`;
      }

      // For Skid, calculate number of skids needed
      if (shippingMethod === "Skid" && selectedBox && boxesNeeded > 0) {
        // Standard skid size: 48" x 40"
        const skidLength = 48;
        const skidWidth = 40;
        const maxStackHeight = 60; // Maximum stack height in inches

        // Calculate boxes per layer on skid
        const boxesPerRowLength = Math.floor(skidLength / selectedBox.length);
        const boxesPerRowWidth = Math.floor(skidWidth / selectedBox.width);
        const boxesPerLayer = boxesPerRowLength * boxesPerRowWidth;

        // Calculate number of layers that fit
        const layersPerSkid = Math.floor(maxStackHeight / selectedBox.height);
        const boxesPerSkid = boxesPerLayer * layersPerSkid;

        if (boxesPerSkid > 0) {
          const skidsNeeded = Math.ceil(boxesNeeded / boxesPerSkid);
          totalCost = shippingCost * skidsNeeded;
          usage = skidsNeeded;
          unit = "Skids";
          description = `Shipping via ${shippingMethod} (${skidsNeeded} skid${
            skidsNeeded > 1 ? "s" : ""
          }, ${boxesNeeded} boxes, ~${boxesPerSkid} boxes/skid @ $${shippingCost.toFixed(
            2
          )}/skid)`;
        }
      }

      const costPerPart = totalCost / quantity;

      items.push({
        category: "Shipping",
        description: description,
        usage: usage,
        unit: unit,
        ratePerUnit:
          shippingMethod === "UPS" || shippingMethod === "Skid"
            ? shippingCost
            : totalCost,
        costPerPart: costPerPart,
        totalCost: totalCost,
        displayOrder: order++,
      });
    }

    // Calculate subtotal BEFORE mold costs for percentage calculations
    const subtotalBeforeMold = items.reduce(
      (sum, item) => sum + item.costPerPart,
      0
    );

    // Mold Amortization (% of subtotal)
    if (moldAmortizationPercent > 0) {
      const costPerPart = subtotalBeforeMold * moldAmortizationPercent;
      const totalCost = costPerPart * quantity;

      items.push({
        category: "Mold Amortization",
        description: `Mold amortization (% of subtotal)`,
        usage: moldAmortizationPercent * 100,
        unit: "%",
        ratePerUnit: subtotalBeforeMold,
        costPerPart: costPerPart,
        totalCost: totalCost,
        displayOrder: order++,
      });

      // Mold Maintenance (% of amortization)
      if (moldMaintenancePercent > 0) {
        const maintenanceCostPerPart = costPerPart * moldMaintenancePercent;
        const maintenanceTotalCost = maintenanceCostPerPart * quantity;

        items.push({
          category: "Mold Maintenance",
          description: `Mold maintenance (% of amortization)`,
          usage: moldMaintenancePercent * 100,
          unit: "%",
          ratePerUnit: costPerPart,
          costPerPart: maintenanceCostPerPart,
          totalCost: maintenanceTotalCost,
          displayOrder: order++,
        });
      }
    }

    // Calculate subtotal (gross cost) for markup and commission
    const subtotal = items.reduce((sum, item) => sum + item.costPerPart, 0);

    if (commissionPercent > 0) {
      // Commission is calculated on base selling price (gross cost + markup)
      const baseSellingPricePerPart = subtotal * (1 + markupPercent);
      const costPerPart = baseSellingPricePerPart * commissionPercent;
      items.push({
        category: "Commission",
        description: `Sales commission (${(commissionPercent * 100).toFixed(
          1
        )}%)`,
        usage: commissionPercent,
        unit: "%",
        ratePerUnit: baseSellingPricePerPart,
        costPerPart: costPerPart,
        totalCost: costPerPart * quantity,
        displayOrder: order++,
      });
    }

    return items;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const primaryTier = quantityTiers[0];
    const lineItems = calculateLineItems(primaryTier.quantity);

    const baseRequest = {
      customerID,
      productID,
      customerName:
        customerInputMode === "select" && customerID
          ? customers.find((c) => c.customerID === customerID)?.name || ""
          : manualCustomerName || companyName,
      productName:
        productInputMode === "select" && productID
          ? products.find((p) => p.productID === productID)?.partName || ""
          : manualProductName || partName,
      validUntil: validUntil || null,
      quantity: primaryTier.quantity,
      notes,
      machineID,
      materialID,
      colorantID,
      additiveID,
      lineItems,
      quantityTiers,

      // Contact Info
      companyName,
      companyAddress,
      contactName,
      contactTitle,
      contactPhone,
      contactFax,
      contactEmail,

      // Part Info
      partNumber,
      partName,
      samplePart,
      has3DCADFile,
      drawingNumber,
      revisionLevel,
      revisionDate: revisionDate || null,
      familyMold,
      moldStatus,
      moldNumber,
      moldMaterial,
      has2DDwg,

      // Part Details
      numberOfDifferentParts: isNaN(numberOfDifferentParts)
        ? 1
        : numberOfDifferentParts,
      numberOfCavities: isNaN(numberOfCavities) ? 1 : numberOfCavities,
      projectedAreaIn2: isNaN(projectedAreaIn2) ? 0 : projectedAreaIn2,
      cycleTimeSeconds: isNaN(cycleTimeSeconds) ? 30 : cycleTimeSeconds,
      partWeightGrams: isNaN(partWeightGrams) ? 0 : partWeightGrams,
      runnerWeightGrams: isNaN(runnerWeightGrams) ? 0 : runnerWeightGrams,
      shotWeightGrams: isNaN(shotWeightGrams) ? 0 : shotWeightGrams,
      regrindPercentAllowed: isNaN(regrindPercentAllowed)
        ? 0
        : regrindPercentAllowed,
      pressSizeTons: isNaN(pressSizeTons) ? 0 : pressSizeTons,
      estimatedPressSizeTons: isNaN(estimatedPressSizeTons)
        ? 0
        : estimatedPressSizeTons,
      volumeIn3: isNaN(volumeIn3) ? 0 : volumeIn3,

      // Labor
      operatorsRequired: operatorRequired ? 1 : 0, // Convert boolean to number for API
      firstPieceInspectionHoursPerRun: 0,
      inProcessInspectionHoursPerDay: 0,
      isirfairInspection,
      numberOfDimsPerCavity: 0,

      // Other
      prototypes,
      packagingDieCharge,
      sonicWeldingHorn,
      excessivePartStorage,
      excessiveSetUpTime,
      piecesPerWeek,
      includeInQuote: true,

      // Terms
      minimumRunQuantity,
      fobPoint,
      deliveryLeadTimeWeeks,
      paymentTerms,
      pricesHeldForDays,

      // Sales
      salesRepresentative,
      commissionToApply: commissionPercent,
      markupPercent: markupPercent,
      ccQuoteTo,

      // Cost Calculation Inputs
      machineRate,
      setupCost,
      purgeCost,
      materialCostPerLb,
      materialLossPercent,
      scrapPercent,
      regrindCostPerLb,
      additiveCostPerLb,
      colorantCostPerLb,
      unusedRegrindValue,
      moldMaintenancePercent,
      moldAmortizationPercent,

      // Labor Rates
      primaryLaborRate,
      qualityLaborRate,
      materialMixingRate,
      secondaryLabor1Rate,
      secondaryLabor2Rate,

      // Hardware and Box
      selectedBoxID,
      selectedHardware1ID,
      hardware1QuantityPerPart,
      selectedHardware2ID,
      hardware2QuantityPerPart,

      // Shipping
      shippingMethod,
      shippingCost,

      // Quality
      cocsRequired,
      tightTolerances,
      uniqueMoldOrProcess,
      existingCustomerOperations: existingCustomerOps,
      estimator,
      quoteType,
    };

    try {
      if (id) {
        // Updating existing quote - create new version
        const updateRequest: UpdateQuoteRequest = {
          ...baseRequest,
          status: "Draft", // Keep as Draft when updating
          changeNotes: changeNotes || "Quote updated",
        };
        console.log(
          "Updating quote with markupPercent:",
          markupPercent,
          "in request:",
          updateRequest.markupPercent
        );
        await axios.put(`/api/quotes/${id}`, updateRequest);
        toast.success("Quote updated successfully! New version created.");
        navigate("/quotes");
      } else {
        // Creating new quote
        const createRequest: CreateQuoteRequest = baseRequest;
        await axios.post("/api/quotes", createRequest);
        toast.success("Quote created successfully!");
        navigate("/quotes");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data || id
          ? "Failed to update quote"
          : "Failed to create quote"
      );
      console.error(error);
    }
  };

  const renderBreakdownModal = () => {
    if (!showBreakdown || selectedTierIndex === null) return null;

    const tier = quantityTiers[selectedTierIndex];
    const lineItems = calculateLineItems(tier.quantity);

    // Calculate gross cost to molder (excluding commission)
    const molderGrossCost = lineItems
      .filter((item) => item.category !== "Commission")
      .reduce((sum, item) => sum + item.totalCost, 0);

    // Find commission amount
    const commissionItem = lineItems.find(
      (item) => item.category === "Commission"
    );
    const commissionAmount = commissionItem ? commissionItem.totalCost : 0;

    const totalWithCommission = molderGrossCost + commissionAmount;

    // Material calculation summary
    const partWeightLbs =
      (isNaN(partWeightGrams) ? 0 : partWeightGrams) / 453.592; // Convert grams to pounds
    const runnerWeightLbs =
      (isNaN(runnerWeightGrams) ? 0 : runnerWeightGrams) / 453.592; // Convert grams to pounds
    const shotWeightLbs = partWeightLbs + runnerWeightLbs; // Gross shot weight per part
    const scrapMultiplier =
      scrapPercent > 0 && scrapPercent < 1 ? 1 + scrapPercent : 1;
    const grossWeightLbsPerPart = shotWeightLbs * scrapMultiplier;

    // Colorant calculations for this tier
    const colorant = colorants.find((c) => c.colorantID === colorantID);
    const colorantLbsPerRun =
      colorant && colorant.letDownRatio > 0
        ? grossWeightLbsPerPart * tier.quantity * colorant.letDownRatio
        : 0;
    const colorantTotalCost = colorantLbsPerRun * colorantCostPerLb;
    const colorantCostPerM =
      tier.quantity > 0 ? (colorantTotalCost * 1000) / tier.quantity : 0;

    // Additive calculations for this tier
    const additive = additives.find((a) => a.additiveID === additiveID);
    const additiveLbsPerRun =
      additive && additive.letDownRatio > 0
        ? grossWeightLbsPerPart * tier.quantity * additive.letDownRatio
        : 0;
    const additiveTotalCost = additiveLbsPerRun * additiveCostPerLb;
    const additiveCostPerM =
      tier.quantity > 0 ? (additiveTotalCost * 1000) / tier.quantity : 0;

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
        onClick={() => setShowBreakdown(false)}
      >
        <div
          id="breakdown-modal-print"
          style={{
            backgroundColor: "#0a0a0a",
            backgroundImage:
              "radial-gradient(circle at center, rgba(0, 255, 65, 0.05), transparent 70%)",
            border: "2px solid #00ff41",
            borderRadius: "12px",
            padding: "32px",
            maxWidth: "1400px",
            width: "95%",
            maxHeight: "85vh",
            overflow: "auto",
            fontFamily: "monospace",
            boxShadow:
              "0 8px 32px rgba(0, 255, 65, 0.3), 0 0 60px rgba(0, 255, 65, 0.15)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Print Styles */}
          <style>
            {`
              @media print {
                /* Hide EVERYTHING on the page first */
                body * {
                  visibility: hidden !important;
                }

                /* Only show the breakdown modal and its contents */
                #breakdown-modal-print,
                #breakdown-modal-print * {
                  visibility: visible !important;
                }

                /* Hide screen-only elements within modal */
                #breakdown-modal-print .no-print,
                #breakdown-modal-print .no-print * {
                  visibility: hidden !important;
                  display: none !important;
                }

                /* Show print-only elements */
                .print-only {
                  display: block !important;
                  visibility: visible !important;
                  margin-bottom: 8px !important;
                  padding-bottom: 6px !important;
                }

                .print-only h1 {
                  font-size: 16px !important;
                  margin: 0 0 4px 0 !important;
                  color: black !important;
                  border: none !important;
                }

                .print-only p {
                  font-size: 9px !important;
                  color: #666 !important;
                }

                /* Force show collapsed sections when printing */
                .print-show {
                  display: block !important;
                  visibility: visible !important;
                }

                /* Reset body and html */
                html, body {
                  background: white !important;
                  color: black !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }

                /* Position modal for print */
                #breakdown-modal-print {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  background: white !important;
                  background-image: none !important;
                  border: none !important;
                  border-radius: 0 !important;
                  padding: 20px !important;
                  margin: 0 !important;
                  box-shadow: none !important;
                  max-height: none !important;
                  overflow: visible !important;
                }

                /* Convert all colors to print-friendly */
                h1, h2, h3, h4, h5, h6, p, span, div, td, th, strong {
                  color: black !important;
                  background: transparent !important;
                  background-image: none !important;
                  box-shadow: none !important;
                  text-shadow: none !important;
                  border-color: #333 !important;
                }

                /* Specific styling for headers */
                h2 {
                  border-bottom: 2px solid #333 !important;
                  page-break-after: avoid !important;
                  padding-bottom: 3px !important;
                  margin-top: 6px !important;
                  margin-bottom: 4px !important;
                  font-size: 13px !important;
                }

                h3 {
                  border-bottom: 1px solid #666 !important;
                  page-break-after: avoid !important;
                  padding-bottom: 2px !important;
                  margin-top: 6px !important;
                  margin-bottom: 4px !important;
                  font-size: 11px !important;
                }

                /* Compact paragraphs and divs */
                p {
                  margin: 1px 0 !important;
                  font-size: 9px !important;
                  line-height: 1.2 !important;
                }

                /* Section dividers */
                div {
                  background: transparent !important;
                  background-image: none !important;
                  border-color: #999 !important;
                }

                /* Remove all colored borders and force neutral colors */
                div[style*="borderBottom"],
                div[style*="border-bottom"],
                div[style*="border:"],
                div[style*="border-left"],
                div[style*="border-right"],
                div[style*="border-top"] {
                  border-color: #ccc !important;
                }

                /* Override specific green colors */
                [style*="#00ff41"],
                [style*="#00ff88"],
                [style*="rgba(0, 255, 65"] {
                  color: black !important;
                  background-color: transparent !important;
                  border-color: #999 !important;
                }

                /* Table styling */
                table {
                  border: 1px solid #333 !important;
                  page-break-inside: auto !important;
                  width: 100% !important;
                  margin: 8px 0 !important;
                  background: white !important;
                  font-size: 9px !important;
                }

                th, td {
                  border: 1px solid #ddd !important;
                  padding: 3px 4px !important;
                  color: black !important;
                  background: white !important;
                  font-size: 9px !important;
                  line-height: 1.2 !important;
                }

                th {
                  background: #f0f0f0 !important;
                  font-weight: bold !important;
                  padding: 4px !important;
                }

                tr:nth-child(even) td {
                  background: #f9f9f9 !important;
                }

                /* Remove all buttons */
                button {
                  display: none !important;
                  visibility: hidden !important;
                }

                /* Hide inputs */
                input, select, textarea {
                  display: none !important;
                  visibility: hidden !important;
                }

                /* Page layout */
                @page {
                  margin: 0.4in;
                  size: letter;
                }

                /* Avoid breaking inside sections */
                section, div[style*="paddingBottom"] {
                  page-break-inside: avoid !important;
                }

                /* Compact spacing for print */
                #breakdown-modal-print {
                  font-size: 9px !important;
                  padding: 0 !important;
                }

                #breakdown-modal-print > div {
                  margin-bottom: 6px !important;
                  padding-bottom: 4px !important;
                }

                /* Make grid layouts more compact */
                div[style*="grid"] {
                  gap: 4px !important;
                }

                /* Reduce padding in cards/boxes */
                div[style*="padding: 8px"],
                div[style*="padding: 12px"],
                div[style*="padding: 16px"],
                div[style*="padding: 10px"],
                div[style*="padding: 14px"] {
                  padding: 3px !important;
                }

                /* Force page break before detailed line items */
                .detailed-line-items-section {
                  page-break-before: always !important;
                  margin-top: 0 !important;
                  padding-top: 10px !important;
                }

                /* Only show detailed line items table in print if using print-show class */
                .detailed-line-items-section table {
                  font-size: 8px !important;
                  margin: 4px 0 !important;
                }

                .detailed-line-items-section th,
                .detailed-line-items-section td {
                  padding: 2px 3px !important;
                  font-size: 8px !important;
                }

                /* Smaller fonts for values */
                span {
                  font-size: 8px !important;
                }

                strong {
                  font-size: 9px !important;
                }

                /* Compact the header grid */
                div[style*="gridTemplateColumns: \"1fr 1fr 1fr\""] {
                  font-size: 8px !important;
                }

                /* Compact notes sections */
                div[style*="borderLeft: \"3px solid"] {
                  padding: 4px 6px !important;
                  margin: 4px 0 !important;
                  font-size: 8px !important;
                }

                /* Fix text alignment - left justify everything */
                div[style*="float: right"] span,
                span[style*="float: right"] {
                  float: none !important;
                  display: inline !important;
                  text-align: left !important;
                }

                /* Prevent overflow on boxes */
                div[style*="border: 2px solid"],
                div[style*="padding: 14px"] {
                  padding: 6px !important;
                  margin-right: 0 !important;
                  box-sizing: border-box !important;
                  max-width: 100% !important;
                  overflow: visible !important;
                }

                /* Fix grid layouts to prevent overflow */
                div[style*="gridTemplateColumns"] {
                  display: block !important;
                }

                div[style*="gridTemplateColumns"] > div {
                  display: block !important;
                  margin-bottom: 8px !important;
                  width: 100% !important;
                }

                /* Remove float layouts in print */
                * {
                  float: none !important;
                }

                /* Hide tier comparison table in print to save space, but keep detailed line items */
                #breakdown-modal-print > div > div > table:not(.detailed-line-items-section table) {
                  display: none !important;
                }

                /* Target the tier comparison table specifically by parent container */
                div[style*="marginTop: \"24px\""] > table {
                  display: none !important;
                }

                /* Compact profitability cards */
                div[style*="padding: 16px"] {
                  padding: 4px 6px !important;
                  margin: 2px 0 !important;
                }

                /* Tighten section margins */
                div[style*="marginBottom: \"24px\""] {
                  margin-bottom: 8px !important;
                }

                /* Make profitability section single column in print */
                div[style*="gridTemplateColumns: \"repeat(3, 1fr)\""] {
                  display: block !important;
                }

                div[style*="gridTemplateColumns: \"repeat(3, 1fr)\""] > div {
                  display: block !important;
                  margin-bottom: 4px !important;
                  page-break-inside: avoid !important;
                }

                /* Reduce large font sizes in profitability cards */
                div[style*="fontSize: \"1.5em\""] {
                  font-size: 11px !important;
                }

                div[style*="fontSize: \"1.3em\""] {
                  font-size: 10px !important;
                }

                div[style*="fontSize: \"1.2em\""] {
                  font-size: 10px !important;
                }

                div[style*="fontSize: \"1.1em\""] {
                  font-size: 9px !important;
                }
              }
            `}
          </style>

          {/* Print-only header */}
          <div
            className="print-only"
            style={{
              display: "none",
              marginBottom: "6px",
              textAlign: "center",
              borderBottom: "1px solid #333",
              paddingBottom: "4px",
            }}
          >
            <h1
              style={{
                margin: "0 0 2px 0",
                fontSize: "12px",
                color: "#000",
                fontWeight: "bold",
              }}
            >
              Quote Breakdown
            </h1>
            <p style={{ margin: "0", fontSize: "8px", color: "#666" }}>
              Generated on{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          {/* HEADER: Quote/Part Info */}
          <div
            style={{
              marginBottom: "24px",
              borderBottom: "3px double #00ff41",
              paddingBottom: "16px",
            }}
          >
            <h2
              style={{
                color: "#00ff41",
                marginTop: 0,
                marginBottom: "8px",
                fontSize: "24px",
                fontWeight: "bold",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              QUOTE BREAKDOWN - TIER {tier.tierNumber}
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "16px",
                fontSize: "14px",
                color: "#00ff88",
              }}
            >
              <div>
                <p style={{ margin: "2px 0" }}>
                  <strong>Quote #:</strong> Q-{new Date().getFullYear()}-
                  {String(Math.floor(Math.random() * 9999)).padStart(4, "0")}
                </p>
                <p style={{ margin: "2px 0" }}>
                  <strong>Date:</strong>{" "}
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p style={{ margin: "2px 0" }}>
                  <strong>Customer:</strong>{" "}
                  {customerInputMode === "select" && customerID
                    ? customers.find((c) => c.customerID === customerID)
                        ?.name || "TBD"
                    : manualCustomerName || companyName || "TBD"}
                </p>
                <p style={{ margin: "2px 0" }}>
                  <strong>Part:</strong>{" "}
                  {productInputMode === "select" && productID
                    ? products.find((p) => p.productID === productID)
                        ?.partName || "TBD"
                    : manualProductName || partName || "TBD"}
                </p>
              </div>
              <div>
                <p style={{ margin: "2px 0" }}>
                  <strong>Quantity:</strong> {tier.quantity.toLocaleString()}{" "}
                  parts
                </p>
                <p style={{ margin: "2px 0" }}>
                  <strong>Material:</strong> {selectedMaterial?.name || "N/A"}
                </p>
              </div>
            </div>

            {/* Notes and Change Notes */}
            {(notes || changeNotes) && (
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {notes && (
                  <div style={{ padding: "12px" }}>
                    <div
                      style={{
                        fontWeight: "bold",
                        color: "#00ff41",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        fontSize: "0.9em",
                      }}
                    >
                      Notes:
                    </div>
                    <div
                      style={{
                        color: "#00ff88",
                        fontSize: "13px",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {notes}
                    </div>
                  </div>
                )}
                {changeNotes && (
                  <div style={{ padding: "12px" }}>
                    <div
                      style={{
                        fontWeight: "bold",
                        color: "#00ff41",
                        marginBottom: "6px",
                        textTransform: "uppercase",
                        fontSize: "0.9em",
                      }}
                    >
                      Change Notes:
                    </div>
                    <div
                      style={{
                        color: "#00ff88",
                        fontSize: "13px",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {changeNotes}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Bar - Top */}
            <div
              className="no-print"
              style={{
                marginTop: "16px",
                display: "flex",
                gap: "12px",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {/* Tier Navigation */}
              {quantityTiers.length > 1 ? (
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => setSelectedTierIndex(selectedTierIndex! - 1)}
                    disabled={selectedTierIndex === 0}
                    style={{
                      padding: "10px 20px",
                      background:
                        selectedTierIndex === 0
                          ? "rgba(50, 50, 50, 0.3)"
                          : "linear-gradient(135deg, #00ff41 0%, #00ff88 100%)",
                      color: selectedTierIndex === 0 ? "#666" : "#000",
                      border:
                        selectedTierIndex === 0 ? "1px solid #333" : "none",
                      borderRadius: "8px",
                      cursor:
                        selectedTierIndex === 0 ? "not-allowed" : "pointer",
                      fontWeight: "bold",
                      fontFamily: "monospace",
                      letterSpacing: "0.5px",
                      transition: "all 0.3s ease",
                      boxShadow:
                        selectedTierIndex === 0
                          ? "none"
                          : "0 2px 10px rgba(0, 255, 65, 0.3)",
                    }}
                    onMouseOver={(e) => {
                      if (selectedTierIndex !== 0) {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 15px rgba(0, 255, 65, 0.5)";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedTierIndex !== 0) {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 10px rgba(0, 255, 65, 0.3)";
                      }
                    }}
                  >
                    ◄ Previous Tier
                  </button>
                  <button
                    onClick={() => setSelectedTierIndex(selectedTierIndex! + 1)}
                    disabled={selectedTierIndex === quantityTiers.length - 1}
                    style={{
                      padding: "10px 20px",
                      background:
                        selectedTierIndex === quantityTiers.length - 1
                          ? "rgba(50, 50, 50, 0.3)"
                          : "linear-gradient(135deg, #00ff41 0%, #00ff88 100%)",
                      color:
                        selectedTierIndex === quantityTiers.length - 1
                          ? "#666"
                          : "#000",
                      border:
                        selectedTierIndex === quantityTiers.length - 1
                          ? "1px solid #333"
                          : "none",
                      borderRadius: "8px",
                      cursor:
                        selectedTierIndex === quantityTiers.length - 1
                          ? "not-allowed"
                          : "pointer",
                      fontWeight: "bold",
                      fontFamily: "monospace",
                      letterSpacing: "0.5px",
                      transition: "all 0.3s ease",
                      boxShadow:
                        selectedTierIndex === quantityTiers.length - 1
                          ? "none"
                          : "0 2px 10px rgba(0, 255, 65, 0.3)",
                    }}
                    onMouseOver={(e) => {
                      if (selectedTierIndex !== quantityTiers.length - 1) {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 15px rgba(0, 255, 65, 0.5)";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedTierIndex !== quantityTiers.length - 1) {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 10px rgba(0, 255, 65, 0.3)";
                      }
                    }}
                  >
                    Next Tier ►
                  </button>
                </div>
              ) : (
                <div></div>
              )}

              {/* Print Button */}
              <button
                onClick={() => window.print()}
                className="no-print"
                style={{
                  padding: "10px 20px",
                  background:
                    "linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontFamily: "monospace",
                  letterSpacing: "0.5px",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 10px rgba(65, 105, 225, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 15px rgba(65, 105, 225, 0.5)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 10px rgba(65, 105, 225, 0.3)";
                }}
              >
                <span>🖨</span> Print / Export PDF
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SECTION 2: PRODUCTION / MOLDING DETAILS */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div
            style={{
              marginBottom: "24px",
              paddingBottom: "20px",
              borderBottom: "3px solid rgba(0, 255, 65, 0.3)",
            }}
          >
            <h3
              style={{
                color: "#00ff41",
                fontSize: "18px",
                fontWeight: "bold",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                marginTop: 0,
                marginBottom: "16px",
              }}
            >
              PRODUCTION / MOLDING DETAILS
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px 24px",
                fontSize: "14px",
                color: "#00ff88",
              }}
            >
              <div>
                <strong>Run Quantity:</strong>{" "}
                <span style={{ color: "#00ff41", fontWeight: "bold" }}>
                  {tier.quantity.toLocaleString()}
                </span>{" "}
                parts
              </div>
              <div>
                <strong># of Cavities:</strong>{" "}
                <span style={{ color: "#00ff41", fontWeight: "bold" }}>
                  {numberOfCavities || 0}
                </span>
              </div>
              <div>
                <strong>Machine Rate:</strong>{" "}
                <span style={{ color: "#00ff41", fontWeight: "bold" }}>
                  ${machineRate.toFixed(2)}
                </span>
                /hr
              </div>
              <div>
                <strong>Cycle Time:</strong>{" "}
                <span style={{ color: "#00ff41", fontWeight: "bold" }}>
                  {cycleTimeSeconds.toFixed(2)}
                </span>
                s
              </div>
              <div>
                <strong>Scrap %:</strong>{" "}
                <span style={{ color: "#00ff41", fontWeight: "bold" }}>
                  {(scrapPercent * 100).toFixed(2)}%
                </span>
              </div>
              <div>
                <strong>Pieces/Hour:</strong>{" "}
                <span style={{ color: "#00ff41", fontWeight: "bold" }}>
                  {cycleTimeSeconds > 0
                    ? Math.round(3600 / cycleTimeSeconds)
                    : 0}
                </span>
              </div>
              <div>
                <strong>Hours per 1,000:</strong>{" "}
                <span style={{ color: "#00ff41", fontWeight: "bold" }}>
                  {cycleTimeSeconds > 0
                    ? (1000 / (3600 / cycleTimeSeconds)).toFixed(2)
                    : "0.00"}
                </span>{" "}
                hrs
              </div>
              <div>
                <strong>Molding $/1,000:</strong>{" "}
                <span style={{ color: "#00ff41", fontWeight: "bold" }}>
                  $
                  {cycleTimeSeconds > 0
                    ? (
                        (1000 / (3600 / cycleTimeSeconds)) *
                        machineRate
                      ).toFixed(2)
                    : "0.00"}
                </span>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SECTION 3: MATERIAL CALCULATION */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div
            style={{
              marginBottom: "24px",
              paddingBottom: "20px",
              borderBottom: "3px solid rgba(0, 255, 65, 0.3)",
            }}
          >
            <h3
              style={{
                color: "#00ff41",
                fontSize: "18px",
                fontWeight: "bold",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                marginTop: 0,
                marginBottom: "16px",
              }}
            >
              MATERIAL CALCULATION
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px 48px",
                fontSize: "14px",
                color: "#00ff88",
              }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <div>
                  <strong>Material:</strong>{" "}
                  <span style={{ color: "#00ff41" }}>
                    {selectedMaterial?.name || "N/A"}
                  </span>
                </div>
                <div>
                  <strong>Density:</strong>{" "}
                  <span style={{ color: "#00ff41" }}>
                    {meltDensity ? meltDensity.toFixed(4) : "N/A"}
                  </span>{" "}
                  g/cm³
                </div>
                <div>
                  <strong>Part Weight:</strong>{" "}
                  <span style={{ color: "#00ff41", fontWeight: "bold" }}>
                    {(isNaN(partWeightGrams) ? 0 : partWeightGrams).toFixed(2)}
                  </span>{" "}
                  g
                </div>
                <div
                  style={{
                    fontSize: "0.9em",
                    fontStyle: "italic",
                    paddingLeft: "20px",
                  }}
                >
                  <strong>Net Part Lbs/M:</strong>{" "}
                  <span style={{ color: "#00ffaa" }}>
                    {(
                      ((isNaN(partWeightGrams) ? 0 : partWeightGrams) * 1000) /
                      453.592
                    ).toFixed(2)}
                  </span>{" "}
                  lbs (virgin equiv.)
                </div>
                <div>
                  <strong>Runner Weight:</strong>{" "}
                  <span style={{ color: "#00ff41" }}>
                    {(isNaN(runnerWeightGrams) ? 0 : runnerWeightGrams).toFixed(
                      2
                    )}
                  </span>{" "}
                  g
                </div>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <div>
                  <strong>Part Scrap %:</strong>{" "}
                  <span style={{ color: "#00ff41" }}>
                    {((isNaN(scrapPercent) ? 0 : scrapPercent) * 100).toFixed(
                      2
                    )}
                    %
                  </span>
                </div>
                <div>
                  <strong>Material Loss:</strong>{" "}
                  <span style={{ color: "#00ff41" }}>
                    {(isNaN(materialLossPercent)
                      ? 0
                      : materialLossPercent
                    ).toFixed(2)}
                    %
                  </span>
                </div>
                <div>
                  <strong>Gross Weight/M:</strong>{" "}
                  <span style={{ color: "#00ff41", fontWeight: "bold" }}>
                    {(
                      (isNaN(grossWeightLbsPerPart)
                        ? 0
                        : grossWeightLbsPerPart) * 1000
                    ).toFixed(4)}
                  </span>{" "}
                  lbs
                </div>
                <div>
                  <strong>Material Cost/Lb:</strong>{" "}
                  <span style={{ color: "#00ff41" }}>
                    $
                    {(isNaN(materialCostPerLb) ? 0 : materialCostPerLb).toFixed(
                      2
                    )}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: "4px",
                    padding: "8px",
                    backgroundColor: "rgba(0, 255, 65, 0.1)",
                    borderRadius: "4px",
                  }}
                >
                  <strong style={{ fontSize: "1.1em" }}>
                    Material $/M PCS:
                  </strong>{" "}
                  <span
                    style={{
                      color: "#00ff41",
                      fontWeight: "bold",
                      fontSize: "1.2em",
                    }}
                  >
                    $
                    {(() => {
                      const baseMaterialCost =
                        (isNaN(grossWeightLbsPerPart)
                          ? 0
                          : grossWeightLbsPerPart) *
                        (isNaN(materialCostPerLb) ? 0 : materialCostPerLb) *
                        tier.quantity;
                      const materialLossDollars =
                        baseMaterialCost *
                        ((isNaN(materialLossPercent)
                          ? 0
                          : materialLossPercent) /
                          100);
                      const materialCost =
                        (isNaN(grossWeightLbsPerPart)
                          ? 0
                          : grossWeightLbsPerPart) *
                          (isNaN(materialCostPerLb) ? 0 : materialCostPerLb) *
                          1000 +
                        (materialLossDollars / tier.quantity) * 1000;
                      return (materialCost + colorantCostPerM).toFixed(2);
                    })()}
                  </span>
                </div>
              </div>
            </div>
            {/* Colorant/Additive sub-sections */}
            {(colorantID || additiveID) && (
              <div
                style={{
                  marginTop: "16px",
                  display: "grid",
                  gridTemplateColumns:
                    colorantID && additiveID ? "1fr 1fr" : "1fr",
                  gap: "16px",
                }}
              >
                {colorantID && (
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "rgba(0, 255, 65, 0.05)",
                      borderLeft: "3px solid #00ff88",
                      borderRadius: "4px",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: "8px",
                        fontWeight: "bold",
                        color: "#00ff88",
                        textTransform: "uppercase",
                        fontSize: "0.9em",
                      }}
                    >
                      Colorant
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        fontSize: "13px",
                      }}
                    >
                      <div>
                        <strong>{colorant?.name || "N/A"}</strong> (
                        {colorant?.code || "N/A"})
                      </div>
                      <div>
                        Lbs per Run:{" "}
                        <span style={{ color: "#00ff41" }}>
                          {colorantLbsPerRun.toFixed(4)}
                        </span>{" "}
                        @ $
                        {(isNaN(colorantCostPerLb)
                          ? 0
                          : colorantCostPerLb
                        ).toFixed(4)}
                        /lb
                      </div>
                      <div>
                        <strong>$/M PCS:</strong>{" "}
                        <span style={{ color: "#00ff41", fontWeight: "bold" }}>
                          ${colorantCostPerM.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                {additiveID && (
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "rgba(0, 255, 65, 0.05)",
                      borderLeft: "3px solid #00ff88",
                      borderRadius: "4px",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: "8px",
                        fontWeight: "bold",
                        color: "#00ff88",
                        textTransform: "uppercase",
                        fontSize: "0.9em",
                      }}
                    >
                      Additive
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        fontSize: "13px",
                      }}
                    >
                      <div>
                        <strong>{additive?.name || "N/A"}</strong> (
                        {additive?.type || "N/A"})
                      </div>
                      <div>
                        Lbs per Run:{" "}
                        <span style={{ color: "#00ff41" }}>
                          {additiveLbsPerRun.toFixed(4)}
                        </span>{" "}
                        @ $
                        {(isNaN(additiveCostPerLb)
                          ? 0
                          : additiveCostPerLb
                        ).toFixed(4)}
                        /lb
                      </div>
                      <div>
                        <strong>$/M PCS:</strong>{" "}
                        <span style={{ color: "#00ff41", fontWeight: "bold" }}>
                          ${additiveCostPerM.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SECTION 4: PACKAGING / BOX */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {selectedBox && volumeIn3 > 0 && (
            <div
              style={{
                marginBottom: "24px",
                paddingBottom: "20px",
                borderBottom: "3px solid rgba(0, 255, 65, 0.3)",
              }}
            >
              <h3
                style={{
                  color: "#00ff41",
                  fontSize: "18px",
                  fontWeight: "bold",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  marginTop: 0,
                  marginBottom: "16px",
                }}
              >
                PACKAGING / BOX
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px 48px",
                  fontSize: "14px",
                  color: "#00ff88",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div>
                    <strong>Box:</strong>{" "}
                    <span style={{ color: "#00ff41" }}>{selectedBox.name}</span>
                  </div>
                  <div>
                    <strong>Dimensions:</strong>{" "}
                    <span style={{ color: "#00ff41" }}>
                      {selectedBox.length}" × {selectedBox.width}" ×{" "}
                      {selectedBox.height}"
                    </span>
                  </div>
                  <div>
                    <strong>Part Volume:</strong>{" "}
                    <span style={{ color: "#00ff41" }}>
                      {volumeIn3.toFixed(2)}
                    </span>{" "}
                    in³
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div>
                    <strong>Parts per Box:</strong>{" "}
                    <span style={{ color: "#00ff41", fontWeight: "bold" }}>
                      {(() => {
                        const boxVolume =
                          selectedBox.length *
                          selectedBox.width *
                          selectedBox.height;
                        const partsPerBox = calculatePartsPerBox(
                          boxVolume,
                          volumeIn3
                        );
                        return partsPerBox;
                      })()}
                    </span>{" "}
                    {actualPartsPerBox ? (
                      <span
                        style={{
                          fontSize: "0.85em",
                          fontStyle: "italic",
                          color: "#00ffaa",
                        }}
                      >
                        (manual override)
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.85em", fontStyle: "italic" }}>
                        (45% packing eff.)
                      </span>
                    )}
                  </div>
                  <div>
                    <strong>Boxes Needed:</strong>{" "}
                    <span style={{ color: "#00ff41", fontWeight: "bold" }}>
                      {(() => {
                        const boxVolume =
                          selectedBox.length *
                          selectedBox.width *
                          selectedBox.height;
                        const partsPerBox = calculatePartsPerBox(
                          boxVolume,
                          volumeIn3
                        );
                        return partsPerBox > 0
                          ? Math.ceil(tier.quantity / partsPerBox)
                          : 0;
                      })()}
                    </span>
                  </div>
                  <div>
                    <strong>Cost per Box:</strong>{" "}
                    <span style={{ color: "#00ff41" }}>
                      ${selectedBox.cost.toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: "4px",
                      padding: "8px",
                      backgroundColor: "rgba(0, 255, 65, 0.1)",
                      borderRadius: "4px",
                    }}
                  >
                    <strong>Total Box Cost:</strong>{" "}
                    <span
                      style={{
                        color: "#00ff41",
                        fontWeight: "bold",
                        fontSize: "1.1em",
                      }}
                    >
                      $
                      {(() => {
                        const boxVolume =
                          selectedBox.length *
                          selectedBox.width *
                          selectedBox.height;
                        const partsPerBox = calculatePartsPerBox(
                          boxVolume,
                          volumeIn3
                        );
                        const boxesNeeded =
                          partsPerBox > 0
                            ? Math.ceil(tier.quantity / partsPerBox)
                            : 0;
                        return (boxesNeeded * selectedBox.cost).toFixed(2);
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SECTION 5: AUXILIARY / OTHER COSTS */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {(setupCost > 0 ||
            purgeCost > 0 ||
            secondaryLabor1TimePerPiece > 0 ||
            secondaryLabor2TimePerPiece > 0) && (
            <div
              style={{
                marginBottom: "24px",
                paddingBottom: "20px",
                borderBottom: "3px solid rgba(0, 255, 65, 0.3)",
              }}
            >
              <h3
                style={{
                  color: "#00ff41",
                  fontSize: "18px",
                  fontWeight: "bold",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  marginTop: 0,
                  marginBottom: "16px",
                }}
              >
                AUXILIARY / OTHER COSTS
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px 48px",
                  fontSize: "14px",
                  color: "#00ff88",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {setupCost > 0 && (
                    <div>
                      <strong>Setup Charge:</strong>{" "}
                      <span style={{ color: "#00ff41" }}>
                        ${setupCost.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {purgeCost > 0 && (
                    <div>
                      <strong>Purge/Cleaning:</strong>{" "}
                      <span style={{ color: "#00ff41" }}>
                        ${purgeCost.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {secondaryLabor1TimePerPiece > 0 && (
                    <div>
                      <strong>
                        {secondaryLabor1Description || "Secondary Op #1"}:
                      </strong>{" "}
                      <span style={{ color: "#00ff41" }}>
                        $
                        {(
                          (secondaryLabor1TimePerPiece / 3600) *
                          tier.quantity *
                          secondaryLabor1Rate
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {secondaryLabor2TimePerPiece > 0 && (
                    <div>
                      <strong>
                        {secondaryLabor2Description || "Secondary Op #2"}:
                      </strong>{" "}
                      <span style={{ color: "#00ff41" }}>
                        $
                        {(
                          (secondaryLabor2TimePerPiece / 3600) *
                          tier.quantity *
                          secondaryLabor2Rate
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      marginTop: "4px",
                      padding: "8px",
                      backgroundColor: "rgba(0, 255, 65, 0.1)",
                      borderRadius: "4px",
                    }}
                  >
                    <strong>Total Auxiliary Costs:</strong>{" "}
                    <span
                      style={{
                        color: "#00ff41",
                        fontWeight: "bold",
                        fontSize: "1.1em",
                      }}
                    >
                      $
                      {(() => {
                        let total = (setupCost || 0) + (purgeCost || 0);
                        if (secondaryLabor1TimePerPiece > 0)
                          total +=
                            (secondaryLabor1TimePerPiece / 3600) *
                            tier.quantity *
                            secondaryLabor1Rate;
                        if (secondaryLabor2TimePerPiece > 0)
                          total +=
                            (secondaryLabor2TimePerPiece / 3600) *
                            tier.quantity *
                            secondaryLabor2Rate;
                        return total.toFixed(2);
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SECTION 6: PRICING / MARKUP */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div
            style={{
              marginBottom: "24px",
              paddingBottom: "20px",
              borderBottom: "3px solid rgba(0, 255, 65, 0.3)",
            }}
          >
            <h3
              style={{
                color: "#00ff41",
                fontSize: "18px",
                fontWeight: "bold",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                marginTop: 0,
                marginBottom: "16px",
              }}
            >
              PRICING / MARKUP
            </h3>
            {(() => {
              // Calculate component costs per M
              const materialItems = lineItems.filter(
                (item) =>
                  item.category === "Material" ||
                  item.category === "Material Loss" ||
                  item.category === "Colorant" ||
                  item.category === "Additive" ||
                  item.category === "Regrind Credit"
              );
              const materialCostPerM =
                (materialItems.reduce((sum, item) => sum + item.totalCost, 0) *
                  1000) /
                tier.quantity;

              const moldingItems = lineItems.filter(
                (item) =>
                  item.category === "Machine Hours" ||
                  item.category === "Mold Amortization" ||
                  item.category === "Mold Maintenance"
              );
              const moldingCostPerM =
                (moldingItems.reduce((sum, item) => sum + item.totalCost, 0) *
                  1000) /
                tier.quantity;

              const packagingItems = lineItems.filter(
                (item) =>
                  item.category === "Packaging" ||
                  item.category === "Hardware 1" ||
                  item.category === "Hardware 2"
              );
              const packagingCostPerM =
                (packagingItems.reduce((sum, item) => sum + item.totalCost, 0) *
                  1000) /
                tier.quantity;

              const auxiliaryItems = lineItems.filter(
                (item) =>
                  item.category === "Set-Up" ||
                  item.category === "Purge/Cleaning" ||
                  item.category === "Primary Labor" ||
                  item.category === "Quality Labor" ||
                  item.category === "Material Mixing" ||
                  item.category === "Secondary Op #1" ||
                  item.category === "Secondary Op #2" ||
                  item.category === "Shipping"
              );
              const auxiliaryCostPerM =
                (auxiliaryItems.reduce((sum, item) => sum + item.totalCost, 0) *
                  1000) /
                tier.quantity;

              const grossCostPerM = (molderGrossCost * 1000) / tier.quantity;
              const markupDollars = molderGrossCost * markupPercent;
              const markupPerM = (markupDollars * 1000) / tier.quantity;
              const baseSellingPricePerM = grossCostPerM + markupPerM;
              const commissionPerM = (commissionAmount * 1000) / tier.quantity;
              const totalSellingPricePerM =
                (totalWithCommission * 1000) / tier.quantity;

              return (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "24px 48px",
                      fontSize: "14px",
                      color: "#00ff88",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          padding: "8px",
                          backgroundColor: "rgba(0, 255, 65, 0.05)",
                          borderRadius: "4px",
                        }}
                      >
                        <strong>Material $/M:</strong>{" "}
                        <span style={{ color: "#00ff41", float: "right" }}>
                          ${materialCostPerM.toFixed(2)}
                        </span>
                      </div>
                      <div
                        style={{
                          padding: "8px",
                          backgroundColor: "rgba(0, 255, 65, 0.05)",
                          borderRadius: "4px",
                        }}
                      >
                        <strong>Molding $/M:</strong>{" "}
                        <span style={{ color: "#00ff41", float: "right" }}>
                          ${moldingCostPerM.toFixed(2)}
                        </span>
                      </div>
                      <div
                        style={{
                          padding: "8px",
                          backgroundColor: "rgba(0, 255, 65, 0.05)",
                          borderRadius: "4px",
                        }}
                      >
                        <strong>Packaging $/M:</strong>{" "}
                        <span style={{ color: "#00ff41", float: "right" }}>
                          ${packagingCostPerM.toFixed(2)}
                        </span>
                      </div>
                      <div
                        style={{
                          padding: "8px",
                          backgroundColor: "rgba(0, 255, 65, 0.05)",
                          borderRadius: "4px",
                        }}
                      >
                        <strong>Auxiliary/Other $/M:</strong>{" "}
                        <span style={{ color: "#00ff41", float: "right" }}>
                          ${auxiliaryCostPerM.toFixed(2)}
                        </span>
                      </div>
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: "rgba(0, 255, 65, 0.15)",
                          borderRadius: "6px",
                          marginTop: "8px",
                        }}
                      >
                        <strong style={{ fontSize: "1.1em" }}>
                          Gross Cost / Factory Cost $/M:
                        </strong>
                        <div
                          style={{
                            color: "#00ff41",
                            fontWeight: "bold",
                            fontSize: "1.3em",
                            marginTop: "4px",
                          }}
                        >
                          ${grossCostPerM.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          padding: "8px",
                          backgroundColor: "rgba(0, 255, 65, 0.05)",
                          borderRadius: "4px",
                        }}
                      >
                        <strong>Markup %:</strong>{" "}
                        <span style={{ color: "#00ff41", float: "right" }}>
                          {(markupPercent * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div
                        style={{
                          padding: "8px",
                          backgroundColor: "rgba(0, 255, 65, 0.05)",
                          borderRadius: "4px",
                        }}
                      >
                        <strong>Markup $/M:</strong>{" "}
                        <span style={{ color: "#00ff41", float: "right" }}>
                          ${markupPerM.toFixed(2)}
                        </span>
                      </div>
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: "rgba(0, 255, 65, 0.12)",
                          borderRadius: "6px",
                          marginTop: "8px",
                        }}
                      >
                        <strong style={{ fontSize: "1.05em" }}>
                          Base Selling Price $/M:
                        </strong>
                        <div
                          style={{
                            color: "#00ff88",
                            fontWeight: "bold",
                            fontSize: "1.2em",
                            marginTop: "4px",
                          }}
                        >
                          ${baseSellingPricePerM.toFixed(2)}
                        </div>
                      </div>
                      {commissionAmount > 0 && (
                        <>
                          <div
                            style={{
                              padding: "8px",
                              backgroundColor: "rgba(0, 255, 65, 0.05)",
                              borderRadius: "4px",
                              marginTop: "8px",
                            }}
                          >
                            <strong>Commission $/M:</strong>{" "}
                            <span style={{ color: "#00ff41", float: "right" }}>
                              ${commissionPerM.toFixed(2)}
                            </span>
                          </div>
                          <div
                            style={{
                              padding: "14px",
                              backgroundColor: "rgba(0, 255, 65, 0.2)",
                              borderRadius: "8px",
                              border: "2px solid #00ff41",
                            }}
                          >
                            <strong style={{ fontSize: "1.15em" }}>
                              TOTAL SELLING PRICE $/M:
                            </strong>
                            <div
                              style={{
                                color: "#00ff41",
                                fontWeight: "bold",
                                fontSize: "1.5em",
                                marginTop: "6px",
                                textShadow: "0 0 10px rgba(0, 255, 65, 0.5)",
                              }}
                            >
                              ${totalSellingPricePerM.toFixed(2)}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quantity Tiers Breakdown Table */}
                  {quantityTiers.length > 1 && (
                    <div style={{ marginTop: "24px", overflowX: "auto" }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "12px",
                          color: "#00ff88",
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              backgroundColor: "rgba(0, 255, 65, 0.15)",
                              borderBottom: "2px solid #00ff41",
                            }}
                          >
                            <th
                              style={{
                                padding: "10px 8px",
                                textAlign: "left",
                                fontWeight: "bold",
                                color: "#00ff41",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Quantity
                            </th>
                            <th
                              style={{
                                padding: "10px 8px",
                                textAlign: "right",
                                fontWeight: "bold",
                                color: "#00ff41",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Material $/M
                            </th>
                            <th
                              style={{
                                padding: "10px 8px",
                                textAlign: "right",
                                fontWeight: "bold",
                                color: "#00ff41",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Molding $/M
                            </th>
                            <th
                              style={{
                                padding: "10px 8px",
                                textAlign: "right",
                                fontWeight: "bold",
                                color: "#00ff41",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Packaging $/M
                            </th>
                            <th
                              style={{
                                padding: "10px 8px",
                                textAlign: "right",
                                fontWeight: "bold",
                                color: "#00ff41",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Auxiliary $/M
                            </th>
                            <th
                              style={{
                                padding: "10px 8px",
                                textAlign: "right",
                                fontWeight: "bold",
                                color: "#00ff41",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Gross Factory $/M
                            </th>
                            <th
                              style={{
                                padding: "10px 8px",
                                textAlign: "right",
                                fontWeight: "bold",
                                color: "#00ff41",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Selling Price $/M
                            </th>
                            <th
                              style={{
                                padding: "10px 8px",
                                textAlign: "right",
                                fontWeight: "bold",
                                color: "#00ff41",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Reduction from Base
                            </th>
                            <th
                              style={{
                                padding: "10px 8px",
                                textAlign: "left",
                                fontWeight: "bold",
                                color: "#00ff41",
                              }}
                            >
                              Notes
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {quantityTiers.map((tierData, idx) => {
                            const tierLineItems = calculateLineItems(
                              tierData.quantity
                            );

                            const tierMaterialItems = tierLineItems.filter(
                              (item) =>
                                item.category === "Material" ||
                                item.category === "Material Loss" ||
                                item.category === "Colorant" ||
                                item.category === "Additive" ||
                                item.category === "Regrind Credit"
                            );
                            const tierMaterialCostPerM =
                              (tierMaterialItems.reduce(
                                (sum, item) => sum + item.totalCost,
                                0
                              ) *
                                1000) /
                              tierData.quantity;

                            const tierMoldingItems = tierLineItems.filter(
                              (item) =>
                                item.category === "Machine Hours" ||
                                item.category === "Mold Amortization" ||
                                item.category === "Mold Maintenance"
                            );
                            const tierMoldingCostPerM =
                              (tierMoldingItems.reduce(
                                (sum, item) => sum + item.totalCost,
                                0
                              ) *
                                1000) /
                              tierData.quantity;

                            const tierPackagingItems = tierLineItems.filter(
                              (item) =>
                                item.category === "Packaging" ||
                                item.category === "Hardware 1" ||
                                item.category === "Hardware 2"
                            );
                            const tierPackagingCostPerM =
                              (tierPackagingItems.reduce(
                                (sum, item) => sum + item.totalCost,
                                0
                              ) *
                                1000) /
                              tierData.quantity;

                            const tierAuxiliaryItems = tierLineItems.filter(
                              (item) =>
                                item.category === "Set-Up" ||
                                item.category === "Purge/Cleaning" ||
                                item.category === "Primary Labor" ||
                                item.category === "Quality Labor" ||
                                item.category === "Material Mixing" ||
                                item.category === "Secondary Op #1" ||
                                item.category === "Secondary Op #2" ||
                                item.category === "Shipping"
                            );
                            const tierAuxiliaryCostPerM =
                              (tierAuxiliaryItems.reduce(
                                (sum, item) => sum + item.totalCost,
                                0
                              ) *
                                1000) /
                              tierData.quantity;

                            const tierMolderGrossCost = tierLineItems
                              .filter((item) => item.category !== "Commission")
                              .reduce((sum, item) => sum + item.totalCost, 0);
                            const tierGrossCostPerM =
                              (tierMolderGrossCost * 1000) / tierData.quantity;

                            const tierSellingPricePerM =
                              tierData.pricePerPart * 1000;

                            const baseSellingPrice = quantityTiers[0]
                              ? quantityTiers[0].pricePerPart * 1000
                              : tierSellingPricePerM;
                            const reduction =
                              baseSellingPrice - tierSellingPricePerM;
                            const reductionPercent =
                              baseSellingPrice > 0
                                ? (reduction / baseSellingPrice) * 100
                                : 0;

                            const isCurrentTier = idx === selectedTierIndex;

                            return (
                              <tr
                                key={idx}
                                style={{
                                  backgroundColor: isCurrentTier
                                    ? "rgba(0, 255, 65, 0.08)"
                                    : idx % 2 === 0
                                    ? "rgba(0, 255, 65, 0.02)"
                                    : "transparent",
                                  borderBottom:
                                    "1px solid rgba(0, 255, 65, 0.1)",
                                }}
                              >
                                <td
                                  style={{
                                    padding: "8px",
                                    fontWeight: isCurrentTier
                                      ? "bold"
                                      : "normal",
                                    color: isCurrentTier
                                      ? "#00ff41"
                                      : "#00ff88",
                                  }}
                                >
                                  {tierData.quantity.toLocaleString()}
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    textAlign: "right",
                                    color: "#00ff88",
                                  }}
                                >
                                  ${tierMaterialCostPerM.toFixed(2)}
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    textAlign: "right",
                                    color: "#00ff88",
                                  }}
                                >
                                  ${tierMoldingCostPerM.toFixed(2)}
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    textAlign: "right",
                                    color: "#00ff88",
                                  }}
                                >
                                  ${tierPackagingCostPerM.toFixed(2)}
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    textAlign: "right",
                                    color: "#00ff88",
                                  }}
                                >
                                  ${tierAuxiliaryCostPerM.toFixed(2)}
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    textAlign: "right",
                                    fontWeight: "bold",
                                    color: "#00ff41",
                                  }}
                                >
                                  ${tierGrossCostPerM.toFixed(2)}
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    textAlign: "right",
                                    fontWeight: "bold",
                                    color: "#00ff41",
                                  }}
                                >
                                  ${tierSellingPricePerM.toFixed(2)}
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    textAlign: "right",
                                    color:
                                      reduction > 0 ? "#00ff88" : "#ff8888",
                                  }}
                                >
                                  {idx === 0
                                    ? "-"
                                    : `$${reduction.toFixed(
                                        2
                                      )} (${reductionPercent.toFixed(1)}%)`}
                                </td>
                                <td
                                  style={{
                                    padding: "8px",
                                    fontSize: "11px",
                                    fontStyle: "italic",
                                  }}
                                >
                                  {isCurrentTier ? "Current" : ""}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SECTION 7: PROFITABILITY / BREAK-EVEN */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div
            style={{
              marginBottom: "24px",
              paddingBottom: "20px",
              borderBottom: "3px solid rgba(0, 255, 65, 0.3)",
            }}
          >
            <h3
              style={{
                color: "#00ff41",
                fontSize: "18px",
                fontWeight: "bold",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                marginTop: 0,
                marginBottom: "16px",
              }}
            >
              PROFITABILITY / BREAK-EVEN ANALYSIS
            </h3>
            {(() => {
              const piecesPerHour =
                cycleTimeSeconds > 0 ? 3600 / cycleTimeSeconds : 0;
              const revenuePerPiece = tier.pricePerPart;
              const pressReturnPerHour = revenuePerPiece * piecesPerHour;
              const profitPerHour = pressReturnPerHour - machineRate;
              const grossCostPerM = (molderGrossCost * 1000) / tier.quantity;
              const breakEvenSellingPerM = grossCostPerM;

              return (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "20px",
                    fontSize: "14px",
                    color: "#00ff88",
                  }}
                >
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "rgba(0, 255, 65, 0.08)",
                      borderRadius: "8px",
                      border: "1px solid rgba(0, 255, 65, 0.3)",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: "8px",
                        fontSize: "0.9em",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: "#00ff88",
                      }}
                    >
                      Press Return/Hour
                    </div>
                    <div
                      style={{
                        fontSize: "1.5em",
                        fontWeight: "bold",
                        color: "#00ff41",
                      }}
                    >
                      ${pressReturnPerHour.toFixed(2)}
                    </div>
                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "0.85em",
                        color: "#00ffaa",
                      }}
                    >
                      Revenue per hour @ selling price
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor:
                        profitPerHour >= 0
                          ? "rgba(0, 255, 65, 0.08)"
                          : "rgba(255, 68, 68, 0.08)",
                      borderRadius: "8px",
                      border:
                        profitPerHour >= 0
                          ? "1px solid rgba(0, 255, 65, 0.3)"
                          : "1px solid rgba(255, 68, 68, 0.4)",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: "8px",
                        fontSize: "0.9em",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: profitPerHour >= 0 ? "#00ff88" : "#ff8888",
                      }}
                    >
                      Profit/Loss per Hour
                    </div>
                    <div
                      style={{
                        fontSize: "1.5em",
                        fontWeight: "bold",
                        color: profitPerHour >= 0 ? "#00ff41" : "#ff4444",
                      }}
                    >
                      ${profitPerHour.toFixed(2)}
                      {profitPerHour < 0 && (
                        <span style={{ fontSize: "0.6em", marginLeft: "8px" }}>
                          LOSS
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "0.85em",
                        color: profitPerHour >= 0 ? "#00ffaa" : "#ffaaaa",
                      }}
                    >
                      ${pressReturnPerHour.toFixed(2)}/hr − $
                      {machineRate.toFixed(2)}/hr machine rate
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "rgba(0, 255, 65, 0.08)",
                      borderRadius: "8px",
                      border: "1px solid rgba(0, 255, 65, 0.3)",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: "8px",
                        fontSize: "0.9em",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: "#00ff88",
                      }}
                    >
                      Break-Even Selling $/M
                    </div>
                    <div
                      style={{
                        fontSize: "1.5em",
                        fontWeight: "bold",
                        color: "#00ff41",
                      }}
                    >
                      ${breakEvenSellingPerM.toFixed(2)}
                    </div>
                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "0.85em",
                        color: "#00ffaa",
                      }}
                    >
                      Minimum price to cover factory costs
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SECTION 8: DETAILED LINE ITEMS (COLLAPSIBLE) */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div
            className="detailed-line-items-section"
            style={{
              marginBottom: "24px",
              paddingBottom: "20px",
              borderBottom: "3px solid rgba(0, 255, 65, 0.3)",
            }}
          >
            <button
              onClick={() => setShowDetailedLineItems(!showDetailedLineItems)}
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: "rgba(0, 255, 65, 0.1)",
                border: "2px solid rgba(0, 255, 65, 0.3)",
                borderRadius: "8px",
                color: "#00ff41",
                fontSize: "18px",
                fontWeight: "bold",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.3s ease",
                fontFamily: "monospace",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(0, 255, 65, 0.15)";
                e.currentTarget.style.borderColor = "#00ff41";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 255, 65, 0.1)";
                e.currentTarget.style.borderColor = "rgba(0, 255, 65, 0.3)";
              }}
            >
              <span>DETAILED LINE ITEMS BREAKDOWN</span>
              <span
                style={{
                  fontSize: "24px",
                  transition: "transform 0.3s ease",
                  transform: showDetailedLineItems
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                }}
              >
                ▼
              </span>
            </button>

            {/* Always render for print, conditionally render for screen */}
            <div
              className="print-show"
              style={{
                marginTop: "16px",
                animation: "slideDown 0.3s ease",
                display: showDetailedLineItems ? "block" : "none",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  color: "#00ff41",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #00ff41",
                      backgroundColor: "rgba(0, 255, 65, 0.1)",
                    }}
                  >
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: "bold",
                      }}
                    >
                      Category
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: "bold",
                      }}
                    >
                      Description
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: "bold",
                      }}
                    >
                      Quantity
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontWeight: "bold",
                      }}
                    >
                      Units
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: "bold",
                      }}
                    >
                      Rate/Unit
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: "bold",
                      }}
                    >
                      $/Part
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontWeight: "bold",
                      }}
                    >
                      Total Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: "1px solid rgba(0, 255, 65, 0.2)",
                        backgroundColor:
                          idx % 2 === 0
                            ? "rgba(0, 255, 65, 0.02)"
                            : "transparent",
                      }}
                    >
                      <td
                        style={{
                          padding: "10px",
                          fontWeight: "bold",
                          color: "#00ff88",
                        }}
                      >
                        {item.category}
                      </td>
                      <td style={{ padding: "10px" }}>{item.description}</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>
                        {parseFloat(item.usage.toFixed(4))}
                      </td>
                      <td style={{ padding: "10px" }}>{item.unit}</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>
                        ${item.ratePerUnit.toFixed(4)}
                      </td>
                      <td style={{ padding: "10px", textAlign: "right" }}>
                        ${item.costPerPart.toFixed(4)}
                      </td>
                      <td style={{ padding: "10px", textAlign: "right" }}>
                        ${item.totalCost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr
                    style={{
                      borderTop: "2px solid #00ff41",
                      fontWeight: "bold",
                      backgroundColor: "rgba(0, 255, 65, 0.15)",
                    }}
                  >
                    <td colSpan={5} style={{ padding: "10px" }}>
                      TOTAL
                    </td>
                    <td style={{ padding: "10px", textAlign: "right" }}>
                      ${tier.pricePerPart.toFixed(4)}
                    </td>
                    <td style={{ padding: "10px", textAlign: "right" }}>
                      ${tier.totalCost.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* FOOTER: NAVIGATION */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div
            className="no-print"
            style={{
              marginTop: "24px",
              display: "flex",
              gap: "12px",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setSelectedTierIndex(selectedTierIndex! - 1)}
                disabled={selectedTierIndex === 0}
                style={{
                  padding: "12px 24px",
                  background:
                    selectedTierIndex === 0
                      ? "rgba(50, 50, 50, 0.3)"
                      : "linear-gradient(135deg, #00ff41 0%, #00ff88 100%)",
                  color: selectedTierIndex === 0 ? "#666" : "#000",
                  border: selectedTierIndex === 0 ? "1px solid #333" : "none",
                  borderRadius: "8px",
                  cursor: selectedTierIndex === 0 ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  fontFamily: "monospace",
                  letterSpacing: "0.5px",
                  transition: "all 0.3s ease",
                  boxShadow:
                    selectedTierIndex === 0
                      ? "none"
                      : "0 2px 10px rgba(0, 255, 65, 0.3)",
                }}
                onMouseOver={(e) => {
                  if (selectedTierIndex !== 0) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 15px rgba(0, 255, 65, 0.5)";
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedTierIndex !== 0) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 10px rgba(0, 255, 65, 0.3)";
                  }
                }}
              >
                ◄ Previous Tier
              </button>
              <button
                onClick={() => setSelectedTierIndex(selectedTierIndex! + 1)}
                disabled={selectedTierIndex === quantityTiers.length - 1}
                style={{
                  padding: "12px 24px",
                  background:
                    selectedTierIndex === quantityTiers.length - 1
                      ? "rgba(50, 50, 50, 0.3)"
                      : "linear-gradient(135deg, #00ff41 0%, #00ff88 100%)",
                  color:
                    selectedTierIndex === quantityTiers.length - 1
                      ? "#666"
                      : "#000",
                  border:
                    selectedTierIndex === quantityTiers.length - 1
                      ? "1px solid #333"
                      : "none",
                  borderRadius: "8px",
                  cursor:
                    selectedTierIndex === quantityTiers.length - 1
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "bold",
                  fontFamily: "monospace",
                  letterSpacing: "0.5px",
                  transition: "all 0.3s ease",
                  boxShadow:
                    selectedTierIndex === quantityTiers.length - 1
                      ? "none"
                      : "0 2px 10px rgba(0, 255, 65, 0.3)",
                }}
                onMouseOver={(e) => {
                  if (selectedTierIndex !== quantityTiers.length - 1) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 15px rgba(0, 255, 65, 0.5)";
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedTierIndex !== quantityTiers.length - 1) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 10px rgba(0, 255, 65, 0.3)";
                  }
                }}
              >
                Next Tier ►
              </button>
            </div>
            <button
              onClick={() => setShowBreakdown(false)}
              style={{
                padding: "12px 24px",
                backgroundColor: "transparent",
                color: "#ff4444",
                border: "2px solid #ff4444",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                fontFamily: "monospace",
                letterSpacing: "0.5px",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 68, 68, 0.1)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const inputStyle = {
    minwidth: "40%",
    maxwidth: "60%",
    padding: "12px 16px",
    backgroundColor: "#0a0a0a",
    color: "#00ff41",
    border: "2px solid #00ff41",
    borderRadius: "8px",
    fontFamily: "monospace",
    fontSize: "14px",
    boxSizing: "border-box" as const,
    transition: "all 0.3s ease",
    boxShadow: "0 2px 8px rgba(0, 255, 65, 0.1)",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    color: "#00ff88",
    fontWeight: "600" as const,
    fontSize: "13px",
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
  };

  const checkboxStyle = {
    width: "18px",
    height: "18px",
    accentColor: "#00ff41",
    cursor: "pointer",
  };

  const checkboxLabelStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#00ff88",
    fontFamily: "monospace",
    fontSize: "14px",
    cursor: "pointer",
    padding: "8px 12px",
    borderRadius: "6px",
    transition: "all 0.2s ease",
    backgroundColor: "rgba(0, 255, 65, 0.02)",
    border: "1px solid rgba(0, 255, 65, 0.15)",
  };

  const sectionRowStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "24px",
    marginBottom: "0",
    alignItems: "start",
  };

  const singleColumnStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  };

  return (
    <div
      style={{
        padding: "32px",
        backgroundColor: "#0d0d0d",
        backgroundImage:
          "radial-gradient(circle at 20% 50%, rgba(0, 255, 65, 0.03) 0%, transparent 50%)",
        color: "#00ff41",
        minHeight: "100vh",
        fontFamily: "monospace",
      }}
    >
      <h1
        style={{
          borderBottom: "3px solid #00ff41",
          paddingBottom: "16px",
          marginBottom: "32px",
          fontSize: "32px",
          fontWeight: "bold",
          letterSpacing: "2px",
          background: "linear-gradient(135deg, #00ff41 0%, #00ff88 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "0 0 20px rgba(0, 255, 65, 0.5)",
        }}
      >
        {id ? "EDIT QUOTE" : "CREATE NEW QUOTE"}
      </h1>

      <form onSubmit={handleSubmit}>
        {/* ========== ROW 1: QUOTE HEADER + CONTACT INFO ========== */}
        <div style={sectionRowStyle}>
          <CollapsibleSection title="Quote Header" defaultOpen={false}>
            <div style={singleColumnStyle}>
              <div>
                <label style={labelStyle}>Quote Type</label>
                <select
                  value={quoteType}
                  onChange={(e) => setQuoteType(e.target.value)}
                  style={inputStyle}
                >
                  <option value="Estimate">Estimate</option>
                  <option value="Firm Quote">Firm Quote</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Valid Until</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "5px",
                  }}
                >
                  <label>Customer</label>
                </div>

                {customerInputMode === "select" ? (
                  <select
                    value={customerID || ""}
                    onChange={(e) => {
                      setCustomerID(
                        e.target.value ? parseInt(e.target.value) : null
                      );
                      if (e.target.value) {
                        const customer = customers.find(
                          (c) => c.customerID === parseInt(e.target.value)
                        );
                        if (customer) setCompanyName(customer.name);
                      }
                    }}
                    style={inputStyle}
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((c) => (
                      <option key={c.customerID} value={c.customerID}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={manualCustomerName}
                    onChange={(e) => {
                      setManualCustomerName(e.target.value);
                      setCompanyName(e.target.value);
                    }}
                    placeholder="Enter customer name"
                    style={inputStyle}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setCustomerInputMode(
                      customerInputMode === "select" ? "manual" : "select"
                    );
                    setCustomerID(null);
                    setManualCustomerName("");
                  }}
                  style={{
                    padding: "2px 8px",
                    fontSize: "11px",
                    background: "#333",
                    color: "#0f0",
                    border: "1px solid #0f0",
                    cursor: "pointer",
                    borderRadius: "3px",
                  }}
                >
                  {customerInputMode === "select"
                    ? "Manual Entry"
                    : "Select from List"}
                </button>
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "5px",
                  }}
                >
                  <label>Product</label>
                </div>
                {productInputMode === "select" ? (
                  <select
                    value={productID || ""}
                    onChange={(e) =>
                      setProductID(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="">-- Select Product --</option>
                    {products.map((p) => (
                      <option key={p.productID} value={p.productID}>
                        {p.partNumber} - {p.partName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={manualProductName}
                    onChange={(e) => setManualProductName(e.target.value)}
                    placeholder="Enter product name"
                    style={inputStyle}
                  />
                )}

                <button
                  type="button"
                  onClick={() => {
                    setProductInputMode(
                      productInputMode === "select" ? "manual" : "select"
                    );
                    setProductID(null);
                    setManualProductName("");
                  }}
                  style={{
                    padding: "2px 8px",
                    fontSize: "11px",
                    background: "#333",
                    color: "#0f0",
                    border: "1px solid #0f0",
                    cursor: "pointer",
                    borderRadius: "3px",
                  }}
                >
                  {productInputMode === "select"
                    ? "Manual Entry"
                    : "Select from List"}
                </button>
              </div>

              <div>
                <label style={labelStyle}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  style={inputStyle}
                />
              </div>

              {id && (
                <div>
                  <label style={labelStyle}>
                    Change Notes{" "}
                    <span style={{ color: "#ff6600", fontSize: "12px" }}></span>
                  </label>
                  <textarea
                    value={changeNotes}
                    onChange={(e) => setChangeNotes(e.target.value)}
                    rows={2}
                    placeholder="e.g., Updated pricing, changed material, adjusted quantities..."
                    style={inputStyle}
                  />
                </div>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Contact Information" defaultOpen={false}>
            <div style={singleColumnStyle}>
              <div>
                <label style={labelStyle}>Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Contact Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Company Address</label>
                <textarea
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  rows={2}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Contact Title</label>
                <input
                  type="text"
                  value={contactTitle}
                  onChange={(e) => setContactTitle(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Fax</label>
                <input
                  type="tel"
                  value={contactFax}
                  onChange={(e) => setContactFax(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* ========== ROW 2: PART INFO + PART DETAILS ========== */}
        <div style={sectionRowStyle}>
          <CollapsibleSection title="Part Information" defaultOpen={false}>
            <div style={singleColumnStyle}>
              <div>
                <label style={labelStyle}>Part Number</label>
                <input
                  type="text"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Part Name</label>
                <input
                  type="text"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Drawing Number</label>
                <input
                  type="text"
                  value={drawingNumber}
                  onChange={(e) => setDrawingNumber(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Revision Level</label>
                <input
                  type="text"
                  value={revisionLevel}
                  onChange={(e) => setRevisionLevel(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Revision Date</label>
                <input
                  type="date"
                  value={revisionDate}
                  onChange={(e) => setRevisionDate(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Mold Number</label>
                <input
                  type="text"
                  value={moldNumber}
                  onChange={(e) => setMoldNumber(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Mold Material</label>
                <select
                  value={moldMaterial}
                  onChange={(e) => setMoldMaterial(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">-- Select --</option>
                  <option value="Steel">Steel</option>
                  <option value="Aluminum">Aluminum</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Mold Status</label>
                <select
                  value={moldStatus}
                  onChange={(e) => setMoldStatus(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">-- Select --</option>
                  <option value="Actual">Actual</option>
                  <option value="Estimate">Estimate</option>
                  <option value="Supplied">Supplied</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={samplePart}
                    onChange={(e) => setSamplePart(e.target.checked)}
                    style={checkboxStyle}
                  />
                  Sample Part
                </label>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={has3DCADFile}
                    onChange={(e) => setHas3DCADFile(e.target.checked)}
                    style={checkboxStyle}
                  />
                  3D CAD File
                </label>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={has2DDwg}
                    onChange={(e) => setHas2DDwg(e.target.checked)}
                    style={checkboxStyle}
                  />
                  2D Drawing
                </label>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={familyMold}
                    onChange={(e) => setFamilyMold(e.target.checked)}
                    style={checkboxStyle}
                  />
                  Family Mold
                </label>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Part Details & Specifications"
            defaultOpen={false}
          >
            <div style={singleColumnStyle}>
              <div>
                <label style={labelStyle}># of Different Parts</label>
                <input
                  type="number"
                  value={numberOfDifferentParts}
                  onChange={(e) =>
                    setNumberOfDifferentParts(parseInt(e.target.value) || 0)
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}># of Cavities</label>
                <input
                  type="number"
                  value={numberOfCavities || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNumberOfCavities(val === "" ? 0 : parseInt(val));
                  }}
                  onBlur={(e) => {
                    if (
                      e.target.value === "" ||
                      isNaN(parseInt(e.target.value))
                    ) {
                      setNumberOfCavities(1);
                    }
                  }}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Projected Area (in²)</label>
                <input
                  type="number"
                  step="0.01"
                  value={projectedAreaIn2 || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProjectedAreaIn2(val === "" ? 0 : parseFloat(val));
                  }}
                  onBlur={(e) => {
                    if (
                      e.target.value === "" ||
                      isNaN(parseFloat(e.target.value))
                    ) {
                      setProjectedAreaIn2(0);
                    }
                  }}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Part Volume (in³)</label>
                <input
                  type="number"
                  step="0.01"
                  value={volumeIn3}
                  onChange={(e) =>
                    setVolumeIn3(parseFloat(e.target.value) || 0)
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Cycle Time (seconds)</label>
                <input
                  type="number"
                  step="0.1"
                  value={cycleTimeSeconds || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCycleTimeSeconds(val === "" ? 0 : parseFloat(val));
                  }}
                  onBlur={(e) => {
                    if (
                      e.target.value === "" ||
                      isNaN(parseFloat(e.target.value))
                    ) {
                      setCycleTimeSeconds(30.0);
                    }
                  }}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Part Weight (grams)</label>
                <input
                  type="number"
                  step="0.01"
                  value={partWeightGrams || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPartWeightGrams(val === "" ? 0 : parseFloat(val));
                  }}
                  onBlur={(e) => {
                    if (
                      e.target.value === "" ||
                      isNaN(parseFloat(e.target.value))
                    ) {
                      setPartWeightGrams(0);
                    }
                  }}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Runner Weight (grams)</label>
                <input
                  type="number"
                  step="0.01"
                  value={runnerWeightGrams || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRunnerWeightGrams(val === "" ? 0 : parseFloat(val));
                  }}
                  onBlur={(e) => {
                    if (
                      e.target.value === "" ||
                      isNaN(parseFloat(e.target.value))
                    ) {
                      setRunnerWeightGrams(0);
                    }
                  }}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Shot Weight (grams)</label>
                <div
                  style={{
                    ...inputStyle,
                    backgroundColor: "#222",
                    color: "#0f0",
                    opacity: 0.7,
                    width: "50%",
                  }}
                >
                  {isNaN(shotWeightGrams) ? "0.00" : shotWeightGrams.toFixed(2)}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Regrind % Allowed</label>
                <input
                  type="number"
                  step="0.1"
                  value={regrindPercentAllowed}
                  onChange={(e) =>
                    setRegrindPercentAllowed(parseFloat(e.target.value) || 0)
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Scrap (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={scrapPercent * 100 || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setScrapPercent(val === "" ? 0 : parseFloat(val) / 100);
                  }}
                  onBlur={(e) => {
                    if (
                      e.target.value === "" ||
                      isNaN(parseFloat(e.target.value))
                    ) {
                      setScrapPercent(0.005); // Reset to default 0.5%
                    }
                  }}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Machine Size (tons)</label>
                <select
                  value={selectedMachine?.clampingForceTF || ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      const tonnage = parseInt(e.target.value);
                      const machine = machines.find(
                        (m) => m.clampingForceTF === tonnage
                      );
                      if (machine) {
                        setMachineID(machine.id);
                        setSelectedMachine(machine);
                        setPressSizeTons(tonnage);
                        setMachineRate(machine.hourlyRate);
                      }
                    } else {
                      setMachineID(null);
                      setSelectedMachine(null);
                      setPressSizeTons(0);
                      setMachineRate(0);
                    }
                  }}
                  style={inputStyle}
                >
                  <option value="">-- Select Machine --</option>
                  {uniqueTonnages.map((tonnage) => (
                    <option key={tonnage} value={tonnage}>
                      {tonnage} tons
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Estimated Press Size (tons)</label>
                <div
                  style={{
                    ...inputStyle,
                    backgroundColor: "#222",
                    color: "#0f0",
                    opacity: 0.7,
                  }}
                >
                  {estimatedPressSizeTons.toFixed(2)}
                </div>
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* ========== ROW 3: MOLD COSTS + COST INPUTS========== */}
        <div style={sectionRowStyle}>
          <CollapsibleSection title="Mold Costs" defaultOpen={false}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              <div>
                <label style={labelStyle}>Mold Amortization (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={moldAmortizationPercent * 100 || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMoldAmortizationPercent(
                      val === "" ? 0 : parseFloat(val) / 100
                    );
                  }}
                  onBlur={(e) => {
                    if (
                      e.target.value === "" ||
                      isNaN(parseFloat(e.target.value))
                    ) {
                      setMoldAmortizationPercent(0);
                    }
                  }}
                  style={inputStyle}
                  placeholder="% of subtotal (e.g., 5 for 5%)"
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Mold Maintenance (% of amortization)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={moldMaintenancePercent * 100 || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMoldMaintenancePercent(
                      val === "" ? 0 : parseFloat(val) / 100
                    );
                  }}
                  onBlur={(e) => {
                    if (
                      e.target.value === "" ||
                      isNaN(parseFloat(e.target.value))
                    ) {
                      setMoldMaintenancePercent(0);
                    }
                  }}
                  style={inputStyle}
                  placeholder="% of amortization (e.g., 15 for 15%)"
                />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Cost Inputs" defaultOpen={false}>
            <div style={singleColumnStyle}>
              <div>
                <label style={labelStyle}>Machine Rate ($/hr)</label>
                <input
                  type="number"
                  step="0.01"
                  value={machineRate || ""}
                  placeholder="Select a machine"
                  onChange={(e) => {
                    const val = e.target.value;
                    setMachineRate(val === "" ? 0 : parseFloat(val));
                  }}
                  onBlur={(e) => {
                    if (
                      e.target.value === "" ||
                      isNaN(parseFloat(e.target.value))
                    ) {
                      setMachineRate(0);
                    }
                  }}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Setup Fee ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={setupCost || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSetupCost(val === "" ? 0 : parseFloat(val));
                  }}
                  onBlur={(e) => {
                    if (
                      e.target.value === "" ||
                      isNaN(parseFloat(e.target.value))
                    ) {
                      setSetupCost(250);
                    }
                  }}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Purge/Cleaning Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={purgeCost || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPurgeCost(val === "" ? 0 : parseFloat(val));
                  }}
                  onBlur={(e) => {
                    if (
                      e.target.value === "" ||
                      isNaN(parseFloat(e.target.value))
                    ) {
                      setPurgeCost(0);
                    }
                  }}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Unused Regrind Value ($/lb)</label>
                <input
                  type="number"
                  step="0.01"
                  value={unusedRegrindValue || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUnusedRegrindValue(val === "" ? 0 : parseFloat(val));
                  }}
                  onBlur={(e) => {
                    if (
                      e.target.value === "" ||
                      isNaN(parseFloat(e.target.value))
                    ) {
                      setUnusedRegrindValue(2.2);
                    }
                  }}
                  style={inputStyle}
                />
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* ========== ROW 4: MATERIALS + PACKAGING + COLORANT/ADDITIVE ========== */}
        <div style={sectionRowStyle}>
          <CollapsibleSection title="Materials" defaultOpen={false}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "20px",
              }}
            >
              {/* Column 1: Materials */}
              <div style={singleColumnStyle}>
                <div>
                  <label style={labelStyle}>Material Type</label>
                  <select
                    value={materialID || ""}
                    onChange={(e) =>
                      setMaterialID(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="">-- Select Material --</option>
                    {materials.map((m) => (
                      <option key={m.materialID} value={m.materialID}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Melt Density</label>
                  <div
                    style={{
                      ...inputStyle,
                      backgroundColor: "#222",
                      color: "#0f0",
                      opacity: 0.7,
                    }}
                  >
                    {meltDensity ? meltDensity.toFixed(4) : "0.0000"}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Material Cost ($/lb)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={materialCostPerLb || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMaterialCostPerLb(val === "" ? 0 : parseFloat(val));
                    }}
                    onBlur={(e) => {
                      if (
                        e.target.value === "" ||
                        isNaN(parseFloat(e.target.value))
                      ) {
                        setMaterialCostPerLb(0);
                      }
                    }}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Material Loss (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={materialLossPercent || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMaterialLossPercent(val === "" ? 0 : parseFloat(val));
                    }}
                    onBlur={(e) => {
                      if (
                        e.target.value === "" ||
                        isNaN(parseFloat(e.target.value))
                      ) {
                        setMaterialLossPercent(0);
                      }
                    }}
                    style={inputStyle}
                  />
                </div>
              </div>
              {/* Column 3: Colorant and/or Additive */}
              <div style={singleColumnStyle}>
                <div>
                  <label style={labelStyle}>Colorant</label>
                  <select
                    value={colorantID || ""}
                    onChange={(e) =>
                      setColorantID(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="">-- Select Colorant --</option>
                    {colorants.map((c) => (
                      <option key={c.colorantID} value={c.colorantID}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Additive</label>
                  <select
                    value={additiveID || ""}
                    onChange={(e) =>
                      setAdditiveID(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="">-- Select Additive --</option>
                    {additives.map((a) => (
                      <option key={a.additiveID} value={a.additiveID}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Column 2: Packaging and Hardware */}
              <div style={singleColumnStyle}>
                <div>
                  <label style={labelStyle}>Box</label>
                  <select
                    value={selectedBoxID || ""}
                    onChange={(e) =>
                      setSelectedBoxID(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="">-- Select Box --</option>
                    {boxes.map((b) => {
                      const boxVolume = b.length * b.width * b.height;
                      const partsPerBox =
                        volumeIn3 > 0
                          ? calculatePartsPerBox(boxVolume, volumeIn3)
                          : 0;

                      return (
                        <option key={b.boxID} value={b.boxID}>
                          {b.name}
                          {partsPerBox > 0 ? ` - ${partsPerBox} parts/box` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>
                    Actual Parts per Box{" "}
                    <span
                      style={{
                        fontSize: "0.85em",
                        fontStyle: "italic",
                        color: "#666",
                      }}
                    >
                      (Optional - overrides auto calculation)
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={actualPartsPerBox || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActualPartsPerBox(val === "" ? null : parseInt(val));
                    }}
                    placeholder="Leave blank for auto calculation"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Hardware 1</label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <select
                      value={selectedHardware1ID || ""}
                      onChange={(e) =>
                        setSelectedHardware1ID(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      style={{ ...inputStyle, width: "70%" }}
                    >
                      <option value="">-- Select Hardware --</option>
                      {hardware.map((h) => (
                        <option key={h.hardwareID} value={h.hardwareID}>
                          {h.name} (${h.cost.toFixed(4)} each)
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={hardware1QuantityPerPart || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHardware1QuantityPerPart(
                          val === "" ? 0 : parseInt(val)
                        );
                      }}
                      onBlur={(e) => {
                        if (
                          e.target.value === "" ||
                          isNaN(parseInt(e.target.value))
                        ) {
                          setHardware1QuantityPerPart(0);
                        }
                      }}
                      style={{ ...inputStyle, width: "30%" }}
                      placeholder="Qty"
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Hardware 2</label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <select
                      value={selectedHardware2ID || ""}
                      onChange={(e) =>
                        setSelectedHardware2ID(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      style={{ ...inputStyle, width: "70%" }}
                    >
                      <option value="">-- Select Hardware --</option>
                      {hardware.map((h) => (
                        <option key={h.hardwareID} value={h.hardwareID}>
                          {h.name} (${h.cost.toFixed(4)} each)
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={hardware2QuantityPerPart || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHardware2QuantityPerPart(
                          val === "" ? 0 : parseInt(val)
                        );
                      }}
                      onBlur={(e) => {
                        if (
                          e.target.value === "" ||
                          isNaN(parseInt(e.target.value))
                        ) {
                          setHardware2QuantityPerPart(0);
                        }
                      }}
                      style={{ ...inputStyle, width: "30%" }}
                      placeholder="Qty"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Labor Requirements & Rates"
            defaultOpen={false}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              {/* Column 1: Primary & Quality Labor */}
              <div style={singleColumnStyle}>
                <h3
                  style={{
                    color: "#0f0",
                    marginTop: 0,
                    fontSize: "14px",
                    borderBottom: "1px solid #0f0",
                    paddingBottom: "5px",
                  }}
                >
                  Primary & Quality Labor
                </h3>
                <div>
                  <label style={checkboxLabelStyle}>
                    <input
                      type="checkbox"
                      checked={operatorRequired}
                      onChange={(e) => setOperatorRequired(e.target.checked)}
                      style={checkboxStyle}
                    />
                    Operator Required (hours auto-calculated)
                  </label>
                </div>
                <div>
                  <label style={labelStyle}>Primary Labor Rate ($/hr)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={primaryLaborRate || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPrimaryLaborRate(val === "" ? 0 : parseFloat(val));
                    }}
                    onBlur={(e) => {
                      if (
                        e.target.value === "" ||
                        isNaN(parseFloat(e.target.value))
                      ) {
                        setPrimaryLaborRate(15);
                      }
                    }}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    Quality Labor Rate ($/hr) - Fixed 0.5 hr
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={qualityLaborRate || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQualityLaborRate(val === "" ? 0 : parseFloat(val));
                    }}
                    onBlur={(e) => {
                      if (
                        e.target.value === "" ||
                        isNaN(parseFloat(e.target.value))
                      ) {
                        setQualityLaborRate(18);
                      }
                    }}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={checkboxLabelStyle}>
                    <input
                      type="checkbox"
                      checked={isirfairInspection}
                      onChange={(e) => setIsirfairInspection(e.target.checked)}
                      style={checkboxStyle}
                    />
                    ISIR/FAIR Inspection Required
                  </label>
                </div>
              </div>

              {/* Column 2: Material Mixing & Secondary Labor */}
              <div style={singleColumnStyle}>
                <h3
                  style={{
                    color: "#0f0",
                    marginTop: 0,
                    fontSize: "14px",
                    borderBottom: "1px solid #0f0",
                    paddingBottom: "5px",
                  }}
                >
                  Material & Secondary Labor
                </h3>
                <div>
                  <label style={labelStyle}>
                    Material Mixing Rate ($/hr) - Auto 0.5 hr if
                    colorant/additive
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={materialMixingRate || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMaterialMixingRate(val === "" ? 0 : parseFloat(val));
                    }}
                    onBlur={(e) => {
                      if (
                        e.target.value === "" ||
                        isNaN(parseFloat(e.target.value))
                      ) {
                        setMaterialMixingRate(15);
                      }
                    }}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Secondary Op #1 Description</label>
                  <input
                    type="text"
                    value={secondaryLabor1Description}
                    onChange={(e) =>
                      setSecondaryLabor1Description(e.target.value)
                    }
                    placeholder="e.g., Assembly, Painting"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    Secondary Op #1 Time (seconds per piece)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={secondaryLabor1TimePerPiece || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSecondaryLabor1TimePerPiece(
                        val === "" ? 0 : parseFloat(val)
                      );
                    }}
                    onBlur={(e) => {
                      if (
                        e.target.value === "" ||
                        isNaN(parseFloat(e.target.value))
                      ) {
                        setSecondaryLabor1TimePerPiece(0);
                      }
                    }}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Secondary Op #1 Rate ($/hr)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={secondaryLabor1Rate || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSecondaryLabor1Rate(val === "" ? 0 : parseFloat(val));
                    }}
                    onBlur={(e) => {
                      if (
                        e.target.value === "" ||
                        isNaN(parseFloat(e.target.value))
                      ) {
                        setSecondaryLabor1Rate(15);
                      }
                    }}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Secondary Op #2 Description</label>
                  <input
                    type="text"
                    value={secondaryLabor2Description}
                    onChange={(e) =>
                      setSecondaryLabor2Description(e.target.value)
                    }
                    placeholder="e.g., Packaging, Inspection"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    Secondary Op #2 Time (seconds per piece)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={secondaryLabor2TimePerPiece || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSecondaryLabor2TimePerPiece(
                        val === "" ? 0 : parseFloat(val)
                      );
                    }}
                    onBlur={(e) => {
                      if (
                        e.target.value === "" ||
                        isNaN(parseFloat(e.target.value))
                      ) {
                        setSecondaryLabor2TimePerPiece(0);
                      }
                    }}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Secondary Op #2 Rate ($/hr)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={secondaryLabor2Rate || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSecondaryLabor2Rate(val === "" ? 0 : parseFloat(val));
                    }}
                    onBlur={(e) => {
                      if (
                        e.target.value === "" ||
                        isNaN(parseFloat(e.target.value))
                      ) {
                        setSecondaryLabor2Rate(15);
                      }
                    }}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* ========== ROW 5: TERMS + SALES ========== */}
        <div style={sectionRowStyle}>
          <CollapsibleSection title="Terms & Conditions" defaultOpen={false}>
            <div style={singleColumnStyle}>
              <div>
                <label style={labelStyle}>Minimum Run Quantity</label>
                <input
                  type="number"
                  value={minimumRunQuantity}
                  onChange={(e) =>
                    setMinimumRunQuantity(parseInt(e.target.value) || 0)
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>FOB Point</label>
                <input
                  type="text"
                  value={fobPoint}
                  onChange={(e) => setFobPoint(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Delivery Lead Time (weeks)</label>
                <input
                  type="number"
                  value={deliveryLeadTimeWeeks}
                  onChange={(e) =>
                    setDeliveryLeadTimeWeeks(parseInt(e.target.value) || 0)
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Payment Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  style={inputStyle}
                  placeholder="e.g., Net 30"
                />
              </div>
              <div>
                <label style={labelStyle}>Prices Held For (days)</label>
                <input
                  type="number"
                  value={pricesHeldForDays}
                  onChange={(e) =>
                    setPricesHeldForDays(parseInt(e.target.value) || 0)
                  }
                  style={inputStyle}
                />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Sales" defaultOpen={false}>
            <div style={singleColumnStyle}>
              <div>
                <label style={labelStyle}>Sales Representative</label>
                <input
                  type="text"
                  value={salesRepresentative}
                  onChange={(e) => setSalesRepresentative(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Estimator</label>
                <input
                  type="text"
                  value={estimator}
                  onChange={(e) => setEstimator(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Commission (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={commissionPercent * 100 || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCommissionPercent(
                      val === "" ? 0 : parseFloat(val) / 100
                    );
                  }}
                  onBlur={(e) => {
                    if (
                      e.target.value === "" ||
                      isNaN(parseFloat(e.target.value))
                    ) {
                      setCommissionPercent(0.03);
                    }
                  }}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Markup (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={markupPercent * 100 || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMarkupPercent(val === "" ? 0 : parseFloat(val) / 100);
                  }}
                  onBlur={(e) => {
                    if (
                      e.target.value === "" ||
                      isNaN(parseFloat(e.target.value))
                    ) {
                      setMarkupPercent(0);
                    }
                  }}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>CC Quote To</label>
                <input
                  type="text"
                  value={ccQuoteTo}
                  onChange={(e) => setCcQuoteTo(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>COC's Required</label>
                <input
                  type="text"
                  value={cocsRequired}
                  onChange={(e) => setCocsRequired(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Existing Customer Operations</label>
                <input
                  type="text"
                  value={existingCustomerOps}
                  onChange={(e) => setExistingCustomerOps(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={tightTolerances}
                    onChange={(e) => setTightTolerances(e.target.checked)}
                    style={checkboxStyle}
                  />
                  Tight Tolerances
                </label>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={uniqueMoldOrProcess}
                    onChange={(e) => setUniqueMoldOrProcess(e.target.checked)}
                    style={checkboxStyle}
                  />
                  Unique Mold/Process
                </label>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={excessivePartStorage}
                    onChange={(e) => setExcessivePartStorage(e.target.checked)}
                    style={checkboxStyle}
                  />
                  Excess Storage
                </label>
                <label style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={excessiveSetUpTime}
                    onChange={(e) => setExcessiveSetUpTime(e.target.checked)}
                    style={checkboxStyle}
                  />
                  Excess Setup Time
                </label>
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* ========== SHIPPING ========== */}
        <div style={sectionRowStyle}>
          <CollapsibleSection title="Shipping" defaultOpen={false}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              <div>
                <label style={labelStyle}>Shipping Method</label>
                <select
                  value={shippingMethod}
                  onChange={(e) => {
                    const method = e.target.value as
                      | "UPS"
                      | "Skid"
                      | "Billed to Customer"
                      | "";
                    setShippingMethod(method);
                    if (method === "Billed to Customer") {
                      setShippingCost(0);
                    }
                  }}
                  style={inputStyle}
                >
                  <option value="">-- Select Method --</option>
                  <option value="UPS">UPS</option>
                  <option value="Skid">Skid</option>
                  <option value="Billed to Customer">Billed to Customer</option>
                </select>
              </div>

              {shippingMethod && shippingMethod !== "Billed to Customer" && (
                <div>
                  <label style={labelStyle}>
                    Shipping Cost ($
                    {shippingMethod === "UPS"
                      ? "per box"
                      : shippingMethod === "Skid"
                      ? "per skid"
                      : "total"}
                    )
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingCost || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setShippingCost(val === "" ? 0 : parseFloat(val));
                    }}
                    onBlur={(e) => {
                      if (
                        e.target.value === "" ||
                        isNaN(parseFloat(e.target.value))
                      ) {
                        setShippingCost(0);
                      }
                    }}
                    style={inputStyle}
                    placeholder={
                      shippingMethod === "UPS"
                        ? "Cost per box"
                        : shippingMethod === "Skid"
                        ? "Cost per skid"
                        : "Total shipping cost"
                    }
                  />
                </div>
              )}
            </div>
          </CollapsibleSection>
        </div>

        {/* ========== COST INPUTS ========== */}
        <div style={sectionRowStyle}></div>

        {/* ========== ROW 5: QUANTITY TIERS========== */}
        <div style={sectionRowStyle}>
          <CollapsibleSection
            title="Quantity Tiers & Pricing"
            defaultOpen={true}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #0f0" }}>
                  <th style={{ padding: "10px", textAlign: "left" }}>Tier</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>
                    Quantity
                  </th>
                  <th style={{ padding: "10px", textAlign: "right" }}>
                    $/Part
                  </th>
                  <th style={{ padding: "10px", textAlign: "right" }}>
                    Total Cost
                  </th>
                  <th style={{ padding: "10px", textAlign: "center" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {quantityTiers.map((tier, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #0f0" }}>
                    <td style={{ padding: "8px" }}>Tier {tier.tierNumber}</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>
                      <input
                        type="number"
                        value={tier.quantity || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newTiers = [...quantityTiers];
                          newTiers[idx].quantity =
                            val === "" ? 0 : parseInt(val);
                          setQuantityTiers(newTiers);
                        }}
                        onBlur={(e) => {
                          if (
                            e.target.value === "" ||
                            isNaN(parseInt(e.target.value))
                          ) {
                            const newTiers = [...quantityTiers];
                            newTiers[idx].quantity = 0;
                            setQuantityTiers(newTiers);
                          }
                        }}
                        style={{
                          ...inputStyle,
                          width: "120px",
                          textAlign: "right",
                        }}
                      />
                    </td>
                    <td style={{ padding: "8px", textAlign: "right" }}>
                      ${tier.pricePerPart.toFixed(4)}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right" }}>
                      ${tier.totalCost.toFixed(2)}
                    </td>
                    <td style={{ padding: "8px", textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          justifyContent: "center",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTierIndex(idx);
                            setShowBreakdown(true);
                          }}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#0f0",
                            color: "#000",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          View Breakdown
                        </button>
                        {quantityTiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setQuantityTiers(
                                quantityTiers.filter((_, i) => i !== idx)
                              )
                            }
                            style={{
                              padding: "4px 8px",
                              backgroundColor: "#f00",
                              color: "#000",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              onClick={() =>
                setQuantityTiers([
                  ...quantityTiers,
                  {
                    tierNumber: quantityTiers.length + 1,
                    quantity: 0,
                    pricePerPart: 0,
                    totalCost: 0,
                    displayOrder: quantityTiers.length,
                  },
                ])
              }
              style={{
                marginTop: "10px",
                padding: "8px 16px",
                backgroundColor: "#0f0",
                color: "#000",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              + Add Tier
            </button>
          </CollapsibleSection>
        </div>
        {/* ========== SUBMIT BUTTONS ========== */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "40px",
            paddingTop: "24px",
            borderTop: "2px solid rgba(0, 255, 65, 0.2)",
          }}
        >
          <button
            type="submit"
            style={{
              padding: "14px 32px",
              background: "linear-gradient(135deg, #00ff41 0%, #00ff88 100%)",
              color: "#000",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "16px",
              fontFamily: "monospace",
              letterSpacing: "1px",
              boxShadow:
                "0 4px 15px rgba(0, 255, 65, 0.4), 0 0 20px rgba(0, 255, 65, 0.2)",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(0, 255, 65, 0.6), 0 0 30px rgba(0, 255, 65, 0.3)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 15px rgba(0, 255, 65, 0.4), 0 0 20px rgba(0, 255, 65, 0.2)";
            }}
          >
            {id ? "💾 UPDATE QUOTE (New Version)" : "💾 CREATE QUOTE"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/quotes")}
            style={{
              padding: "14px 32px",
              backgroundColor: "transparent",
              color: "#00ff41",
              border: "2px solid #00ff41",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontFamily: "monospace",
              letterSpacing: "1px",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 255, 65, 0.1)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            ✖ CANCEL
          </button>
        </div>
      </form>

      {/* Breakdown Modal */}
      {renderBreakdownModal()}
    </div>
  );
};

export default QuoteFormNew;
