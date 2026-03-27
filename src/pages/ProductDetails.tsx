// src/pages/ProductDetails.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import axios from "../axios";
import { Product } from "../types/Product";
import toast from "react-hot-toast";

interface Checklist {
  checklistID: number;
  checklistNumber: string;
  partNumber: string;
  partName: string;
  customer: string;
  status: string;
  currentVersion: number;
  createdDate: string;
  createdBy: string;
}

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasQsi, setHasQsi] = useState<boolean | null>(null);
  const [hasToolRuns, setHasToolRuns] = useState(false);
  const [fileExists, setFileExists] = useState<Record<string, boolean>>({
    "2d-cad": false,
    "3d-cad": false,
  });
  const [basePhotos, setBasePhotos] = useState<string[]>([]);
  const [insertPhotos, setInsertPhotos] = useState<string[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [partImages, setPartImages] = useState<{ fileName: string; source: string }[]>([]);
  const [catalogImageExists, setCatalogImageExists] = useState(false);
  const [catalogImageUrl, setCatalogImageUrl] = useState("");
  const [customerImageUploading, setCustomerImageUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);

    axios
      .get<Product>(`/api/products/${id}`)
      .then((res) => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load product");
        setLoading(false);
      });

    axios
      .get(`/api/qsi/product/${id}`)
      .then(() => setHasQsi(true))
      .catch((err) => setHasQsi(err.response?.status === 404 ? false : null));

    // Check for tool runs (setup sheet exists if tool runs exist)
    axios
      .get<any[]>(`/api/products/${id}/tool-runs`)
      .then((res) => setHasToolRuns(res.data && res.data.length > 0))
      .catch(() => setHasToolRuns(false));

    // Check all file existence via HEAD requests
    const types = ["2d-cad", "3d-cad"];
    types.forEach((type) => {
      axios
        .head(`/api/productfiles/${id}/${type}`)
        .then(() => setFileExists((prev) => ({ ...prev, [type]: true })))
        .catch(() => setFileExists((prev) => ({ ...prev, [type]: false })));
    });
  }, [id, location.key]); // Refetch when location changes (e.g., navigating back from edit)

  useEffect(() => {
    if (product?.moldInsert?.moldId) {
      // Load ALL base photos (untagged photos)
      axios
        .get<{ files: string[] }>(`/api/moldfiles/${product.moldInsert.moldId}/tool-pictures/base`)
        .then((res) => setBasePhotos(res.data.files || []))
        .catch(() => setBasePhotos([]));

      // Load insert-specific photos using fullNumber
      if (product.moldInsert.fullNumber) {
        axios
          .get<{ files: string[] }>(
            `/api/moldfiles/${product.moldInsert.moldId}/tool-pictures/inserts/${product.moldInsert.fullNumber}`
          )
          .then((res) => setInsertPhotos(res.data.files || []))
          .catch(() => setInsertPhotos([]));
      }
    }

    // Load engineering images for this part
    if (product?.partNumber) {
      axios
        .get<{ files: { fileName: string; source: string }[] }>(`/api/partimages/${product.partNumber}`)
        .then((res) => setPartImages(res.data.files || []))
        .catch(() => setPartImages([]));

      // Check if catalog image exists
      axios
        .head(`/api/customer-images/preview/${product.partNumber}`)
        .then(() => {
          setCatalogImageExists(true);
          setCatalogImageUrl(`/api/customer-images/preview/${product.partNumber}?${Date.now()}`);
        })
        .catch(() => setCatalogImageExists(false));
    }

    // Load checklists for this part
    if (product?.partNumber) {
      axios
        .get<Checklist[]>(`/api/ToolChecklist?partNumber=${product.partNumber}`)
        .then((res) => setChecklists(res.data))
        .catch(() => setChecklists([]));
    }
  }, [product]);

  const handleFileClick = (type: string) => {
    const token = localStorage.getItem("token") || "";
    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const url = `${baseUrl}/api/productfiles/${id}/${type}?token=${token}`;
    window.open(url, "_blank");
  };

  const handleSetupSheetClick = async () => {
    if (!hasToolRuns || !id) return;

    try {
      // Fetch tool runs and get the latest one
      const res = await axios.get<any[]>(`/api/products/${id}/tool-runs`);
      if (res.data && res.data.length > 0) {
        // Sort by runDateTime descending to get latest
        const latestRun = res.data.sort(
          (a, b) => new Date(b.runDateTime).getTime() - new Date(a.runDateTime).getTime()
        )[0];
        navigate(`/products/${id}/tool-runs/${latestRun.id}`);
      }
    } catch (error) {
      toast.error("Failed to load setup sheet");
    }
  };

  const handleFileUpload = async (type: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`/api/productfiles/${id}/${type}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`${type.toUpperCase()} uploaded successfully`);

      // Refresh file existence check
      axios
        .head(`/api/productfiles/${id}/${type}`)
        .then(() => setFileExists((prev) => ({ ...prev, [type]: true })))
        .catch(() => setFileExists((prev) => ({ ...prev, [type]: false })));
    } catch (error) {
      toast.error(`Failed to upload ${type}`);
    }
  };

  const trigger2dUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileUpload("2d-cad", file);
    };
    input.click();
  };

  const trigger3dUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".step,.stp,.iges,.igs,.dxf,.dwg";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileUpload("3d-cad", file);
    };
    input.click();
  };

  const triggerPartImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/jpg,image/png,image/webp";
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0 || !product?.partNumber) return;

      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      try {
        await axios.post(`/api/partimages/${product.partNumber}/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(`${files.length} image(s) uploaded`);

        // Refresh image list
        const res = await axios.get<{ files: { fileName: string; source: string }[] }>(`/api/partimages/${product.partNumber}`);
        setPartImages(res.data.files || []);
      } catch (error) {
        toast.error("Failed to upload images");
      }
    };
    input.click();
  };

  const triggerCustomerImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/jpg,image/png,image/webp";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !product?.partNumber) return;

      setCustomerImageUploading(true);

      // Convert to JPG if not already
      let uploadFile = file;
      if (!file.type.includes("jpeg") && !file.name.toLowerCase().endsWith(".jpg")) {
        try {
          const canvas = document.createElement("canvas");
          const img = new Image();
          const url = URL.createObjectURL(file);
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = url;
          });
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          canvas.getContext("2d")!.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          const blob = await new Promise<Blob>((resolve) =>
            canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92)
          );
          uploadFile = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
        } catch {
          // If conversion fails, upload original
        }
      }

      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("partNumber", product.partNumber);

      try {
        await axios.post("/api/customer-images/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Catalog image uploaded successfully");
        setCatalogImageExists(true);
        setCatalogImageUrl(`/api/customer-images/preview/${product.partNumber}?${Date.now()}`);
      } catch (error: any) {
        const msg = error.response?.data?.error || "Failed to upload customer image";
        toast.error(msg);
      } finally {
        setCustomerImageUploading(false);
      }
    };
    input.click();
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
    try {
      await axios.delete(`/api/products/${id}`);
      toast.success("Product deleted");
      navigate("/products");
    } catch {
      toast.error("Delete failed");
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!product) return <div style={styles.error}>Product not found</div>;

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backBtn}>
        ← Back
      </button>

      <div style={styles.header}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h1 style={styles.title}>{product.partName}</h1>
            <p style={styles.partNumber}>Part #: {product.partNumber}</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => navigate(`/products/${id}/edit`)} style={styles.editBtn}>
              Edit
            </button>
            <button onClick={handleDelete} style={styles.deleteBtn}>
              Delete
            </button>
          </div>
        </div>
      </div>

      <div style={styles.detailsCard}>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          {/* Images Column */}
          <div style={{ minWidth: 220, maxWidth: 280, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Engineering Photos */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: "#0f0", fontSize: "0.85rem", fontWeight: "bold" }}>ENGINEERING</span>
                <button
                  onClick={triggerPartImageUpload}
                  style={{
                    background: "transparent",
                    color: "#0f0",
                    border: "1px solid #0f0",
                    padding: "4px 10px",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: "0.75rem",
                  }}
                >
                  + Add Photos
                </button>
              </div>
              {partImages.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {partImages.map((img) => (
                    <div key={img.fileName} style={{ position: "relative" }}>
                      <img
                        src={`/api/partimages/${product.partNumber}/${img.fileName}`}
                        alt={img.fileName}
                        style={{
                          width: "100%",
                          maxHeight: 180,
                          objectFit: "contain",
                          borderRadius: 8,
                          border: "1px solid #333",
                          cursor: "pointer",
                          background: "#111",
                        }}
                        onClick={() => setLightboxUrl(`/api/partimages/${product.partNumber}/${img.fileName}`)}
                      />
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm(`Delete ${img.fileName}?`)) return;
                          try {
                            await axios.delete(`/api/partimages/${product.partNumber}/${img.fileName}`);
                            setPartImages((prev) => prev.filter((f) => f.fileName !== img.fileName));
                            toast.success("Image deleted");
                          } catch {
                            toast.error("Failed to delete");
                          }
                        }}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          background: "rgba(0,0,0,0.7)",
                          color: "#f55",
                          border: "none",
                          borderRadius: "50%",
                          width: 22,
                          height: 22,
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Delete image"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    height: 100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px dashed #444",
                    borderRadius: 8,
                  }}
                >
                  <p style={{ color: "#666", margin: 0, fontSize: "0.85rem" }}>No engineering photos</p>
                </div>
              )}
            </div>

            {/* Catalog Image */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: "#f90", fontSize: "0.85rem", fontWeight: "bold" }}>CATALOG</span>
                <button
                  onClick={triggerCustomerImageUpload}
                  disabled={customerImageUploading}
                  style={{
                    background: "transparent",
                    color: "#f90",
                    border: "1px solid #f90",
                    padding: "4px 10px",
                    borderRadius: 4,
                    cursor: customerImageUploading ? "wait" : "pointer",
                    fontSize: "0.75rem",
                    opacity: customerImageUploading ? 0.5 : 1,
                  }}
                >
                  {customerImageUploading ? "..." : catalogImageExists ? "Replace" : "Upload"}
                </button>
              </div>
              {catalogImageExists ? (
                <img
                  src={catalogImageUrl}
                  alt="Catalog"
                  style={{
                    width: "100%",
                    maxHeight: 180,
                    objectFit: "contain",
                    borderRadius: 8,
                    border: "2px solid #f90",
                    cursor: "pointer",
                  }}
                  onClick={() => setLightboxUrl(catalogImageUrl)}
                />
              ) : (
                <div
                  style={{
                    height: 80,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px dashed #664400",
                    borderRadius: 8,
                  }}
                >
                  <p style={{ color: "#666", margin: 0, fontSize: "0.85rem" }}>No catalog image</p>
                </div>
              )}
            </div>
          </div>

          {/* Part Details */}
          <div style={{ flex: 1 }}>
            <div style={styles.row}>
              <div style={styles.detail}>
                <span style={styles.label}>Mold Number</span>
                <span style={styles.value}>{product.moldInsert?.fullNumber || "N/A"}</span>
              </div>
              <div style={styles.detail}>
                <span style={styles.label}>Bin ID</span>
                <span style={styles.value}>{product.binId || "-"}</span>
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.detail}>
                <span style={styles.label}>Material</span>
                <span style={styles.value}>{product.material?.name || "N/A"}</span>
              </div>

              <div style={styles.detail}>
                <span style={styles.label}>Batch Size</span>
                <span style={styles.value}>{product.batchSize || "-"}</span>
              </div>
            </div>

            <div style={styles.row}></div>

            <div style={styles.row}>
              <div style={styles.detail}>
                <span style={styles.label}>Location</span>
                <span style={styles.value}>
                  {product.moldInsert?.mold?.physicalLocation === "IN"
                    ? "IN - Indiana"
                    : product.moldInsert?.mold?.physicalLocation === "TN"
                      ? "TN - Tennessee"
                      : product.moldInsert?.mold?.physicalLocation || "N/A"}
                </span>
              </div>

              <div style={styles.detail}>
                <span style={styles.label}>Shelf Location</span>
                <span style={styles.value}>{product.moldInsert?.mold?.shelfLocation || "-"}</span>
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.detail}>
                <span style={styles.label}>Full Box Quantity</span>
                <span style={styles.value}>{product.fullBoxQty || "-"}</span>
              </div>
              <div style={styles.detail}>
                <span style={styles.label}>Box Size</span>
                <span style={styles.value}>{product.boxSize || "-"}</span>
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.detail}>
                <span style={styles.label}>Cavities</span>
                <span style={styles.value}>{product.cavities || "-"}</span>
              </div>

              <div style={styles.detail}>
                <span style={styles.label}>Unit Price</span>
                <span style={styles.value}>{product.unitPrice || "-"}</span>
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.detail}>
                <span style={styles.label}>Note</span>
                <span style={styles.value}>{product.note || "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.engineeringSection}>
        <h2 style={styles.sectionTitle}>Engineering Files</h2>
        <div style={styles.engineeringGrid}>
          {/* 2D CAD */}
          {fileExists["2d-cad"] ? (
            <div style={styles.btnWithReplace}>
              <button
                onClick={() => handleFileClick("2d-cad")}
                style={{
                  ...styles.engBtn,
                  flex: 1,
                  color: "#0f0",
                  borderColor: "#0f0",
                }}
              >
                📄 2D CAD
              </button>
              <button
                onClick={trigger2dUpload}
                style={styles.replaceBtn}
                title="Replace 2D CAD (PDF)"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #00ff00 0%, #00cc00 100%)";
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 255, 0, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #0f0 0%, #0a0 100%)";
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 255, 0, 0.3)";
                }}
              >
                ↻
              </button>
            </div>
          ) : (
            <button
              onClick={trigger2dUpload}
              style={{
                ...styles.engBtn,
                cursor: "pointer",
                color: "#888",
                borderColor: "#444",
              }}
            >
              📄 Upload 2D CAD
            </button>
          )}

          {/* 3D CAD */}
          {fileExists["3d-cad"] ? (
            <div style={styles.btnWithReplace}>
              <button
                onClick={() => handleFileClick("3d-cad")}
                style={{
                  ...styles.engBtn,
                  flex: 1,
                  color: "#0f0",
                  borderColor: "#0f0",
                }}
              >
                📐 3D CAD
              </button>
              <button
                onClick={trigger3dUpload}
                style={styles.replaceBtn}
                title="Replace 3D CAD"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #00ff00 0%, #00cc00 100%)";
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 255, 0, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #0f0 0%, #0a0 100%)";
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 255, 0, 0.3)";
                }}
              >
                ↻
              </button>
            </div>
          ) : (
            <button
              onClick={trigger3dUpload}
              style={{
                ...styles.engBtn,
                cursor: "pointer",
                color: "#888",
                borderColor: "#444",
              }}
            >
              📐 Upload 3D CAD
            </button>
          )}

          {/* Insert Photos */}
          <button
            onClick={() => {
              if (product?.moldInsert?.moldId && product?.moldInsert?.fullNumber) {
                navigate(`/molds/${product.moldInsert.moldId}/inserts/${product.moldInsert.fullNumber}/photos`);
              } else {
                toast.error("No mold insert information available");
              }
            }}
            style={{
              ...styles.engBtn,
              cursor: "pointer",
              color: "#0f0",
              borderColor: "#0f0",
            }}
          >
            📷 Upload Insert Photos
          </button>

          <button
            onClick={handleSetupSheetClick}
            disabled={!hasToolRuns}
            style={{
              ...styles.engBtn,
              opacity: hasToolRuns ? 1 : 0.4,
              cursor: hasToolRuns ? "pointer" : "not-allowed",
              color: hasToolRuns ? "#0f0" : "#666",
              borderColor: hasToolRuns ? "#0f0" : "#444",
            }}
          >
            📋 Setup Sheet
          </button>

          <button
            onClick={() => navigate(`/tool-checklist?productId=${product.productID}`)}
            style={{
              ...styles.engBtn,
              cursor: "pointer",
              color: "#0f0",
              borderColor: "#0f0",
            }}
          >
            ✅ Tool Checklist
          </button>
          <button
            onClick={() => navigate(`/engineering-packet?productId=${product.productID}`)}
            style={{
              ...styles.engBtn,
              cursor: "pointer",
              color: "#0f0",
              borderColor: "#0f0",
            }}
          >
            📦 Engineering Packet
          </button>
        </div>
      </div>

      {/* Tool Pre-Sample Checklists Section - HIDDEN */}
      {/* <div style={{ marginTop: 40 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 style={styles.sectionTitle}>Tool Pre-Sample Checklists</h2>
          <button
            onClick={() => navigate(`/tool-checklist?productId=${product.productID}`)}
            style={styles.uploadBtn}
          >
            + New Checklist
          </button>
        </div>
        {checklists.length === 0 ? (
          <p style={{ color: "#aaa" }}>No checklists found for this part</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {checklists.map((checklist) => (
              <div
                key={checklist.checklistID}
                onClick={() => navigate(`/tool-checklist?productId=${product.productID}`)}
                style={{
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: 8,
                  padding: 16,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#0f0";
                  e.currentTarget.style.background = "#222";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#333";
                  e.currentTarget.style.background = "#1a1a1a";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ color: "#0f0", fontWeight: "bold", fontSize: "1.1rem" }}>
                      {checklist.checklistNumber}
                    </div>
                    <div style={{ color: "#aaa", fontSize: "0.9rem", marginTop: 4 }}>
                      Created: {new Date(checklist.createdDate).toLocaleDateString()} by {checklist.createdBy}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      color: checklist.status === "Draft" ? "#f90" : "#0f0",
                      fontWeight: "bold"
                    }}>
                      {checklist.status}
                    </div>
                    <div style={{ color: "#aaa", fontSize: "0.85rem", marginTop: 4 }}>
                      Version {checklist.currentVersion}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div> */}

      {/* Tool Photos Section */}
      <div style={styles.engineeringSection}>
        <h2 style={styles.sectionTitle}>Mold & Insert Photos</h2>

        {/* Insert Photos */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ color: "#0f0", margin: 0, fontSize: "1.2rem" }}>Insert Photos</h3>
          {product?.moldInsert?.moldId && (
            <div style={{ display: "flex", gap: 8 }}>
              {product.moldInsert?.moldId && product.moldInsert?.fullNumber && (
                <Link to={`/molds/${product.moldInsert.moldId}/tool-pictures`} style={{ textDecoration: "none" }}>
                  <button style={styles.engBtn}>View Mold Base</button>
                </Link>
              )}

              {product.moldInsert?.moldId && product.moldInsert?.fullNumber && (
                <Link
                  to={`/molds/${product.moldInsert.moldId}/tool-pictures/manage`}
                  style={{ textDecoration: "none" }}
                >
                  <button style={styles.engBtn}>Manage Tags</button>
                </Link>
              )}

              {product.moldInsert?.moldId && product.moldInsert?.fullNumber && (
                <Link
                  to={`/molds/${product.moldInsert.moldId}/inserts/${product.moldInsert.fullNumber}/photos`}
                  style={{ textDecoration: "none" }}
                >
                  <button style={styles.engBtn}>Upload Insert Photos</button>
                </Link>
              )}
            </div>
          )}
        </div>
        {insertPhotos.length === 0 ? (
          <p style={{ color: "#aaa" }}>No insert photos</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            {insertPhotos.map((file) => (
              <img
                key={file}
                src={`/api/moldfiles/${product?.moldInsert?.moldId}/tool-pictures/inserts/${product?.moldInsert?.fullNumber}/${file}`}
                alt={file}
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 8,
                  border: "1px solid #333",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                  cursor: "pointer",
                }}
                onClick={() =>
                  setLightboxUrl(
                    `/api/moldfiles/${product?.moldInsert?.moldId}/tool-pictures/inserts/${product?.moldInsert?.fullNumber}/${file}`
                  )
                }
              />
            ))}
          </div>
        )}

        {/* Base Photos */}
        {basePhotos.length > 0 && (
          <div>
            <h3 style={{ color: "#0f0", margin: "0 0 16px 0", fontSize: "1.2rem" }}>Mold Base Photos</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {basePhotos.map((file) => (
                <img
                  key={file}
                  src={`/api/moldfiles/${product?.moldInsert?.moldId}/tool-pictures/base/${file}`}
                  alt={file}
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: 8,
                    border: "1px solid #333",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setLightboxUrl(`/api/moldfiles/${product?.moldInsert?.moldId}/tool-pictures/base/${file}`)
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Overlay */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            cursor: "zoom-out",
          }}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "transparent",
              color: "#fff",
              border: "1px solid #666",
              borderRadius: "50%",
              width: 40,
              height: 40,
              fontSize: "1.2rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            X
          </button>
          <img
            src={lightboxUrl}
            alt="Preview"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: 8,
              cursor: "default",
            }}
          />
        </div>
      )}
    </div>
  );
}

// Styles (updated for type safety)
const styles = {
  container: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "24px 20px",
    fontFamily: "system-ui, sans-serif",
  } as const,
  loading: { textAlign: "center" as const, padding: 40, color: "#aaa" },
  error: { textAlign: "center" as const, padding: 40, color: "#fcc" },
  backBtn: {
    background: "transparent",
    color: "#0f0",
    border: "1px solid #0f0",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    marginBottom: 16,
  },
  header: {
    marginBottom: 24,
    borderBottom: "1px solid #333",
    paddingBottom: 16,
  },
  title: {
    color: "#0f0",
    margin: "0 0 8px 0",
    fontSize: "2rem",
    fontWeight: 600,
  },
  partNumber: { color: "#aaa", margin: 0 },
  detailsCard: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1.0fr 1.0fr",
    gap: 16,
    marginBottom: 16,
  },
  detail: { display: "flex", flexDirection: "column" as const, gap: 4 },
  label: {
    color: "#0f0",
    fontSize: "0.85rem",
    textTransform: "uppercase" as const,
  },
  value: { color: "#fff", fontSize: "1.05rem" },
  actions: { display: "flex", alignItems: "center", marginBottom: 32 },
  editBtn: {
    background: "#0f0",
    color: "#000",
    border: "none",
    padding: "10px 20px",
    borderRadius: 8,
    fontWeight: "bold" as const,
    cursor: "pointer",
    fontSize: "0.95rem",
  },
  deleteBtn: {
    background: "#d33",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: 8,
    fontWeight: "bold" as const,
    cursor: "pointer",
    fontSize: "0.95rem",
  },
  engineeringSection: { marginTop: 20 },
  sectionTitle: {
    color: "#0f0",
    fontSize: "1.5rem",
    marginBottom: 20,
    borderBottom: "1px solid #333",
    paddingBottom: 8,
  },
  engineeringGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
  },
  btnWithReplace: {
    display: "flex",
    gap: "8px",
    alignItems: "stretch",
  },
  engBtn: {
    display: "block",
    background: "transparent",
    color: "#0f0",
    border: "1px solid #0f0",
    padding: "12px 16px",
    borderRadius: 8,
    textAlign: "center" as const,
    fontWeight: "bold",
    cursor: "pointer",
    width: "100%",
  },
  uploadBtn: {
    background: "#0f0",
    color: "#000",
    border: "none",
    padding: "8px 16px",
    borderRadius: 6,
    fontWeight: "bold" as const,
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  uploadBtnSmall: {
    background: "#0f0",
    color: "#000",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    fontWeight: "bold" as const,
    cursor: "pointer",
    fontSize: "1.2rem",
    minWidth: "45px",
  },
  replaceBtn: {
    background: "linear-gradient(135deg, #0f0 0%, #0a0 100%)",
    color: "#000",
    border: "none",
    padding: "0 16px",
    borderRadius: 8,
    fontWeight: "bold" as const,
    cursor: "pointer",
    fontSize: "1.4rem",
    minWidth: "50px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 2px 8px rgba(0, 255, 0, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
