import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "../axios";
import { Product } from "../types/Product";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

interface ChecklistItem {
  id: string;
  text: string;
  yes: boolean;
  no: boolean;
  actual: string;
}

interface PartData {
  partNumber: string;
  partName: string;
  customer: string;
  cavities: number;
  moldNumber: string;
  moldWidth: string;
  moldThickness: string;
  date: string;
  inspector: string;
}

interface SavedChecklist {
  checklistID: number;
  checklistNumber: string;
  partNumber: string;
  partName: string;
  customer: string;
  createdDate: string;
  currentVersion: number;
  status: string;
}

interface ChecklistVersion {
  checklistVersionID: number;
  versionNumber: number;
  createdDate: string;
  createdBy: string;
  changeNotes: string;
}

const ToolPreSampleChecklist: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const printRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [styleMode, setStyleMode] = useState<"terminal" | "professional">("terminal");
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentChecklistID, setCurrentChecklistID] = useState<number | null>(null);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [savedChecklists, setSavedChecklists] = useState<SavedChecklist[]>([]);
  const [versions, setVersions] = useState<ChecklistVersion[]>([]);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const productIDFromParams = searchParams.get("productId");
  const { user } = useAuth();

  // Part data with defaults - inspector comes from user initials
  const userInitials = user?.initials || "";
  const [partData, setPartData] = useState<PartData>({
    partNumber: "",
    partName: "",
    customer: "",
    cavities: 1,
    moldNumber: "",
    moldWidth: "",
    moldThickness: "",
    date: new Date().toISOString().split("T")[0],
    inspector: userInitials,
  });

  // Initialize checklist items
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    // Section 1: Mold Condition & Setup
    { id: "1a", text: "Mold clean and free of rust/damage", yes: false, no: false, actual: "" },
    { id: "1b", text: "Parting line condition acceptable", yes: false, no: false, actual: "" },
    { id: "1c", text: "Mold surfaces polished/textured per spec", yes: false, no: false, actual: "" },
    { id: "1d", text: "All vents clean and functional", yes: false, no: false, actual: "" },
    { id: "1e", text: "Gate area clean and proper size", yes: false, no: false, actual: "" },
    { id: "1f", text: "Runner system clear and sized correctly", yes: false, no: false, actual: "" },
    { id: "1g", text: "Sprue bushing properly seated", yes: false, no: false, actual: "" },
    { id: "1h", text: "Mold alignment pins/bushings intact", yes: false, no: false, actual: "" },
    { id: "1i", text: "Mold width verified (pan to ceiling door)", yes: false, no: false, actual: "" },
    { id: "1j", text: "Mold thickness verified (platen to platen)", yes: false, no: false, actual: "" },

    // Section 2: Cavity & Core
    { id: "2a", text: "Cavity dimensions per print", yes: false, no: false, actual: "" },
    { id: "2b", text: "Core dimensions per print", yes: false, no: false, actual: "" },
    { id: "2c", text: "Number of cavities verified", yes: false, no: false, actual: "" },
    { id: "2d", text: "Cavity identification/numbering present", yes: false, no: false, actual: "" },
    { id: "2e", text: "Surface finish meets requirements", yes: false, no: false, actual: "" },
    { id: "2f", text: "No flash conditions observed", yes: false, no: false, actual: "" },
    { id: "2g", text: "Cavity steel grade verified", yes: false, no: false, actual: "" },
    { id: "2h", text: "Hardness verification completed", yes: false, no: false, actual: "" },

    // Section 3: Ejection System
    { id: "3a", text: "Ejector pins function smoothly", yes: false, no: false, actual: "" },
    { id: "3b", text: "Ejector pin marks acceptable", yes: false, no: false, actual: "" },
    { id: "3c", text: "Return pins function properly", yes: false, no: false, actual: "" },
    { id: "3d", text: "Ejector plate travel adequate", yes: false, no: false, actual: "" },
    { id: "3e", text: "Knockout system timing correct", yes: false, no: false, actual: "" },
    { id: "3f", text: "Stripper ring/plate operation smooth", yes: false, no: false, actual: "" },

    // Section 4: Cooling System
    { id: "4a", text: "All cooling lines clear/flushed", yes: false, no: false, actual: "" },
    { id: "4b", text: "Cooling line connections leak-free", yes: false, no: false, actual: "" },
    { id: "4c", text: "Cooling circuit layout verified", yes: false, no: false, actual: "" },
    { id: "4d", text: "Temperature probe locations correct", yes: false, no: false, actual: "" },
    { id: "4e", text: "Baffles/bubblers installed correctly", yes: false, no: false, actual: "" },

    // Section 5: Safety & Installation
    { id: "5a", text: "Leader pins/bushings in good condition", yes: false, no: false, actual: "" },
    { id: "5b", text: "Mold clamping method adequate", yes: false, no: false, actual: "" },
    { id: "5c", text: "Safety shutoffs functional", yes: false, no: false, actual: "" },
    { id: "5d", text: "Machine compatibility verified", yes: false, no: false, actual: "" },
    { id: "5e", text: "Tonnage requirements confirmed", yes: false, no: false, actual: "" },
    { id: "5f", text: "Daylight requirements verified", yes: false, no: false, actual: "" },

    // Section 6: Documentation & Accessories
    { id: "6a", text: "Mold drawing/blueprint available", yes: false, no: false, actual: "" },
    { id: "6b", text: "Process sheet available", yes: false, no: false, actual: "" },
    { id: "6c", text: "Previous run data reviewed", yes: false, no: false, actual: "" },
    { id: "6d", text: "Special tools/fixtures available", yes: false, no: false, actual: "" },
    { id: "6e", text: "Hot runner controller (if applicable)", yes: false, no: false, actual: "" },
  ]);

  const handleCheckboxChange = (id: string, field: "yes" | "no") => {
    setChecklistItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, yes: field === "yes", no: field === "no" }
          : item
      )
    );
  };

  const handleActualChange = (id: string, value: string) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, actual: value } : item))
    );
  };

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get<Product[]>("/api/products");
        setProducts(response.data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };
    fetchProducts();
  }, []);

  // Load checklist if productId provided
  useEffect(() => {
    if (productIDFromParams) {
      loadLatestChecklistForProduct(parseInt(productIDFromParams));
    }
  }, [productIDFromParams, products]);

  const handlePartNumberChange = (value: string) => {
    setPartData({ ...partData, partNumber: value });
    if (value.length > 0) {
      const filtered = products.filter(
        (p) =>
          p.partNumber.toLowerCase().includes(value.toLowerCase()) ||
          p.partName.toLowerCase().includes(value.toLowerCase()) ||
          p.moldInsert?.fullNumber?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredProducts(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setShowDropdown(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    setPartData({
      ...partData,
      partNumber: product.partNumber,
      partName: product.partName,
      cavities: product.cavities || 1,
      moldNumber: product.moldInsert?.fullNumber || "",
    });
    setShowDropdown(false);
  };

  const loadSampleData = () => {
    setPartData({
      partNumber: "8057",
      partName: '1.5" 100 DEG M-B ELBOW',
      customer: "Marine East",
      cavities: 1,
      moldNumber: "102020B01",
      moldWidth: '10 3/4"',
      moldThickness: '10 3/4"',
      date: new Date().toISOString().split("T")[0],
      inspector: userInitials,
    });
  };

  const loadLatestChecklistForProduct = async (productId: number) => {
    try {
      const product = products.find((p) => p.productID === productId);
      if (!product) return;

      // Load latest checklist for this part number
      const response = await axios.get<SavedChecklist[]>(`/api/ToolChecklist?partNumber=${product.partNumber}`);
      const checklists = response.data;

      if (checklists.length > 0) {
        const latest = checklists[0]; // Assuming ordered by created date desc
        await loadChecklist(latest.checklistID);
      } else {
        // No existing checklist, pre-fill with product data
        setPartData({
          ...partData,
          partNumber: product.partNumber,
          partName: product.partName,
          cavities: product.cavities || 1,
          moldNumber: product.moldInsert?.fullNumber || "",
        });
      }
    } catch (error) {
      console.error("Failed to load checklist:", error);
      toast.error("Failed to load checklist");
    }
  };

  const saveChecklist = async () => {
    if (!partData.partNumber || !partData.partName) {
      toast.error("Part number and name are required");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        productID: products.find((p) => p.partNumber === partData.partNumber)?.productID || null,
        partNumber: partData.partNumber,
        partName: partData.partName,
        customer: partData.customer,
        cavities: partData.cavities,
        moldNumber: partData.moldNumber,
        moldWidth: partData.moldWidth,
        moldThickness: partData.moldThickness,
        inspectionDate: partData.date,
        inspector: partData.inspector,
        items: checklistItems.map((item) => ({
          itemID: item.id,
          itemText: item.text,
          yesChecked: item.yes,
          noChecked: item.no,
          actualValue: item.actual,
        })),
      };

      if (currentChecklistID) {
        // Update existing (creates new version)
        await axios.put(`/api/ToolChecklist/${currentChecklistID}`, {
          ...payload,
          status: "Draft",
          changeNotes: `Updated on ${new Date().toLocaleString()}`,
        });
        toast.success("Checklist updated (new version created)");
        await loadChecklist(currentChecklistID);
      } else {
        // Create new
        const response = await axios.post<any>("/api/ToolChecklist", payload);
        setCurrentChecklistID(response.data.checklistID);
        setCurrentVersion(1);
        toast.success("Checklist saved");
      }
    } catch (error) {
      console.error("Failed to save checklist:", error);
      toast.error("Failed to save checklist");
    } finally {
      setIsSaving(false);
    }
  };

  const loadChecklist = async (checklistID: number, version?: number) => {
    try {
      const url = version
        ? `/api/ToolChecklist/${checklistID}?version=${version}`
        : `/api/ToolChecklist/${checklistID}`;

      const response = await axios.get<any>(url);
      const checklist = response.data;

      setCurrentChecklistID(checklist.checklistID);
      setCurrentVersion(version || checklist.currentVersion);

      // Find the version to load
      const versionToLoad = checklist.versions.find(
        (v: any) => v.versionNumber === (version || checklist.currentVersion)
      );

      if (versionToLoad) {
        setPartData({
          partNumber: versionToLoad.partNumber,
          partName: versionToLoad.partName,
          customer: versionToLoad.customer,
          cavities: versionToLoad.cavities,
          moldNumber: versionToLoad.moldNumber,
          moldWidth: versionToLoad.moldWidth,
          moldThickness: versionToLoad.moldThickness,
          date: versionToLoad.inspectionDate.split("T")[0],
          inspector: versionToLoad.inspector,
        });

        // Load checklist items
        const loadedItems = versionToLoad.items.map((item: any) => ({
          id: item.itemID,
          text: item.itemText,
          yes: item.yesChecked,
          no: item.noChecked,
          actual: item.actualValue,
        }));

        setChecklistItems(loadedItems);
        setVersions(checklist.versions);
      }

      toast.success(`Loaded version ${version || checklist.currentVersion}`);
    } catch (error) {
      console.error("Failed to load checklist:", error);
      toast.error("Failed to load checklist");
    }
  };

  const loadChecklistsForPartNumber = async () => {
    if (!partData.partNumber) {
      toast.error("Enter a part number first");
      return;
    }

    try {
      const response = await axios.get<SavedChecklist[]>(`/api/ToolChecklist?partNumber=${partData.partNumber}`);
      setSavedChecklists(response.data);
      setShowLoadModal(true);
    } catch (error) {
      console.error("Failed to load checklists:", error);
      toast.error("Failed to load checklists");
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButtons(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const copyToClipboard = () => {
    const content = generateMarkdown();
    navigator.clipboard.writeText(content);
    alert("Checklist copied to clipboard! Paste into Google Docs or Word.");
  };

  const generateMarkdown = (): string => {
    const sections = getSections();
    let md = `TOOL PRE-SAMPLE EVALUATION CHECKLIST\n`;
    md += `${"=".repeat(80)}\n\n`;
    md += `Part Number: ${partData.partNumber || "[PART_NUMBER]"}\n`;
    md += `Part Name: ${partData.partName || "[PART_NAME]"}\n`;
    md += `Customer: ${partData.customer || "[CUSTOMER]"}\n`;
    md += `Cavities: ${partData.cavities || "[CAVITIES]"}\n`;
    md += `Mold Number: ${partData.moldNumber || "[MOLD_NUMBER]"}\n`;
    md += `Mold Width (pan to ceiling door): ${partData.moldWidth || "[MOLD_WIDTH]"}\n`;
    md += `Mold Thickness (platen to platen): ${partData.moldThickness || "[MOLD_THICKNESS]"}\n`;
    md += `Date: ${partData.date || "[DATE]"}\n`;
    md += `Inspector: ${partData.inspector || "[INSPECTOR]"}\n\n`;
    md += `${"=".repeat(80)}\n\n`;

    sections.forEach((section, idx) => {
      md += `${idx + 1}. ${section.title}\n`;
      md += `${"-".repeat(80)}\n`;
      md += `ID  | Item                                                    | Yes | No  | Actual\n`;
      md += `${"-".repeat(80)}\n`;

      section.items.forEach((item) => {
        const yesCheck = item.yes ? "[X]" : "[ ]";
        const noCheck = item.no ? "[X]" : "[ ]";
        const actual = item.actual || "";
        md += `${item.id.padEnd(4)}| ${item.text.padEnd(55)} | ${yesCheck} | ${noCheck} | ${actual}\n`;
      });
      md += `\n`;
    });

    return md;
  };

  const getSections = () => {
    return [
      {
        title: "Mold Condition & Setup",
        items: checklistItems.filter((item) => item.id.startsWith("1")),
      },
      {
        title: "Cavity & Core",
        items: checklistItems.filter((item) => item.id.startsWith("2")),
      },
      {
        title: "Ejection System",
        items: checklistItems.filter((item) => item.id.startsWith("3")),
      },
      {
        title: "Cooling System",
        items: checklistItems.filter((item) => item.id.startsWith("4")),
      },
      {
        title: "Safety & Installation",
        items: checklistItems.filter((item) => item.id.startsWith("5")),
      },
      {
        title: "Documentation & Accessories",
        items: checklistItems.filter((item) => item.id.startsWith("6")),
      },
    ];
  };

  // Styles
  const terminalStyles = {
    container: { background: "#000", color: "#0f0", fontFamily: "monospace", minHeight: "100vh", padding: "5px", maxWidth: "100vw" },
    header: { borderBottom: "2px solid #0f0", paddingBottom: "10px", marginBottom: "20px", fontSize: "20px", fontWeight: "bold", textAlign: "center" as const, width: "100%", boxSizing: "border-box" as const, wordWrap: "break-word" as const },
    section: { marginBottom: "30px", display: "flex", flexDirection: "column" as const, alignItems: "flex-start", width: "100%", boxSizing: "border-box" as const },
    sectionTitle: { color: "#0ff", fontSize: "14px", fontWeight: "bold", marginBottom: "10px", borderBottom: "1px solid #0f0", paddingBottom: "5px", width: "100%" },
    tableWrapper: { width: "100%", overflowX: "auto" as const },
    table: { width: "100%", borderCollapse: "collapse" as const, marginTop: "10px" },
    th: { background: "#003300", color: "#0f0", padding: "6px 8px", border: "1px solid #0f0", textAlign: "left" as const, fontSize: "11px" },
    td: { padding: "4px 6px", border: "1px solid #0f0", fontSize: "10px" },
    input: { background: "#001100", color: "#0f0", border: "none", padding: "2px 4px", width: "100%", fontFamily: "monospace", fontSize: "10px", boxSizing: "border-box" as const },
    checkbox: { width: "16px", height: "16px", accentColor: "#0f0" },
    button: { background: "#003300", color: "#0f0", border: "1px solid #0f0", padding: "10px 20px", cursor: "pointer", marginRight: "10px", marginBottom: "10px", fontSize: "14px", fontFamily: "monospace" },
    infoGrid: { display: "grid", gridTemplateColumns: "1fr", gap: "10px", marginBottom: "20px", width: "100%", boxSizing: "border-box" as const },
    infoLabel: { color: "#0ff", fontWeight: "bold", fontSize: "12px" },
    infoValue: { color: "#0f0" },
  };

  const professionalStyles = {
    container: { background: "#fff", color: "#000", fontFamily: "Arial, sans-serif", minHeight: "100vh", padding: "5px", maxWidth: "100vw" },
    header: { borderBottom: "3px solid #000", paddingBottom: "15px", marginBottom: "30px", fontSize: "24px", fontWeight: "bold", textAlign: "center" as const, width: "100%", boxSizing: "border-box" as const, wordWrap: "break-word" as const },
    section: { marginBottom: "40px", display: "flex", flexDirection: "column" as const, alignItems: "flex-start", width: "100%", boxSizing: "border-box" as const },
    sectionTitle: { color: "#000", fontSize: "16px", fontWeight: "bold", marginBottom: "15px", borderBottom: "2px solid #333", paddingBottom: "8px", width: "100%" },
    tableWrapper: { width: "100%", overflowX: "auto" as const },
    table: { width: "100%", borderCollapse: "collapse" as const, marginTop: "15px", border: "1px solid #000" },
    th: { background: "#f0f0f0", color: "#000", padding: "8px 10px", border: "1px solid #000", textAlign: "left" as const, fontSize: "12px", fontWeight: "bold" },
    td: { padding: "6px 8px", border: "1px solid #000", fontSize: "11px" },
    input: { background: "#fff", color: "#000", border: "none", padding: "2px 4px", width: "100%", fontFamily: "Arial, sans-serif", fontSize: "11px", boxSizing: "border-box" as const },
    checkbox: { width: "18px", height: "18px", accentColor: "#000" },
    button: { background: "#333", color: "#fff", border: "none", padding: "12px 24px", cursor: "pointer", marginRight: "10px", marginBottom: "10px", fontSize: "14px", borderRadius: "4px" },
    infoGrid: { display: "grid", gridTemplateColumns: "1fr", gap: "15px", marginBottom: "30px", border: "1px solid #000", padding: "20px", width: "100%", boxSizing: "border-box" as const },
    infoLabel: { color: "#000", fontWeight: "bold", fontSize: "13px" },
    infoValue: { color: "#000" },
  };

  const styles = styleMode === "terminal" ? terminalStyles : professionalStyles;
  const sections = getSections();

  return (
    <div className="checklist-container" style={{ ...styles.container, overflowX: "hidden", width: "100%", boxSizing: "border-box" }}>
      <div className="button-container" style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", width: "100%", boxSizing: "border-box" }}>
        <button style={styles.button} onClick={() => navigate(-1)}>← Back</button>
        <button style={{...styles.button, background: styleMode === "terminal" ? "#003300" : "#4CAF50", color: styleMode === "terminal" ? "#0f0" : "#fff", border: styleMode === "terminal" ? "1px solid #0f0" : "none", fontWeight: "bold"}} onClick={saveChecklist} disabled={isSaving}>
          {isSaving ? "Saving..." : currentChecklistID ? "Save New Version" : "Save Checklist"}
        </button>
        <button style={styles.button} onClick={loadChecklistsForPartNumber}>Load Previous</button>
        {versions.length > 1 && (
          <select
            value={currentVersion}
            onChange={(e) => loadChecklist(currentChecklistID!, parseInt(e.target.value))}
            style={{...styles.button, padding: "8px 12px"}}
          >
            {versions.map((v) => (
              <option key={v.versionNumber} value={v.versionNumber}>
                Version {v.versionNumber} ({new Date(v.createdDate).toLocaleDateString()})
              </option>
            ))}
          </select>
        )}
        <button style={styles.button} onClick={() => setStyleMode(styleMode === "terminal" ? "professional" : "terminal")}>
          Switch Style
        </button>
        <button style={styles.button} onClick={loadSampleData}>Sample Data</button>
        <button style={styles.button} onClick={copyToClipboard}>Copy</button>
        <button style={styles.button} onClick={() => window.print()}>Print/PDF</button>
      </div>

      <div ref={printRef} style={{ width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
        <div style={styles.header}>TOOL PRE-SAMPLE EVALUATION CHECKLIST</div>

        {/* Part Information */}
        <div className="info-grid" style={styles.infoGrid}>
          <label style={styles.infoLabel}>Part Number:</label>
          <div ref={dropdownRef} style={{ position: "relative", width: "100%" }}>
            <input
              type="text"
              value={partData.partNumber}
              onChange={(e) => handlePartNumberChange(e.target.value)}
              onFocus={() => {
                if (partData.partNumber && filteredProducts.length > 0) {
                  setShowDropdown(true);
                }
              }}
              style={styles.input}
              placeholder="Search by part number, name, or mold..."
            />
            {showDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: styleMode === "terminal" ? "#001100" : "#fff",
                  border: styleMode === "terminal" ? "1px solid #0f0" : "1px solid #000",
                  maxHeight: "200px",
                  overflowY: "auto",
                  overflowX: "hidden",
                  zIndex: 1000,
                  borderRadius: "4px",
                  marginTop: "2px",
                  boxSizing: "border-box",
                }}
              >
                {filteredProducts.map((product) => (
                  <div
                    key={product.productID}
                    onClick={() => handleProductSelect(product)}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      borderBottom: styleMode === "terminal" ? "1px solid #003300" : "1px solid #eee",
                      color: styleMode === "terminal" ? "#0f0" : "#000",
                      fontSize: "12px",
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = styleMode === "terminal" ? "#003300" : "#f0f0f0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div style={{ fontWeight: "bold", wordWrap: "break-word" }}>{product.partNumber}</div>
                    <div style={{ fontSize: "11px", opacity: 0.8, wordWrap: "break-word" }}>
                      {product.partName} {product.moldInsert?.fullNumber ? `| Mold: ${product.moldInsert.fullNumber}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <label style={styles.infoLabel}>Part Name:</label>
          <input
            type="text"
            value={partData.partName}
            onChange={(e) => setPartData({ ...partData, partName: e.target.value })}
            style={styles.input}
            placeholder="[PART_NAME]"
          />
          <label style={styles.infoLabel}>Customer:</label>
          <input
            type="text"
            value={partData.customer}
            onChange={(e) => setPartData({ ...partData, customer: e.target.value })}
            style={styles.input}
            placeholder="[CUSTOMER]"
          />
          <label style={styles.infoLabel}>Cavities:</label>
          <input
            type="number"
            value={partData.cavities}
            onChange={(e) => setPartData({ ...partData, cavities: parseInt(e.target.value) || 1 })}
            style={styles.input}
            placeholder="[CAVITIES]"
          />
          <label style={styles.infoLabel}>Mold Number:</label>
          <input
            type="text"
            value={partData.moldNumber}
            onChange={(e) => setPartData({ ...partData, moldNumber: e.target.value })}
            style={styles.input}
            placeholder="[MOLD_NUMBER]"
          />
          <label style={styles.infoLabel}>Mold Width:</label>
          <input
            type="text"
            value={partData.moldWidth}
            onChange={(e) => setPartData({ ...partData, moldWidth: e.target.value })}
            style={styles.input}
            placeholder="[MOLD_WIDTH]"
          />
          <label style={styles.infoLabel}>Mold Thickness:</label>
          <input
            type="text"
            value={partData.moldThickness}
            onChange={(e) => setPartData({ ...partData, moldThickness: e.target.value })}
            style={styles.input}
            placeholder="[MOLD_THICKNESS]"
          />
          <label style={styles.infoLabel}>Date:</label>
          <input
            type="date"
            value={partData.date}
            onChange={(e) => setPartData({ ...partData, date: e.target.value })}
            style={styles.input}
          />
          <label style={styles.infoLabel}>Inspector:</label>
          <input
            type="text"
            value={partData.inspector}
            onChange={(e) => setPartData({ ...partData, inspector: e.target.value })}
            style={styles.input}
            placeholder="[INSPECTOR]"
          />
        </div>

        {/* Checklist Sections */}
        {sections.map((section, idx) => (
          <div key={idx} className="checklist-section" style={styles.section}>
            <div className="section-title-desktop" style={styles.sectionTitle}>
              {idx + 1}. {section.title}
            </div>
            <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: "50px" }}>ID</th>
                  <th style={styles.th}>Item</th>
                  <th style={{ ...styles.th, width: "45px", textAlign: "center" }}>Yes</th>
                  <th style={{ ...styles.th, width: "45px", textAlign: "center" }}>No</th>
                  <th style={{ ...styles.th, width: "80px" }}>Actual</th>
                </tr>
              </thead>
              <tbody>
                {section.items.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.id}</td>
                    <td style={styles.td}>{item.text}</td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={item.yes}
                        onChange={() => handleCheckboxChange(item.id, "yes")}
                        style={styles.checkbox}
                      />
                    </td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={item.no}
                        onChange={() => handleCheckboxChange(item.id, "no")}
                        style={styles.checkbox}
                      />
                    </td>
                    <td style={styles.td}>
                      <input
                        type="text"
                        value={item.actual}
                        onChange={(e) => handleActualChange(item.id, e.target.value)}
                        style={styles.input}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Scroll Buttons */}
      {showScrollButtons && (
        <div
          className="scroll-buttons"
          style={{
            position: "fixed",
            bottom: "10px",
            right: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            zIndex: 1000,
          }}
        >
          <button
            onClick={scrollToTop}
            style={{
              ...styles.button,
              margin: 0,
              padding: "12px 16px",
              fontSize: "18px",
              borderRadius: styleMode === "professional" ? "50%" : "4px",
              width: "50px",
              height: "50px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Scroll to top"
          >
            ↑
          </button>
          <button
            onClick={scrollToBottom}
            style={{
              ...styles.button,
              margin: 0,
              padding: "12px 16px",
              fontSize: "18px",
              borderRadius: styleMode === "professional" ? "50%" : "4px",
              width: "50px",
              height: "50px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Scroll to bottom"
          >
            ↓
          </button>
        </div>
      )}

      {/* Load Checklist Modal */}
      {showLoadModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
          onClick={() => setShowLoadModal(false)}
        >
          <div
            style={{
              background: styleMode === "terminal" ? "#000" : "#fff",
              color: styleMode === "terminal" ? "#0f0" : "#000",
              border: styleMode === "terminal" ? "2px solid #0f0" : "2px solid #000",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflowY: "auto",
              boxSizing: "border-box",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, color: styleMode === "terminal" ? "#0ff" : "#000" }}>
              Load Previous Checklist
            </h2>

            {savedChecklists.length === 0 ? (
              <p>No saved checklists found for part number: {partData.partNumber}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {savedChecklists.map((checklist) => (
                  <div
                    key={checklist.checklistID}
                    style={{
                      padding: "12px",
                      border: styleMode === "terminal" ? "1px solid #0f0" : "1px solid #ccc",
                      borderRadius: "4px",
                      cursor: "pointer",
                      background: styleMode === "terminal" ? "#001100" : "#f9f9f9",
                    }}
                    onClick={() => {
                      loadChecklist(checklist.checklistID);
                      setShowLoadModal(false);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = styleMode === "terminal" ? "#003300" : "#e0e0e0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = styleMode === "terminal" ? "#001100" : "#f9f9f9";
                    }}
                  >
                    <div style={{ fontWeight: "bold" }}>{checklist.checklistNumber}</div>
                    <div style={{ fontSize: "12px", opacity: 0.8 }}>
                      {checklist.partNumber} - {checklist.partName}
                    </div>
                    <div style={{ fontSize: "11px", opacity: 0.6 }}>
                      Created: {new Date(checklist.createdDate).toLocaleString()} | Status: {checklist.status} | Version: {checklist.currentVersion}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
              <button style={styles.button} onClick={() => setShowLoadModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          * {
            box-sizing: border-box;
          }

          body, html {
            overflow-x: hidden;
            max-width: 100vw;
          }

          @media (max-width: 767px) {
            .checklist-container {
              padding: 5px !important;
              max-width: 100vw !important;
            }
            .button-container {
              margin-bottom: 10px !important;
            }
            .button-container button {
              width: 100% !important;
              margin-right: 0 !important;
            }
            .info-grid {
              padding: 10px !important;
              border-width: 1px !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
            }
            .scroll-buttons {
              bottom: 10px !important;
              right: 10px !important;
            }
            .scroll-buttons button {
              width: 45px !important;
              height: 45px !important;
              padding: 8px !important;
              font-size: 16px !important;
            }
            .checklist-container > div:nth-child(2) > div:first-child {
              font-size: 16px !important;
              word-wrap: break-word !important;
            }
          }

          @media (min-width: 768px) {
            .checklist-container {
              padding: 40px !important;
              max-width: 1200px !important;
              margin: 0 auto !important;
            }
            .info-grid {
              grid-template-columns: 200px 1fr !important;
              max-width: 600px !important;
              margin-left: auto !important;
              margin-right: auto !important;
            }
            .info-grid label {
              font-size: 14px !important;
            }
            .info-grid input {
              font-size: 14px !important;
            }
            .checklist-container > div:first-child + div > div:first-child {
              font-size: 28px !important;
            }
            .checklist-section {
              align-items: center !important;
            }
            .checklist-section > div {
              max-width: 700px !important;
            }
            .checklist-section table th {
              font-size: 14px !important;
              padding: 10px 12px !important;
            }
            .checklist-section table td {
              font-size: 13px !important;
              padding: 8px 10px !important;
            }
            .checklist-section table input {
              font-size: 13px !important;
              padding: 4px 6px !important;
            }
            .checklist-section .section-title-desktop {
              font-size: 18px !important;
            }
          }

          @media print {
            /* Disable color adjustment to allow our overrides */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            html, body {
              background: #fff !important;
              color: #000 !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              outline: none !important;
              box-shadow: none !important;
            }

            /* Hide navigation, header, and all UI controls */
            nav, header, .nav, .navbar, .header,
            button, .scroll-buttons, .button-container,
            [role="navigation"] {
              display: none !important;
              visibility: hidden !important;
              height: 0 !important;
              overflow: hidden !important;
            }

            /* Compact container */
            .checklist-container {
              padding: 0 !important;
              max-width: 100% !important;
              margin: 0 !important;
              background: #fff !important;
            }

            /* Title */
            .checklist-container > div:first-child + div > div:first-child {
              font-size: 14px !important;
              font-weight: bold !important;
              text-align: center !important;
              margin-bottom: 0 !important;
              padding-bottom: 0 !important;
              color: #000 !important;
              background: #fff !important;
              border: none !important;
              border-bottom: none !important;
            }

            /* Ensure all text is visible - NO GREEN */
            div, span, p, label, td, th, input {
              color: #000 !important;
            }

            /* White backgrounds for containers - NO BORDERS */
            .checklist-container, .checklist-container > div,
            #root, #root > div {
              background: #fff !important;
              border: none !important;
              outline: none !important;
              box-shadow: none !important;
            }

            /* Remove any green colors and all borders by default */
            * {
              color: #000 !important;
              border: none !important;
              outline: none !important;
              box-shadow: none !important;
            }

            /* Except keep borders on tables and info grid */
            table, .info-grid, .checklist-section .section-title-desktop {
              border: 1px solid #000 !important;
            }

            table th, table td {
              border: 1px solid #000 !important;
              color: #000 !important;
            }

            .info-grid input {
              border: none !important;
              border-bottom: 1px solid #000 !important;
            }

            /* Info grid - ultra compact layout */
            .info-grid {
              display: grid !important;
              grid-template-columns: auto 1fr auto 1fr !important;
              gap: 2px 6px !important;
              font-size: 8px !important;
              padding: 4px !important;
              margin: 0 0 4px 0 !important;
              max-width: 100% !important;
              border: 1px solid #000 !important;
              background: #fff !important;
              background-color: #fff !important;
            }

            .info-grid > * {
              background: #fff !important;
              background-color: #fff !important;
            }

            .info-grid label {
              font-size: 8px !important;
              font-weight: bold !important;
              color: #000 !important;
              white-space: nowrap !important;
            }

            .info-grid input {
              font-size: 8px !important;
              padding: 1px !important;
              border: none !important;
              border-bottom: 1px solid #000 !important;
              color: #000 !important;
              background: #fff !important;
            }

            /* Checklist sections - minimal spacing */
            .checklist-section {
              page-break-inside: avoid !important;
              margin-bottom: 4px !important;
            }

            .checklist-section > div {
              margin: 0 !important;
              padding: 0 !important;
            }

            .checklist-section .section-title-desktop {
              font-size: 10px !important;
              font-weight: bold !important;
              margin-bottom: 0 !important;
              padding-bottom: 2px !important;
              color: #000 !important;
              background: #e8e8e8 !important;
              border: 1px solid #000 !important;
              padding: 2px 4px !important;
            }

            /* Ultra compact table */
            .checklist-section table {
              width: 100% !important;
              border-collapse: collapse !important;
              font-size: 7px !important;
              border: 1px solid #000 !important;
              margin-top: 0 !important;
              margin-bottom: 0 !important;
            }

            /* Hide all table headers except section 1 */
            .checklist-section table thead {
              display: none !important;
            }

            /* Show section 1 header only with larger size (25% increase: 5px -> 6px) */
            .checklist-section:first-of-type table thead {
              display: table-header-group !important;
            }

            .checklist-section table th {
              font-size: 5px !important;
              padding: 2px 3px !important;
              border: 1px solid #000 !important;
              background: #f0f0f0 !important;
              color: #000 !important;
              font-weight: bold !important;
              line-height: 1.2 !important;
            }

            .checklist-section:first-of-type table th {
              font-size: 6px !important;
            }

            .checklist-section table td {
              font-size: 10px !important;
              padding: 2px 3px !important;
              border: 1px solid #000 !important;
              color: #000 !important;
              background: #fff !important;
              line-height: 1.2 !important;
            }

            .checklist-section table input[type="checkbox"] {
              width: 12px !important;
              height: 12px !important;
              margin: 0 auto !important;
              display: block !important;
            }

            .checklist-section table input[type="text"] {
              font-size: 10px !important;
              padding: 1px !important;
              width: 100% !important;
              border: none !important;
              color: #000 !important;
              background: #fff !important;
            }

            @page {
              size: letter;
              margin: 0.25in 0.3in;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ToolPreSampleChecklist;
