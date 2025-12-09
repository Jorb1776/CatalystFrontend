// src/components/QsiForm.tsx
import React, { useEffect, useState, ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

// MUI — make sure you have these installed:
// npm install @mui/material @emotion/react @emotion/styled
import {
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import toast from "react-hot-toast";

interface QsiDetail {
  detailLetter: string;
  instruction: string;
  measurementMethod: string;
  defectCode: string;
}

interface QsiData {
  id: number;
  productId: number;
  partNumber: string;
  moldNumber: string;
  customer: string | null;
  partName: string;
  material: string;
  color: string;
  cavities: number;
  sampleQty: number;
  docReq: string | null;
  revisionDate: string | null;
  issuedBy: string | null;
  approvedBy: string | null;
  details: QsiDetail[];
  photo1: string | null;
  photo2: string | null;
  photo3: string | null;
}

export default function QsiForm() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [qsi, setQsi] = useState<QsiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgErrors, setImgErrors] = useState<{
    1?: boolean;
    2?: boolean;
    3?: boolean;
  }>({});

  useEffect(() => {
    loadQsi();
  }, [productId]);

  const loadQsi = async () => {
    if (!productId) return;

    try {
      const res = await axios.get<QsiData>(`/api/qsi/product/${productId}`, {
        timeout: 8000, // 8 second timeout
      });
      setQsi(res.data);
      setQsi({
        ...res.data,
        moldNumber: res.data.moldNumber || "—",
      });
    } catch (err: any) {
      console.error("QSI load failed:", err);

      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        toast.error("QSI server timeout — check API");
      } else if (err.response?.status === 404) {
        // Auto-create
        try {
          const createRes = await axios.post<QsiData>(
            `/api/qsi/create-from-product/${productId}`,
            {},
            {
              timeout: 8000,
            }
          );
          setQsi(createRes.data);
        } catch (createErr) {
          toast.error("Failed to create QSI");
          console.error(createErr);
        }
      } else {
        toast.error("QSI load error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!qsi) return;
    try {
      await axios.put(`/api/qsi/${qsi.id}`, {
        Customer: qsi.customer,
        RevisionDate: qsi.revisionDate,
        IssuedBy: qsi.issuedBy,
        ApprovedBy: qsi.approvedBy,
        DocReq: qsi.docReq,
        Details: qsi.details.map((d) => ({
          DetailLetter: d.detailLetter,
          Instruction: d.instruction,
          MeasurementMethod: d.measurementMethod,
          DefectCode: d.defectCode,
        })),
      });
      toast.success("QSI Saved!");
      // Optional: reload to get fresh data
      loadQsi();
    } catch (err: any) {
      console.error("Save failed:", err.response?.data || err);
      toast.error("Save failed");
    }
  };

  const updateDetail = (
    index: number,
    field: keyof QsiDetail,
    value: string
  ) => {
    if (!qsi) return;
    const newDetails = [...qsi.details];
    newDetails[index] = { ...newDetails[index], [field]: value.toUpperCase() };
    setQsi({ ...qsi, details: newDetails });
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress />
      </Box>
    );
  if (!qsi) return <Typography color="error">Failed to load QSI</Typography>;

  const handlePhotoUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    photoNumber: number
  ) => {
    const file = e.target.files?.[0];
    if (!file || !qsi) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post<{ url: string }>(
        `/api/qsi/upload-photo/${qsi.id}/${photoNumber}`,
        formData
      );

      // Update QSI data
      setQsi(
        (prev) =>
          ({
            ...prev!,
            [`photo${photoNumber}`]: res.data.url,
          } as QsiData)
      );

      setImgErrors((prev) => ({ ...prev, [photoNumber]: false }));

      toast.success(`Photo ${photoNumber} updated`);
    } catch (err) {
      toast.error("Upload failed");
    }
  };

  const clearPhoto = async (photoNumber: number) => {
    if (!qsi || !window.confirm("Remove this photo?")) return;

    try {
      await axios.delete(`/api/qsi/photo/${qsi.id}/${photoNumber}`);

      setQsi(
        (prev) =>
          ({
            ...prev!,
            [`photo${photoNumber}`]: null,
          } as QsiData)
      );

      // Reset error state
      setImgErrors((prev) => ({ ...prev, [photoNumber]: false }));

      toast.success("Photo removed");
    } catch {
      toast.error("Failed to remove");
    }
  };

  const addDetailRow = () => {
    if (!qsi) return;
    const nextLetter = String.fromCharCode(65 + qsi.details.length);
    setQsi({
      ...qsi,
      details: [
        ...qsi.details,
        {
          detailLetter: nextLetter,
          instruction: "",
          measurementMethod: "",
          defectCode: "",
        },
      ],
    });
  };

  const removeDetailRow = (index: number) => {
    if (!qsi) return;
    const newDetails = qsi.details
      .filter((_, i) => i !== index)
      .map((d, i) => ({ ...d, detailLetter: String.fromCharCode(65 + i) }));
    setQsi({ ...qsi, details: newDetails });
  };

  return (
    <Box
      sx={{
        p: 3,
        maxWidth: 1200,
        mx: "auto",
        fontFamily: '"Courier New", monospace',
        bgcolor: "#fff",
        color: "#000",
      }}
    >
      <button onClick={() => navigate(-1)} style={styles.backBtn}>
        ← Back
      </button>

      <Typography
        variant="h4"
        align="center"
        fontWeight="bold"
        gutterBottom
        sx={{ mt: 2 }}
      >
        LVM QUALITY STANDARDS INSTRUCTIONS
      </Typography>

      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr 1fr" }}
        gap={2}
        mb={3}
      >
        <TextField
          label="Customer Part #"
          value={qsi.partNumber}
          InputProps={{ readOnly: true }}
          size="small"
        />
        <TextField
          label="Mold #"
          value={qsi.moldNumber}
          InputProps={{ readOnly: true }}
          size="small"
        />
        <TextField
          label="Customer"
          value={qsi.customer || ""}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setQsi({ ...qsi, customer: e.target.value })
          }
          size="small"
        />

        <TextField
          label="Part Name"
          value={qsi.partName}
          InputProps={{ readOnly: true }}
          fullWidth
          sx={{ gridColumn: { sm: "span 3" } }}
          size="small"
        />

        <TextField
          label="Material"
          value={qsi.material}
          InputProps={{ readOnly: true }}
          size="small"
        />
        <TextField
          label="Color"
          value={qsi.color}
          InputProps={{ readOnly: true }}
          size="small"
        />
        <TextField
          label="Cavities"
          value={qsi.cavities}
          InputProps={{ readOnly: true }}
          size="small"
        />
      </Box>

      {/* Part Photos */}
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: "#000" }}>
        Part Reference Photos
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 3,
          mb: 4,
        }}
      >
        {([1, 2, 3] as const).map((num) => {
          const photoKey = `photo${num}` as "photo1" | "photo2" | "photo3";
          const photoUrl = qsi[photoKey];
          const hasError = imgErrors[num];
          const showUploadBox = !photoUrl || hasError;

          return (
            <Box key={num}>
              {showUploadBox ? (
                <Box
                  border="2px dashed #999"
                  borderRadius={2}
                  width="100%"
                  height={220}
                  bgcolor="#f5f5f5"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  sx={{
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": { borderColor: "#666", bgcolor: "#eee" },
                  }}
                  onClick={() =>
                    document.getElementById(`upload-photo${num}`)?.click()
                  }
                >
                  <Typography color="#666" fontWeight="500">
                    Click to upload Photo {num}
                  </Typography>
                </Box>
              ) : (
                <img
                  src={photoUrl}
                  alt={`Photo ${num}`}
                  style={{
                    width: "100%",
                    height: 220,
                    objectFit: "contain",
                    border: "2px solid #ddd",
                    borderRadius: 8,
                    backgroundColor: "#fafafa",
                  }}
                  onError={() =>
                    setImgErrors((prev) => ({ ...prev, [num]: true }))
                  }
                />
              )}

              <input
                id={`upload-photo${num}`}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handlePhotoUpload(e, num)}
              />

              {!showUploadBox && (
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  onClick={() => clearPhoto(num)}
                  sx={{ mt: 1, width: "100%", fontWeight: "bold" }}
                >
                  Remove Photo {num}
                </Button>
              )}
            </Box>
          );
        })}
      </Box>

      <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={addDetailRow}
          sx={{ fontWeight: "bold" }}
        >
          + Add Detail Row
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={3} sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#fff" }}>
            <TableRow>
              <TableCell
                sx={{ color: "#000", fontWeight: "bold", fontSize: "0.95rem" }}
              >
                DETAIL
              </TableCell>
              <TableCell
                sx={{ color: "#000", fontWeight: "bold", fontSize: "0.95rem" }}
              >
                QUALITY STANDARDS INSTRUCTIONS
              </TableCell>
              <TableCell
                sx={{ color: "#000", fontWeight: "bold", fontSize: "0.95rem" }}
              >
                M/M
              </TableCell>
              <TableCell
                sx={{ color: "#000", fontWeight: "bold", fontSize: "0.95rem" }}
              >
                DEFECT CODE
              </TableCell>
              <TableCell
                sx={{ color: "#000", fontWeight: "bold", fontSize: "0.95rem" }}
              ></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {qsi.details.map((row, i) => (
              <TableRow key={i}>
                <TableCell sx={{ fontWeight: "bold" }}>
                  {row.detailLetter}
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    multiline
                    value={row.instruction}
                    onChange={(e) =>
                      updateDetail(i, "instruction", e.target.value)
                    }
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={row.measurementMethod}
                    onChange={(e) =>
                      updateDetail(i, "measurementMethod", e.target.value)
                    }
                    size="small"
                    sx={{ width: 60 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={row.defectCode}
                    onChange={(e) =>
                      updateDetail(i, "defectCode", e.target.value)
                    }
                    size="small"
                    sx={{ width: 80 }}
                  />
                </TableCell>
                {/* TRASH BUTTON */}
                <TableCell align="center" sx={{ width: 50 }}>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => removeDetailRow(i)}
                    sx={{ minWidth: 36, p: 0.5 }}
                  >
                    X
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Defect Code & Measurement Method Legend */}
      <Box
        sx={{
          mt: 4,
          mb: 4,
          p: 3,
          bgcolor: "#fff",
          color: "#000",
          borderRadius: 2,
          fontFamily: '"Courier New", monospace',
        }}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          gutterBottom
          sx={{ fontSize: "1.1rem" }}
        >
          DEFECT CODE: CR = CRITICAL MA = MAJOR MI = MINOR
        </Typography>
        <Typography
          variant="h6"
          fontWeight="bold"
          gutterBottom
          sx={{ fontSize: "1.1rem" }}
        >
          M/M = METHOD OF MEASURE
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 2,
            mt: 2,
          }}
        >
          {[
            [
              ["C", "CALIPERS"],
              ["M", "MICROMETER"],
              ["P", "PIN"],
              ["SC", "SCALES"],
            ],
            [
              ["MV", "MICROVIEW"],
              ["O", "OPTICAL COMPARATOR"],
              ["V", "VISUAL"],
            ],
            [
              ["CM", "COLOR METER"],
              ["G", "GAGES"],
              ["CB", "COLOR BOOTH"],
            ],
            [
              ["F", "FUNCTION"],
              ["S", "SAMPLES"],
              ["I", "INDICATORS"],
            ],
          ].map((column, idx) => (
            <Box key={idx}>
              {column.map(([code, desc]) => (
                <Typography key={code} sx={{ fontSize: "0.95rem", mb: 0.5 }}>
                  <strong>{code}</strong> = {desc}
                </Typography>
              ))}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Signatures & Save */}
      <Box
        sx={{
          mt: 4,
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 3,
        }}
      >
        <Box sx={{ fontFamily: '"Courier New", monospace', flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Typography fontWeight="bold" sx={{ minWidth: 120 }}>
              ISSUED BY:
            </Typography>
            <TextField
              size="small"
              value={qsi.issuedBy || ""}
              onChange={(e) => setQsi({ ...qsi, issuedBy: e.target.value })}
              placeholder="Signature"
              sx={{ width: 260, fontFamily: '"Courier New", monospace' }}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography fontWeight="bold" sx={{ minWidth: 120 }}>
              APPROVED BY:
            </Typography>
            <TextField
              size="small"
              value={qsi.approvedBy || ""}
              onChange={(e) => setQsi({ ...qsi, approvedBy: e.target.value })}
              placeholder="Signature"
              sx={{ width: 260, fontFamily: '"Courier New", monospace' }}
            />
            <Typography fontWeight="bold" sx={{ ml: 2 }}>
              DATE:
            </Typography>
            <TextField
              size="small"
              type="date"
              value={qsi.revisionDate ? qsi.revisionDate.split("T")[0] : ""}
              onChange={(e) =>
                setQsi((prev) => ({ ...prev!, revisionDate: e.target.value }))
              }
              sx={{ width: 160 }}
            />
          </Box>
        </Box>

        <Button
          variant="contained"
          size="large"
          color="success"
          onClick={handleSave}
          sx={{
            px: 6,
            py: 2,
            fontSize: "1.2rem",
            fontWeight: "bold",
            minWidth: 200,
          }}
        >
          SAVE QSI
        </Button>
      </Box>

      <Typography align="right" fontSize="11px" sx={{ color: "#666", mt: 3 }}>
        F-300 REV. 11/25/25
      </Typography>
    </Box>
  );
}

const styles = {
  backBtn: {
    background: "transparent",
    color: "#0f0",
    border: "1px solid #0f0",
    padding: "10px 20px",
    borderRadius: 8,
    cursor: "pointer",
    marginBottom: 16,
    fontWeight: "bold" as const,
    fontSize: "15px",
  },
};
