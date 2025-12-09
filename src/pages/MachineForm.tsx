import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../axios";
import toast from "react-hot-toast";
import {
  Box,
  Button,
  TextField,
  Paper,
  CircularProgress,
  MenuItem,
} from "@mui/material";

interface MachineFormData {
  machineID: string;
  name: string;
  screwDiameterMM: number;
  injectionCapacityOZ: number;
  maxInjectionPressurePSI: number;
  clampingForceTF: number;
  clampingStrokeIN: number;
  minMoldThicknessIN: number;
  maxMoldThicknessIN: number;
  maxDaylightOpeningIN: number;
  tieBarClearanceLengthIN: number;
  tieBarClearanceWidthIN: number;
  diePlateDimensionLengthIN: number;
  diePlateDimensionWidthIN: number;
  ejectorStrokeIN: number;
  status: string;
  lastMaintenanceDate?: string;
}

export default function MachineForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = id !== "new";
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<MachineFormData>({
    machineID: "",
    name: "",
    screwDiameterMM: 0,
    injectionCapacityOZ: 0,
    maxInjectionPressurePSI: 0,
    clampingForceTF: 0,
    clampingStrokeIN: 0,
    minMoldThicknessIN: 0,
    maxMoldThicknessIN: 0,
    maxDaylightOpeningIN: 0,
    tieBarClearanceLengthIN: 0,
    tieBarClearanceWidthIN: 0,
    diePlateDimensionLengthIN: 0,
    diePlateDimensionWidthIN: 0,
    ejectorStrokeIN: 0,
    status: "Available",
  });

  useEffect(() => {
    if (isEditMode) {
      loadMachine();
    }
  }, [id]);

  const loadMachine = async () => {
    try {
      setLoading(true);
      const res = await axios.get<MachineFormData>(`/api/machines/${id}`);
      setFormData(res.data);
    } catch (err) {
      toast.error("Failed to load machine");
      navigate("/machines");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof MachineFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.machineID.trim() || !formData.name.trim()) {
      toast.error("Machine ID and Name are required");
      return;
    }

    try {
      setSaving(true);
      if (isEditMode) {
        await axios.put(`/api/machines/${id}`, {
          ...formData,
          id: parseInt(id!),
        });
        toast.success("Machine updated successfully");
      } else {
        await axios.post("/api/machines", formData);
        toast.success("Machine created successfully");
      }
      navigate("/machines");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save machine");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: "#000",
        }}
      >
        <CircularProgress sx={{ color: "#0f0" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: "#000", minHeight: "100vh" }}>
      <Box sx={{ mb: 3 }}>
        <Button
          onClick={() => navigate("/machines")}
          sx={{ color: "#0f0", mb: 2 }}
        >
          ← Back to Machines
        </Button>
        <h1 style={{ color: "#0f0", margin: 0 }}>
          {isEditMode ? "Edit Machine" : "Add New Machine"}
        </h1>
      </Box>

      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{ p: 3, bgcolor: "#1a1a1a", maxWidth: 900 }}
      >
        {/* Basic Info */}
        <h3 style={{ color: "#0f0", marginTop: 0 }}>Basic Information</h3>
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <TextField
            required
            label="Machine ID"
            value={formData.machineID}
            onChange={(e) => handleChange("machineID", e.target.value)}
            sx={{ ...inputStyle, flex: "1 1 45%" }}
            InputLabelProps={{ sx: { color: "#888" } }}
          />
          <TextField
            required
            label="Machine Name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            sx={{ ...inputStyle, flex: "1 1 45%" }}
            InputLabelProps={{ sx: { color: "#888" } }}
          />
          <TextField
            select
            label="Status"
            value={formData.status}
            onChange={(e) => handleChange("status", e.target.value)}
            sx={{ ...inputStyle, flex: "1 1 45%" }}
            InputLabelProps={{ sx: { color: "#888" } }}
          >
            <MenuItem value="Available">Available</MenuItem>
            <MenuItem value="Running">Running</MenuItem>
            <MenuItem value="Maintenance">Maintenance</MenuItem>
            <MenuItem value="Down">Down</MenuItem>
          </TextField>
          <TextField
            type="date"
            label="Last Maintenance Date"
            value={formData.lastMaintenanceDate || ""}
            onChange={(e) =>
              handleChange("lastMaintenanceDate", e.target.value)
            }
            sx={{ ...inputStyle, flex: "1 1 45%" }}
            InputLabelProps={{ shrink: true, sx: { color: "#888" } }}
          />
        </Box>

        {/* Injection Specs */}
        <h3 style={{ color: "#0f0", marginTop: 24 }}>
          Injection Specifications
        </h3>
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <TextField
            type="number"
            label="Screw Diameter (mm)"
            value={formData.screwDiameterMM}
            onChange={(e) =>
              handleChange("screwDiameterMM", parseFloat(e.target.value) || 0)
            }
            sx={{ ...inputStyle, flex: "1 1 30%" }}
            InputLabelProps={{ sx: { color: "#888" } }}
          />
          <TextField
            type="number"
            label="Injection Capacity (oz)"
            value={formData.injectionCapacityOZ}
            onChange={(e) =>
              handleChange(
                "injectionCapacityOZ",
                parseFloat(e.target.value) || 0
              )
            }
            sx={{ ...inputStyle, flex: "1 1 30%" }}
            InputLabelProps={{ sx: { color: "#888" } }}
          />
          <TextField
            type="number"
            label="Max Injection Pressure (PSI)"
            value={formData.maxInjectionPressurePSI}
            onChange={(e) =>
              handleChange(
                "maxInjectionPressurePSI",
                parseInt(e.target.value) || 0
              )
            }
            sx={{ ...inputStyle, flex: "1 1 30%" }}
            InputLabelProps={{ sx: { color: "#888" } }}
          />
        </Box>

        {/* Clamping Specs */}
        <h3 style={{ color: "#0f0", marginTop: 24 }}>
          Clamping Specifications
        </h3>
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <TextField
            type="number"
            label="Clamping Force (TF)"
            value={formData.clampingForceTF}
            onChange={(e) =>
              handleChange("clampingForceTF", parseInt(e.target.value) || 0)
            }
            sx={{ ...inputStyle, flex: "1 1 30%" }}
            InputLabelProps={{ sx: { color: "#888" } }}
          />
          <TextField
            type="number"
            label="Clamping Stroke (IN)"
            value={formData.clampingStrokeIN}
            onChange={(e) =>
              handleChange("clampingStrokeIN", parseFloat(e.target.value) || 0)
            }
            sx={{ ...inputStyle, flex: "1 1 30%" }}
            InputLabelProps={{ sx: { color: "#888" } }}
          />
          <TextField
            type="number"
            label="Ejector Stroke (IN)"
            value={formData.ejectorStrokeIN}
            onChange={(e) =>
              handleChange("ejectorStrokeIN", parseFloat(e.target.value) || 0)
            }
            sx={{ ...inputStyle, flex: "1 1 30%" }}
            InputLabelProps={{ sx: { color: "#888" } }}
          />
        </Box>

        {/* Mold Dimensions */}
        <h3 style={{ color: "#0f0", marginTop: 24 }}>
          Mold Dimensions (inches)
        </h3>
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <TextField
            type="number"
            label="Min Mold Thickness"
            value={formData.minMoldThicknessIN}
            onChange={(e) =>
              handleChange(
                "minMoldThicknessIN",
                parseFloat(e.target.value) || 0
              )
            }
            sx={{ ...inputStyle, flex: "1 1 45%" }}
            InputLabelProps={{ sx: { color: "#888" } }}
          />
          <TextField
            type="number"
            label="Max Mold Thickness"
            value={formData.maxMoldThicknessIN}
            onChange={(e) =>
              handleChange(
                "maxMoldThicknessIN",
                parseFloat(e.target.value) || 0
              )
            }
            sx={{ ...inputStyle, flex: "1 1 45%" }}
            InputLabelProps={{ sx: { color: "#888" } }}
          />
          <TextField
            type="number"
            label="Max Daylight Opening"
            value={formData.maxDaylightOpeningIN}
            onChange={(e) =>
              handleChange(
                "maxDaylightOpeningIN",
                parseFloat(e.target.value) || 0
              )
            }
            sx={{ ...inputStyle, flex: "1 1 45%" }}
            InputLabelProps={{ sx: { color: "#888" } }}
          />
          <TextField
            type="number"
            label="Tie Bar Clearance - Length"
            value={formData.tieBarClearanceLengthIN}
            onChange={(e) =>
              handleChange(
                "tieBarClearanceLengthIN",
                parseFloat(e.target.value) || 0
              )
            }
            sx={{ ...inputStyle, flex: "1 1 45%" }}
            InputLabelProps={{ sx: { color: "#888" } }}
          />
          <TextField
            type="number"
            label="Tie Bar Clearance - Width"
            value={formData.tieBarClearanceWidthIN}
            onChange={(e) =>
              handleChange(
                "tieBarClearanceWidthIN",
                parseFloat(e.target.value) || 0
              )
            }
            sx={{ ...inputStyle, flex: "1 1 45%" }}
            InputLabelProps={{ sx: { color: "#888" } }}
          />
          <TextField
            type="number"
            label="Die Plate Dimension - Length"
            value={formData.diePlateDimensionLengthIN}
            onChange={(e) =>
              handleChange(
                "diePlateDimensionLengthIN",
                parseFloat(e.target.value) || 0
              )
            }
            sx={{ ...inputStyle, flex: "1 1 45%" }}
            InputLabelProps={{ sx: { color: "#888" } }}
          />
          <TextField
            type="number"
            label="Die Plate Dimension - Width"
            value={formData.diePlateDimensionWidthIN}
            onChange={(e) =>
              handleChange(
                "diePlateDimensionWidthIN",
                parseFloat(e.target.value) || 0
              )
            }
            sx={{ ...inputStyle, flex: "1 1 45%" }}
            InputLabelProps={{ sx: { color: "#888" } }}
          />
        </Box>

        {/* Actions */}
        <Box
          sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 4 }}
        >
          <Button
            onClick={() => navigate("/machines")}
            disabled={saving}
            sx={{ color: "#fff", borderColor: "#fff" }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            variant="contained"
            sx={{
              background: "#0f0",
              color: "#000",
              fontWeight: "bold",
              "&:hover": { background: "#0d0" },
            }}
          >
            {saving
              ? "Saving..."
              : isEditMode
              ? "Update Machine"
              : "Create Machine"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

const inputStyle = {
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    backgroundColor: "#000",
    "& fieldset": { borderColor: "#333" },
    "&:hover fieldset": { borderColor: "#0f0" },
    "&.Mui-focused fieldset": { borderColor: "#0f0" },
  },
  "& .MuiInputBase-input": {
    color: "#fff",
  },
};
