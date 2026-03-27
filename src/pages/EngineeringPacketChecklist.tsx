import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "../axios";
import { Product } from "../types/Product";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

interface EngineeringPacketChecklistData {
  id: number;
  productID: number;
  moldNum: string;
  partNum: string;
  partName: string;
  matlCode: string;
  material: string;
  color: string;
  toolLoc: string;
  asOf: string;
  assmYN: string;
  assmNum: string;
  quoteComplete: boolean;
  quoteInitials?: string;
  quoteDate?: string;
  costingComplete: boolean;
  costingInitials?: string;
  costingDate?: string;
  print2dComplete: boolean;
  print2dInitials?: string;
  print2dDate?: string;
  print3dComplete: boolean;
  print3dInitials?: string;
  print3dDate?: string;
  setupComplete: boolean;
  setupInitials?: string;
  setupDate?: string;
  toolpicsComplete: boolean;
  toolpicsInitials?: string;
  toolpicsDate?: string;
  partpicsComplete: boolean;
  partpicsInitials?: string;
  partpicsDate?: string;
  toolevalComplete: boolean;
  toolevalInitials?: string;
  toolevalDate?: string;
  sampleComplete: boolean;
  sampleInitials?: string;
  sampleDate?: string;
  qualityComplete: boolean;
  qualityInitials?: string;
  qualityDate?: string;
  layoutComplete: boolean;
  layoutInitials?: string;
  layoutDate?: string;
  custsamplesComplete: boolean;
  custsamplesInitials?: string;
  custsamplesDate?: string;
  tooldrawComplete: boolean;
  tooldrawInitials?: string;
  tooldrawDate?: string;
}

export default function EngineeringPacketChecklist() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId");
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    moldNum: "",
    partNum: "",
    partName: "",
    matlCode: "",
    material: "",
    color: "",
    toolLoc: "LVM T",
    asOf: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '/'),
    assmYN: "",
    assmNum: "",
  });

  const [checks, setChecks] = useState({
    quote: false, costing: false, print2d: false, print3d: false,
    setup: false, toolpics: false, partpics: false, tooleval: false,
    sample: false, quality: false, layout: false, custsamples: false,
    tooldraw: false, dataperf: false, quickbooks: false, lvmnew: false,
  });

  const [fileDates, setFileDates] = useState<Record<string, string>>({});
  const [fileUsers, setFileUsers] = useState<Record<string, string>>({});
  const [latestToolRunId, setLatestToolRunId] = useState<number | null>(null);
  const [checklistId, setChecklistId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Get current user initials from auth context
  const getCurrentUserInitials = () => {
    if (user?.initials) return user.initials;
    if (user?.username) return user.username.substring(0, 3).toUpperCase();
    return '';
  };

  const getTodayDate = () => {
    return new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
  };

  useEffect(() => {
    const loadData = async () => {
      if (!productId) return;

      try {
        // Load product data
        const res = await axios.get<Product>(`/api/products/${productId}`);
        setProduct(res.data);

        // Load saved checklist data - this is the single source of truth
        const hasChecklist = await loadSavedChecklist(productId);

        // If no checklist exists yet, auto-fill from product data
        if (!hasChecklist) {
          setFormData(prev => ({
            ...prev,
            moldNum: res.data.moldInsert?.fullNumber || "",
            partNum: res.data.partNumber,
            partName: res.data.partName,
            material: res.data.material?.name || "",
            color: res.data.material?.name?.includes("BLACK") ? "BLACK" : "",
          }));
        }

        // Always fetch the latest tool run ID for the setup link
        try {
          const toolRuns = await axios.get<any[]>(`/api/products/${productId}/tool-runs`);
          if (toolRuns.data && toolRuns.data.length > 0) {
            const latestRun = toolRuns.data.sort((a, b) =>
              new Date(b.runDateTime).getTime() - new Date(a.runDateTime).getTime()
            )[0];
            setLatestToolRunId(latestRun.id);
          }
        } catch { /* No tool runs */ }
      } catch {
        toast.error("Failed to load product");
      }
    };

    loadData();
  }, [productId]);

  const loadSavedChecklist = async (prodId: string): Promise<boolean> => {
    try {
      console.log('[CHECKLIST] Loading saved checklist for product:', prodId);
      const res = await axios.get<EngineeringPacketChecklistData>(`/api/EngineeringPacketChecklist/product/${prodId}`);
      console.log('[CHECKLIST] Loaded checklist data:', res.data);

      if (res.data) {
        setChecklistId(res.data.id);

        // Load ALL form data from database
        setFormData({
          moldNum: res.data.moldNum || "",
          partNum: res.data.partNum || "",
          partName: res.data.partName || "",
          matlCode: res.data.matlCode || "",
          material: res.data.material || "",
          color: res.data.color || "",
          toolLoc: res.data.toolLoc || "LVM T",
          asOf: res.data.asOf || "",
          assmYN: res.data.assmYN || "",
          assmNum: res.data.assmNum || "",
        });

        // Load ALL checks from database
        setChecks({
          quote: res.data.quoteComplete,
          costing: res.data.costingComplete,
          print2d: res.data.print2dComplete,
          print3d: res.data.print3dComplete,
          setup: res.data.setupComplete,
          toolpics: res.data.toolpicsComplete,
          partpics: res.data.partpicsComplete,
          tooleval: res.data.toolevalComplete,
          sample: res.data.sampleComplete,
          quality: res.data.qualityComplete,
          layout: res.data.layoutComplete,
          custsamples: res.data.custsamplesComplete,
          tooldraw: res.data.tooldrawComplete,
          dataperf: false,
          quickbooks: false,
          lvmnew: false,
        });

        // Load ALL dates and initials from database - this is the single source of truth
        const loadedDates = {
          quote: res.data.quoteDate || '',
          costing: res.data.costingDate || '',
          print2d: res.data.print2dDate || '',
          print3d: res.data.print3dDate || '',
          setup: res.data.setupDate || '',
          toolpics: res.data.toolpicsDate || '',
          partpics: res.data.partpicsDate || '',
          tooleval: res.data.toolevalDate || '',
          sample: res.data.sampleDate || '',
          quality: res.data.qualityDate || '',
          layout: res.data.layoutDate || '',
          custsamples: res.data.custsamplesDate || '',
          tooldraw: res.data.tooldrawDate || '',
        };

        const loadedUsers = {
          quote: res.data.quoteInitials || '',
          costing: res.data.costingInitials || '',
          print2d: res.data.print2dInitials || '',
          print3d: res.data.print3dInitials || '',
          setup: res.data.setupInitials || '',
          toolpics: res.data.toolpicsInitials || '',
          partpics: res.data.partpicsInitials || '',
          tooleval: res.data.toolevalInitials || '',
          sample: res.data.sampleInitials || '',
          quality: res.data.qualityInitials || '',
          layout: res.data.layoutInitials || '',
          custsamples: res.data.custsamplesInitials || '',
          tooldraw: res.data.tooldrawInitials || '',
        };

        console.log('[CHECKLIST] Loaded dates:', loadedDates);
        console.log('[CHECKLIST] Loaded users/initials:', loadedUsers);
        console.log('[CHECKLIST] toolpics specifically - Complete:', res.data.toolpicsComplete, 'Initials:', res.data.toolpicsInitials, 'Date:', res.data.toolpicsDate);

        setFileDates(loadedDates);
        setFileUsers(loadedUsers);

        return true;
      }
      return false;
    } catch (error) {
      // No saved checklist yet, that's fine
      return false;
    }
  };

  // Refetch data when page regains focus (e.g., after uploading files)
  useEffect(() => {
    const handleFocus = () => {
      if (productId) {
        // Reload from database when refocusing
        loadSavedChecklist(productId);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [productId]);


  const fillExample = () => {
    setFormData({
      moldNum: "102020B01",
      partNum: "8057",
      partName: '1 1/2" 100 DEGREE MB ELBOW',
      matlCode: "0401",
      material: "HIGH IMPACT NYLON",
      color: "BLACK",
      toolLoc: "LVM T",
      asOf: "08/24/24",
      assmYN: "",
      assmNum: "",
    });
    setChecks({
      quote: true, costing: true, print2d: true, print3d: true,
      setup: true, toolpics: true, partpics: true, tooleval: true,
      sample: true, quality: true, layout: false, custsamples: true,
      tooldraw: false, dataperf: false, quickbooks: false, lvmnew: false,
    });
    toast.success("Form filled with example data!");
  };

  const handleRefresh = async () => {
    if (productId) {
      // Simply reload from database
      await loadSavedChecklist(productId);
      toast.success("Checklist refreshed!");
    }
  };

  const handleSave = async () => {
    if (!productId) {
      toast.error("No product selected");
      return;
    }

    setIsSaving(true);
    try {
      // Helper to ensure checked items have initials and date
      const userInitials = getCurrentUserInitials();
      const today = getTodayDate();

      const getInitials = (field: string, isChecked: boolean) => {
        if (!isChecked) return null; // Clear initials when unchecked
        if (!fileUsers[field]) return userInitials; // Auto-fill if checked but empty
        return fileUsers[field];
      };

      const getDate = (field: string, isChecked: boolean) => {
        if (!isChecked) return null; // Clear date when unchecked
        if (!fileDates[field]) return today; // Auto-fill if checked but empty
        return fileDates[field];
      };

      const payload = {
        productID: parseInt(productId),
        moldNum: formData.moldNum,
        partNum: formData.partNum,
        partName: formData.partName,
        matlCode: formData.matlCode,
        material: formData.material,
        color: formData.color,
        toolLoc: formData.toolLoc,
        asOf: formData.asOf,
        assmYN: formData.assmYN,
        assmNum: formData.assmNum,
        quoteComplete: checks.quote,
        quoteInitials: getInitials('quote', checks.quote),
        quoteDate: getDate('quote', checks.quote),
        costingComplete: checks.costing,
        costingInitials: getInitials('costing', checks.costing),
        costingDate: getDate('costing', checks.costing),
        print2dComplete: checks.print2d,
        print2dInitials: getInitials('print2d', checks.print2d),
        print2dDate: getDate('print2d', checks.print2d),
        print3dComplete: checks.print3d,
        print3dInitials: getInitials('print3d', checks.print3d),
        print3dDate: getDate('print3d', checks.print3d),
        setupComplete: checks.setup,
        setupInitials: getInitials('setup', checks.setup),
        setupDate: getDate('setup', checks.setup),
        toolpicsComplete: checks.toolpics,
        toolpicsInitials: getInitials('toolpics', checks.toolpics),
        toolpicsDate: getDate('toolpics', checks.toolpics),
        partpicsComplete: checks.partpics,
        partpicsInitials: getInitials('partpics', checks.partpics),
        partpicsDate: getDate('partpics', checks.partpics),
        toolevalComplete: checks.tooleval,
        toolevalInitials: getInitials('tooleval', checks.tooleval),
        toolevalDate: getDate('tooleval', checks.tooleval),
        sampleComplete: checks.sample,
        sampleInitials: getInitials('sample', checks.sample),
        sampleDate: getDate('sample', checks.sample),
        qualityComplete: checks.quality,
        qualityInitials: getInitials('quality', checks.quality),
        qualityDate: getDate('quality', checks.quality),
        layoutComplete: checks.layout,
        layoutInitials: getInitials('layout', checks.layout),
        layoutDate: getDate('layout', checks.layout),
        custsamplesComplete: checks.custsamples,
        custsamplesInitials: getInitials('custsamples', checks.custsamples),
        custsamplesDate: getDate('custsamples', checks.custsamples),
        tooldrawComplete: checks.tooldraw,
        tooldrawInitials: getInitials('tooldraw', checks.tooldraw),
        tooldrawDate: getDate('tooldraw', checks.tooldraw),
      };

      console.log('[CHECKLIST] Saving payload:', payload);
      console.log('[CHECKLIST] toolpicsComplete:', payload.toolpicsComplete);
      console.log('[CHECKLIST] toolpicsInitials:', payload.toolpicsInitials);
      console.log('[CHECKLIST] toolpicsDate:', payload.toolpicsDate);

      const response = await axios.put(`/api/EngineeringPacketChecklist/product/${productId}`, payload);
      console.log('[CHECKLIST] Save response:', response.data);
      toast.success("Checklist saved!");
    } catch (error) {
      console.error("Error saving checklist:", error);
      toast.error("Failed to save checklist");
    } finally {
      setIsSaving(false);
    }
  };

  // Generate links for clickable items
  const getFileLink = (type: string) => {
    const token = localStorage.getItem("token") || "";
    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    return `${baseUrl}/api/productfiles/${productId}/${type}?token=${token}`;
  };

  return (
    <div style={styles.container} className="checklist-print-container">
      <div style={styles.btnContainer} className="no-print">
        <button style={styles.backBtn} onClick={() => navigate(-1)}>Back</button>
        <button style={styles.saveDbBtn} onClick={handleSave} disabled={isSaving || !productId}>
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button style={styles.pdfBtn} onClick={() => window.print()}>Print</button>
        <button style={styles.fillBtn} onClick={fillExample}>Fill Example</button>
        <button style={styles.refreshBtn} onClick={handleRefresh}>Refresh</button>
      </div>

      <h1 style={styles.title}>LEE VALLEY MOLDING ENGINEERING PACKET CHECK LIST</h1>

      <p style={styles.printNote} className="no-print print-note">Tip: Use Ctrl+P, set margins to 0.5", disable headers/footers</p>

      {/* Header Table */}
      <table style={styles.table}>
        <tbody>
          <tr>
            <td style={styles.labelCell}>LVM MOLD #</td>
            <td style={styles.valueCell}>
              <input style={styles.input} value={formData.moldNum} onChange={e => setFormData({...formData, moldNum: e.target.value})} />
            </td>
            <td style={styles.labelCell}>P.N.</td>
            <td style={styles.valueCell}>
              <input style={styles.input} value={formData.partNum} onChange={e => setFormData({...formData, partNum: e.target.value})} />
            </td>
            <td style={styles.labelCell}>PART NAME</td>
            <td style={styles.valueCell} colSpan={4}>
              <input style={styles.input} value={formData.partName} onChange={e => setFormData({...formData, partName: e.target.value})} />
            </td>
          </tr>
          <tr>
            <td style={styles.labelCell}>MATL CODE</td>
            <td style={styles.valueCell}>
              <input style={styles.input} value={formData.matlCode} onChange={e => setFormData({...formData, matlCode: e.target.value})} />
            </td>
            <td style={styles.labelCell}>MATERIAL</td>
            <td style={styles.valueCell} colSpan={2}>
              <input style={styles.input} value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} />
            </td>
            <td style={styles.labelCell}>COLOR CODE</td>
            <td style={styles.valueCell} colSpan={3}>
              <input style={styles.input} value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
            </td>
          </tr>
          <tr>
            <td style={styles.labelCell}>TOOL LOC.</td>
            <td style={styles.valueCell}>
              <input style={styles.input} value={formData.toolLoc} onChange={e => setFormData({...formData, toolLoc: e.target.value})} />
            </td>
            <td style={styles.labelCell}>AS OF</td>
            <td style={styles.valueCell}>
              <input style={styles.input} value={formData.asOf} onChange={e => setFormData({...formData, asOf: e.target.value})} />
            </td>
            <td style={styles.labelCell}>ASSM Y/N</td>
            <td style={styles.valueCell}>
              <select style={styles.input} value={formData.assmYN} onChange={e => setFormData({...formData, assmYN: e.target.value})}>
                <option value="">--</option>
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </td>
            <td style={styles.labelCell}>ASSM#</td>
            <td style={styles.valueCell} colSpan={2}>
              <input style={styles.input} value={formData.assmNum} onChange={e => setFormData({...formData, assmNum: e.target.value})} />
            </td>
          </tr>
        </tbody>
      </table>

      {/* Checklist Table */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{...styles.th, width: "60px"}}>Complete<br/>Y/N</th>
            <th style={styles.th}>Description / Number / File</th>
            <th style={{...styles.th, width: "50px"}}>INIT.</th>
            <th style={{...styles.th, width: "70px"}}>Date</th>
            <th style={{...styles.th, width: "100px"}}>Notes</th>
          </tr>
        </thead>
        <tbody>
          <ChecklistRow label="Quote" field="quote" checks={checks} setChecks={setChecks} date={fileDates.quote} initials={fileUsers.quote} setFileDates={setFileDates} setFileUsers={setFileUsers} getCurrentUserInitials={getCurrentUserInitials} getTodayDate={getTodayDate} link={product?.partNumber ? `/quotes?partNumber=${product.partNumber}` : undefined} />
          <ChecklistRow label="Costing" field="costing" checks={checks} setChecks={setChecks} date={fileDates.costing} initials={fileUsers.costing} setFileDates={setFileDates} setFileUsers={setFileUsers} getCurrentUserInitials={getCurrentUserInitials} getTodayDate={getTodayDate} link={product?.partNumber ? `/quotes?partNumber=${product.partNumber}` : undefined} />
          <ChecklistRow label="2D CAD" field="print2d" checks={checks} setChecks={setChecks} date={fileDates.print2d} initials={fileUsers.print2d} setFileDates={setFileDates} setFileUsers={setFileUsers} getCurrentUserInitials={getCurrentUserInitials} getTodayDate={getTodayDate} link={productId ? getFileLink('2d-cad') : undefined} />
          <ChecklistRow label="3D CAD" field="print3d" checks={checks} setChecks={setChecks} date={fileDates.print3d} initials={fileUsers.print3d} setFileDates={setFileDates} setFileUsers={setFileUsers} getCurrentUserInitials={getCurrentUserInitials} getTodayDate={getTodayDate} link={productId ? getFileLink('3d-cad') : undefined} />
          <ChecklistRow label="Set Up" field="setup" checks={checks} setChecks={setChecks} date={fileDates.setup} initials={fileUsers.setup} setFileDates={setFileDates} setFileUsers={setFileUsers} getCurrentUserInitials={getCurrentUserInitials} getTodayDate={getTodayDate} link={productId ? (latestToolRunId ? `/products/${productId}/tool-runs/${latestToolRunId}` : `/products/${productId}/setup-sheet`) : undefined} />
          <ChecklistRow label="Tool Pics" field="toolpics" checks={checks} setChecks={setChecks} date={fileDates.toolpics} initials={fileUsers.toolpics} setFileDates={setFileDates} setFileUsers={setFileUsers} getCurrentUserInitials={getCurrentUserInitials} getTodayDate={getTodayDate} link={product?.moldInsert?.moldId ? `/molds/${product.moldInsert.moldId}/tool-pictures` : undefined} />
          <ChecklistRow label="Part Pics" field="partpics" checks={checks} setChecks={setChecks} date={fileDates.partpics} initials={fileUsers.partpics} setFileDates={setFileDates} setFileUsers={setFileUsers} getCurrentUserInitials={getCurrentUserInitials} getTodayDate={getTodayDate} link={product?.moldInsert?.moldId && product?.moldInsert?.fullNumber ? `/molds/${product.moldInsert.moldId}/inserts/${product.moldInsert.fullNumber}/photos` : undefined} />
          <ChecklistRow label="Tool Evaluation Checklist" field="tooleval" checks={checks} setChecks={setChecks} date={fileDates.tooleval} initials={fileUsers.tooleval} setFileDates={setFileDates} setFileUsers={setFileUsers} getCurrentUserInitials={getCurrentUserInitials} getTodayDate={getTodayDate} link={productId ? `/tool-checklist?productId=${productId}` : undefined} />
          <ChecklistRow label="Sample Planning Check List" field="sample" checks={checks} setChecks={setChecks} date={fileDates.sample} initials={fileUsers.sample} setFileDates={setFileDates} setFileUsers={setFileUsers} getCurrentUserInitials={getCurrentUserInitials} getTodayDate={getTodayDate} />
          <ChecklistRow label="Quality Standards Instructions" field="quality" checks={checks} setChecks={setChecks} date={fileDates.quality} initials={fileUsers.quality} setFileDates={setFileDates} setFileUsers={setFileUsers} getCurrentUserInitials={getCurrentUserInitials} getTodayDate={getTodayDate} link={productId ? `/qsi/${productId}` : undefined} />
          <ChecklistRow label="Layout" field="layout" checks={checks} setChecks={setChecks} date={fileDates.layout} initials={fileUsers.layout} setFileDates={setFileDates} setFileUsers={setFileUsers} getCurrentUserInitials={getCurrentUserInitials} getTodayDate={getTodayDate} />
          <ChecklistRow label="Customer Approved Samples" field="custsamples" checks={checks} setChecks={setChecks} date={fileDates.custsamples} initials={fileUsers.custsamples} setFileDates={setFileDates} setFileUsers={setFileUsers} getCurrentUserInitials={getCurrentUserInitials} getTodayDate={getTodayDate} />
          <ChecklistRow label="Tooling Drawings" field="tooldraw" checks={checks} setChecks={setChecks} date={fileDates.tooldraw} initials={fileUsers.tooldraw} setFileDates={setFileDates} setFileUsers={setFileUsers} getCurrentUserInitials={getCurrentUserInitials} getTodayDate={getTodayDate} />
          {/* Computer Database Updates section - HIDDEN
          <tr>
            <td colSpan={5} style={styles.sectionHeader}>Computer Database Updates</td>
          </tr>
          <ChecklistRow label="Dataperfect" field="dataperf" checks={checks} setChecks={setChecks} date={fileDates.dataperf} initials={fileUsers.dataperf} />
          <ChecklistRow label="Quick Books" field="quickbooks" checks={checks} setChecks={setChecks} date={fileDates.quickbooks} initials={fileUsers.quickbooks} />
          <ChecklistRow label="LVM NEW" field="lvmnew" checks={checks} setChecks={setChecks} date={fileDates.lvmnew} initials={fileUsers.lvmnew} />
          */}
          <tr>
            <td colSpan={5} style={styles.sectionHeader}>FINAL APPROVALS</td>
          </tr>
        </tbody>
      </table>

      {/* Signatures */}
      <table style={styles.table}>
        <tbody>
          <SignatureRow label="ENGINEERING" />
          <SignatureRow label="SALES" />
          <SignatureRow label="QUALITY" />
          <SignatureRow label="PLANT MANG." />
        </tbody>
      </table>

      <p style={styles.footer}>© Lee Valley Molding | Confidential Engineering Packet</p>

      <style>{`
        @media print {
          /* Hide everything except the checklist */
          .no-print,
          nav,
          header,
          aside,
          .sidebar,
          .navbar,
          .nav-header,
          .mobile-nav,
          [class*="nav"],
          [class*="sidebar"],
          [class*="header"]:not(.checklist-header) {
            display: none !important;
          }

          /* Reset body and html */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Main container styling for print */
          body > div,
          #root,
          #root > div {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* The checklist container */
          .checklist-print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0.3in !important;
            font-size: 9pt !important;
            background: white !important;
            box-sizing: border-box !important;
          }

          /* Title */
          .checklist-print-container h1 {
            font-size: 12pt !important;
            margin: 0 0 8px 0 !important;
          }

          /* Tables */
          .checklist-print-container table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-bottom: 6px !important;
            font-size: 8pt !important;
          }

          .checklist-print-container td,
          .checklist-print-container th {
            border: 1px solid #000 !important;
            padding: 2px 4px !important;
            color: black !important;
            text-decoration: none !important;
            font-size: 8pt !important;
            background: white !important;
          }

          .checklist-print-container th {
            background: #e8e8e8 !important;
            font-size: 7pt !important;
          }

          /* Label cells (gray background) */
          .checklist-print-container td[style*="background: rgb(232, 232, 232)"],
          .checklist-print-container td[style*="background:#e8e8e8"] {
            background: #e8e8e8 !important;
          }

          /* Inputs should show their values cleanly */
          .checklist-print-container input {
            border: none !important;
            background: transparent !important;
            font-size: 8pt !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }

          /* Checkboxes */
          .checklist-print-container input[type="checkbox"] {
            width: 12px !important;
            height: 12px !important;
          }

          /* Footer */
          .checklist-print-container p {
            font-size: 7pt !important;
            margin: 4px 0 !important;
          }

          /* Hide print note */
          .print-note {
            display: none !important;
          }

          /* Page settings */
          @page {
            size: letter;
            margin: 0.4in;
          }
        }
      `}</style>
    </div>
  );
}

function ChecklistRow({ label, field, checks, setChecks, date, initials, setFileDates, setFileUsers, getCurrentUserInitials, getTodayDate, link }: any) {
  const displayInitials = initials || '';
  const displayDate = date || '';

  // isComplete means both initials AND date are filled (for visual styling)
  const isComplete = !!(displayInitials && displayDate);
  const isChecked = checks[field];

  const labelStyle = link ? {
    ...styles.td,
    cursor: 'pointer',
    color: '#0066cc',
    textDecoration: 'underline',
  } : styles.td;

  const handleClick = (e: React.MouseEvent) => {
    if (link) {
      e.preventDefault();
      if (link.startsWith('http')) {
        window.open(link, '_blank');
      } else {
        const fullUrl = window.location.origin + link;
        window.open(fullUrl, '_blank');
      }
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setChecks({...checks, [field]: checked});

    if (checked) {
      // Auto-fill initials and date when checking (if not already filled)
      if (!displayInitials && !displayDate) {
        const userInitials = getCurrentUserInitials();
        const today = getTodayDate();

        if (userInitials) {
          setFileUsers((prev: Record<string, string>) => ({ ...prev, [field]: userInitials }));
        }
        setFileDates((prev: Record<string, string>) => ({ ...prev, [field]: today }));
      }
    } else {
      // Clear initials and date when unchecking
      setFileUsers((prev: Record<string, string>) => ({ ...prev, [field]: '' }));
      setFileDates((prev: Record<string, string>) => ({ ...prev, [field]: '' }));
    }
  };

  const handleInitialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileUsers((prev: Record<string, string>) => ({ ...prev, [field]: e.target.value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileDates((prev: Record<string, string>) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <tr>
      <td style={{...styles.td, textAlign: "center"}}>
        <input
          type="checkbox"
          checked={isChecked}
          onChange={handleCheckboxChange}
          style={{
            ...styles.checkbox,
            accentColor: isChecked && isComplete ? '#0066cc' : undefined,
          }}
        />
      </td>
      <td style={labelStyle} onClick={handleClick}>
        <strong>{label}</strong>
      </td>
      <td style={styles.td}>
        <input
          style={styles.smallInput}
          placeholder="K.C."
          value={displayInitials}
          onChange={handleInitialsChange}
        />
      </td>
      <td style={styles.td}>
        <input
          style={styles.smallInput}
          placeholder="8/24"
          value={displayDate}
          onChange={handleDateChange}
        />
      </td>
      <td style={styles.td}><input style={styles.smallInput} /></td>
    </tr>
  );
}

function SignatureRow({ label }: { label: string }) {
  return (
    <tr>
      <td style={{...styles.labelCell, width: "120px"}}>{label}</td>
      <td style={{...styles.sigLine}}><input style={styles.sigInput} /></td>
      <td style={{...styles.labelCell, width: "60px"}}>DATE</td>
      <td style={{width: "100px"}}><input style={styles.smallInput} /></td>
    </tr>
  );
}

const styles = {
  container: {
    maxWidth: "8in",
    margin: "0 auto",
    padding: "0.4in",
    fontFamily: "Arial, sans-serif",
    fontSize: "9pt",
    background: "white",
    color: "black",
  } as React.CSSProperties,
  btnContainer: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
  } as React.CSSProperties,
  backBtn: {
    background: "#333",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    cursor: "pointer",
    borderRadius: "4px",
    fontSize: "12px",
  } as React.CSSProperties,
  saveDbBtn: {
    background: "#2196F3",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    cursor: "pointer",
    borderRadius: "4px",
    fontSize: "12px",
  } as React.CSSProperties,
  pdfBtn: {
    background: "#4CAF50",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    cursor: "pointer",
    borderRadius: "4px",
    fontSize: "12px",
  } as React.CSSProperties,
  fillBtn: {
    background: "#607D8B",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    cursor: "pointer",
    borderRadius: "4px",
    fontSize: "12px",
  } as React.CSSProperties,
  refreshBtn: {
    background: "#FF9800",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    cursor: "pointer",
    borderRadius: "4px",
    fontSize: "12px",
  } as React.CSSProperties,
  title: {
    textAlign: "center",
    fontSize: "11pt",
    fontWeight: "bold",
    margin: "0 0 8px 0",
    textDecoration: "underline",
    textDecorationThickness: "0.6px",
  } as React.CSSProperties,
  printNote: {
    fontSize: "8pt",
    color: "#666",
    textAlign: "center",
    margin: "4px 0",
    fontStyle: "italic",
  } as React.CSSProperties,
  table: {
    borderCollapse: "collapse",
    width: "100%",
    marginBottom: "6px",
    border: "1px solid #000",
  } as React.CSSProperties,
  labelCell: {
    background: "#e8e8e8",
    fontWeight: "bold",
    padding: "2px 4px",
    border: "1px solid #000",
    fontSize: "8pt",
    whiteSpace: "nowrap",
  } as React.CSSProperties,
  valueCell: {
    background: "white",
    padding: "2px 4px",
    border: "1px solid #000",
  } as React.CSSProperties,
  th: {
    background: "#e8e8e8",
    fontWeight: "bold",
    padding: "2px 2px",
    border: "1px solid #000",
    fontSize: "7pt",
    textAlign: "center",
  } as React.CSSProperties,
  td: {
    padding: "2px 4px",
    border: "1px solid #000",
    fontSize: "8pt",
  } as React.CSSProperties,
  sectionHeader: {
    background: "#d0d0d0",
    fontWeight: "bold",
    padding: "3px 4px",
    border: "1px solid #000",
    fontSize: "8pt",
  } as React.CSSProperties,
  sigLine: {
    borderBottom: "1px solid #000",
    height: "22px",
    padding: "2px 4px",
    border: "1px solid #000",
  } as React.CSSProperties,
  input: {
    width: "100%",
    border: "none",
    background: "transparent",
    fontFamily: "inherit",
    fontSize: "8pt",
    padding: "1px",
  } as React.CSSProperties,
  smallInput: {
    width: "100%",
    border: "none",
    background: "transparent",
    fontFamily: "inherit",
    fontSize: "8pt",
    padding: "1px",
  } as React.CSSProperties,
  sigInput: {
    width: "100%",
    border: "none",
    background: "transparent",
    fontFamily: "inherit",
    fontSize: "8pt",
    padding: "1px",
  } as React.CSSProperties,
  checkbox: {
    width: "14px",
    height: "14px",
    cursor: "pointer",
  } as React.CSSProperties,
  footer: {
    fontSize: "7pt",
    color: "#666",
    textAlign: "center",
    margin: "6px 0 2px 0",
    fontStyle: "italic",
  } as React.CSSProperties,
};
