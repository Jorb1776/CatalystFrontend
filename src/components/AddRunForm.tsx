// src/components/AddRunForm.tsx
import { useState, useEffect } from "react";
import axios from "../axios";
import toast from "react-hot-toast";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Container,
} from "@mui/material";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useCurrentInitials } from "../hooks/useCurrentInitials";

interface AddRunFormProps {
  moldId: number;
  workOrderId?: number;
  onSuccess: () => void;
  onCancel?: () => void;
  onFormChange?: () => void;
}

interface RunFormData {
  pressNumber: string;
  runDateTime: string;
  operatorInitials: string;
  resin: string;
  colorant: string;
  lotNumber: string;
  tempFeed: string;
  tempRear1: string;
  tempRear2: string;
  tempMiddle: string;
  tempFront1: string;
  tempFront2: string;
  tempMoldLiveHalf: string;
  tempMoldDeadHalf: string;
  pressure1stStage: string;
  pressure2ndStage: string;
  pressureBack: string;
  pressureClamping: string;
  timeInject: string;
  time2ndStage: string;
  timeMoldClose: string;
  timeMoldOpen: string;
  timeOverallCycle: string;
  injectionSpeed: string;
  packHoldTime: string;
  cushion: string;
  screwRPM: string;
  fullShotWeight: string;
  partOnlyWeight: string;
  notes: string;
}

interface ToolRun {
  pressNumber: string;
  operatorInitials: string;
  resin?: string;
  colorant?: string;
  lotNumber?: string;
  tempFeed?: number;
  tempRear1?: number;
  tempRear2?: number;
  tempMiddle?: number;
  tempFront1?: number;
  tempFront2?: number;
  tempMoldLiveHalf?: number;
  tempMoldDeadHalf?: number;
  pressure1stStage?: number;
  pressure2ndStage?: number;
  pressureBack?: number;
  pressureClamping?: number;
  timeInject?: number;
  time2ndStage?: number;
  timeMoldClose?: number;
  timeMoldOpen?: number;
  timeOverallCycle?: number;
  injectionSpeed?: number;
  packHoldTime?: number;
  cushion?: number;
  screwRPM?: number;
  fullShotWeight?: number;
  partOnlyWeight?: number;
}

interface Product {
  material?: { name: string };
  colorant?: { name: string };
}

export default function AddRunForm({
  moldId,
  workOrderId,
  onSuccess,
  onCancel,
  onFormChange,
}: AddRunFormProps) {
  const initials = useCurrentInitials();
  const username = useCurrentUser();

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [formData, setFormData] = useState<RunFormData>({
    pressNumber: "",
    runDateTime: new Date().toISOString().slice(0, 16),
    operatorInitials: "",
    resin: "",
    colorant: "",
    lotNumber: "",
    tempFeed: "",
    tempRear1: "",
    tempRear2: "",
    tempMiddle: "",
    tempFront1: "",
    tempFront2: "",
    tempMoldLiveHalf: "",
    tempMoldDeadHalf: "",
    pressure1stStage: "",
    pressure2ndStage: "",
    pressureBack: "",
    pressureClamping: "",
    timeInject: "",
    time2ndStage: "",
    timeMoldClose: "",
    timeMoldOpen: "",
    timeOverallCycle: "",
    injectionSpeed: "",
    packHoldTime: "",
    cushion: "",
    screwRPM: "",
    fullShotWeight: "",
    partOnlyWeight: "",
    notes: "",
  });

  useEffect(() => {
    const loadPrefillData = async () => {
      try {
        setInitializing(true);
        const productRes = await axios.get<Product>(`/api/products/${moldId}`);
        const product = productRes.data;
        const runsRes = await axios.get<ToolRun[]>(
          `/api/products/${moldId}/tool-runs`
        );
        const lastRun = runsRes.data.length > 0 ? runsRes.data[0] : null;

        setFormData((prev) => ({
          ...prev,
          pressNumber: lastRun?.pressNumber || "",
          runDateTime: new Date().toISOString().slice(0, 16),
          resin: lastRun?.resin || product.material?.name || "",
          colorant: lastRun?.colorant || product.colorant?.name || "",
          lotNumber: lastRun?.lotNumber || "",
          tempFeed: lastRun?.tempFeed?.toString() || "",
          tempRear1: lastRun?.tempRear1?.toString() || "",
          tempRear2: lastRun?.tempRear2?.toString() || "",
          tempMiddle: lastRun?.tempMiddle?.toString() || "",
          tempFront1: lastRun?.tempFront1?.toString() || "",
          tempFront2: lastRun?.tempFront2?.toString() || "",
          tempMoldLiveHalf: lastRun?.tempMoldLiveHalf?.toString() || "",
          tempMoldDeadHalf: lastRun?.tempMoldDeadHalf?.toString() || "",
          pressure1stStage: lastRun?.pressure1stStage?.toString() || "",
          pressure2ndStage: lastRun?.pressure2ndStage?.toString() || "",
          pressureBack: lastRun?.pressureBack?.toString() || "",
          pressureClamping: lastRun?.pressureClamping?.toString() || "",
          timeInject: lastRun?.timeInject?.toString() || "",
          time2ndStage: lastRun?.time2ndStage?.toString() || "",
          timeMoldClose: lastRun?.timeMoldClose?.toString() || "",
          timeMoldOpen: lastRun?.timeMoldOpen?.toString() || "",
          timeOverallCycle: lastRun?.timeOverallCycle?.toString() || "",
          injectionSpeed: lastRun?.injectionSpeed?.toString() || "",
          packHoldTime: lastRun?.packHoldTime?.toString() || "",
          cushion: lastRun?.cushion?.toString() || "",
          screwRPM: lastRun?.screwRPM?.toString() || "",
          fullShotWeight: lastRun?.fullShotWeight?.toString() || "",
          partOnlyWeight: lastRun?.partOnlyWeight?.toString() || "",
          notes: "",
        }));
      } catch (err) {
        console.error("Prefill failed:", err);
      } finally {
        setInitializing(false);
      }
    };
    loadPrefillData();
  }, [moldId]);

  useEffect(() => {
    if (initials) {
      setFormData((prev) => ({ ...prev, operatorInitials: initials }));
    }
  }, [initials]);

  const handleChange =
    (field: keyof RunFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
      onFormChange?.();
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pressNumber.trim() || !formData.operatorInitials.trim()) {
      toast.error("Press # and Operator Initials required");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        pressNumber: formData.pressNumber,
        runDateTime: new Date(formData.runDateTime).toISOString(),
        operatorInitials: formData.operatorInitials,
        resin: formData.resin || null,
        colorant: formData.colorant || null,
        lotNumber: formData.lotNumber || null,
        tempFeed: formData.tempFeed ? parseFloat(formData.tempFeed) : null,
        tempRear1: formData.tempRear1 ? parseFloat(formData.tempRear1) : null,
        tempRear2: formData.tempRear2 ? parseFloat(formData.tempRear2) : null,
        tempMiddle: formData.tempMiddle
          ? parseFloat(formData.tempMiddle)
          : null,
        tempFront1: formData.tempFront1
          ? parseFloat(formData.tempFront1)
          : null,
        tempFront2: formData.tempFront2
          ? parseFloat(formData.tempFront2)
          : null,
        tempMoldLiveHalf: formData.tempMoldLiveHalf
          ? parseFloat(formData.tempMoldLiveHalf)
          : null,
        tempMoldDeadHalf: formData.tempMoldDeadHalf
          ? parseFloat(formData.tempMoldDeadHalf)
          : null,
        pressure1stStage: formData.pressure1stStage
          ? parseFloat(formData.pressure1stStage)
          : null,
        pressure2ndStage: formData.pressure2ndStage
          ? parseFloat(formData.pressure2ndStage)
          : null,
        pressureBack: formData.pressureBack
          ? parseFloat(formData.pressureBack)
          : null,
        pressureClamping: formData.pressureClamping
          ? parseFloat(formData.pressureClamping)
          : null,
        timeInject: formData.timeInject
          ? parseFloat(formData.timeInject)
          : null,
        time2ndStage: formData.time2ndStage
          ? parseFloat(formData.time2ndStage)
          : null,
        timeMoldClose: formData.timeMoldClose
          ? parseFloat(formData.timeMoldClose)
          : null,
        timeMoldOpen: formData.timeMoldOpen
          ? parseFloat(formData.timeMoldOpen)
          : null,
        timeOverallCycle: formData.timeOverallCycle
          ? parseFloat(formData.timeOverallCycle)
          : null,
        injectionSpeed: formData.injectionSpeed
          ? parseFloat(formData.injectionSpeed)
          : null,
        packHoldTime: formData.packHoldTime
          ? parseFloat(formData.packHoldTime)
          : null,
        cushion: formData.cushion ? parseFloat(formData.cushion) : null,
        screwRPM: formData.screwRPM ? parseFloat(formData.screwRPM) : null,
        fullShotWeight: formData.fullShotWeight
          ? parseFloat(formData.fullShotWeight)
          : null,
        partOnlyWeight: formData.partOnlyWeight
          ? parseFloat(formData.partOnlyWeight)
          : null,
        notes: formData.notes || null,
      };
      await axios.post(`/api/products/${moldId}/tool-runs`, payload);

      // If this run is associated with a work order, start it
      if (workOrderId) {
        try {
          await axios.post(`/api/workorder/${workOrderId}/start`);
          toast.success("Run saved & work order started");
        } catch (err) {
          toast.success("Run saved (but failed to start work order)");
          console.error("Failed to start work order:", err);
        }
      } else {
        toast.success("Run saved");
      }

      onSuccess();
    } catch (err) {
      toast.error("Save failed");
    } finally {
      setLoading(false);
    }
  };

  if (initializing)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 8 }}>
        <CircularProgress sx={{ color: "#0f0" }} />
      </Box>
    );

  return (
    <Container maxWidth="lg" sx={{ py: 3, px: 0 }}>
      <Paper
        sx={{
          p: { xs: 2, sm: 4 },
          bgcolor: "#fff",
          color: "#000",
          border: "2px solid #000",
        }}
      >
        <Typography variant="h5" align="center" fontWeight="bold" gutterBottom>
          INJECTION MOLDING SETUP SHEET
        </Typography>

        <Box sx={{ overflowX: "auto", mb: 4 }}>
          <Table
            sx={{ minWidth: 700, "& td": { border: "1px solid #000", p: 1 } }}
          >
            <TableBody>
              <TableRow>
                <TableCell>
                  <strong>Press # (required)</strong>
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    value={formData.pressNumber}
                    onChange={handleChange("pressNumber")}
                  />
                </TableCell>
                <TableCell>
                  <strong>Date / Time</strong>
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    type="datetime-local"
                    InputLabelProps={{ shrink: true }}
                    value={formData.runDateTime}
                    onChange={handleChange("runDateTime")}
                  />
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>
                  <strong>Technician Initials</strong>
                </TableCell>
                <TableCell colSpan={3}>
                  <TextField
                    fullWidth
                    size="small"
                    value={formData.operatorInitials}
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{
                      "& .MuiInputBase-input": {
                        backgroundColor: "#333",
                        opacity: 0.8,
                        color: "#fff",
                      },
                    }}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Materials
        </Typography>
        <Box sx={{ overflowX: "auto", mb: 4 }}>
          <Table
            sx={{ minWidth: 700, "& td": { border: "1px solid #000", p: 1 } }}
          >
            <TableBody>
              <TableRow>
                <TableCell>
                  <strong>Resin</strong>
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    value={formData.resin}
                    onChange={handleChange("resin")}
                  />
                </TableCell>
                <TableCell>
                  <strong>Colorant</strong>
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    value={formData.colorant}
                    onChange={handleChange("colorant")}
                  />
                </TableCell>
                <TableCell>
                  <strong>Lot Number</strong>
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    value={formData.lotNumber}
                    onChange={handleChange("lotNumber")}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Temperatures (°F)
        </Typography>
        <Box sx={{ overflowX: "auto", mb: 4 }}>
          <Table
            sx={{ minWidth: 900, "& td": { border: "1px solid #000", p: 1 } }}
          >
            <TableBody>
              <TableRow>
                {[
                  "Feed",
                  "Rear 1",
                  "Rear 2",
                  "Middle",
                  "Front 1",
                  "Front 2",
                  "Mold Live Half",
                  "Mold Dead Half",
                ].map((label, i) => {
                  const fields = [
                    "tempFeed",
                    "tempRear1",
                    "tempRear2",
                    "tempMiddle",
                    "tempFront1",
                    "tempFront2",
                    "tempMoldLiveHalf",
                    "tempMoldDeadHalf",
                  ];
                  return (
                    <TableCell key={i}>
                      <strong>{label}</strong>
                      <br />
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={formData[fields[i] as keyof RunFormData]}
                        onChange={handleChange(fields[i] as keyof RunFormData)}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Pressures (PSI)
        </Typography>
        <Box sx={{ overflowX: "auto", mb: 4 }}>
          <Table
            sx={{ minWidth: 700, "& td": { border: "1px solid #000", p: 1 } }}
          >
            <TableBody>
              <TableRow>
                {[
                  { f: "pressure1stStage", l: "1st Stage" },
                  { f: "pressure2ndStage", l: "2nd Stage" },
                  { f: "pressureBack", l: "Back" },
                  { f: "pressureClamping", l: "Clamping" },
                ].map((o) => (
                  <TableCell key={o.f}>
                    <strong>{o.l}</strong>
                    <br />
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={formData[o.f as keyof RunFormData]}
                      onChange={handleChange(o.f as keyof RunFormData)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Times (sec) & Speeds
        </Typography>
        <Box sx={{ overflowX: "auto", mb: 4 }}>
          <Table
            sx={{ minWidth: 900, "& td": { border: "1px solid #000", p: 1 } }}
          >
            <TableBody>
              <TableRow>
                {[
                  { f: "timeInject", l: "Inject" },
                  { f: "time2ndStage", l: "2nd Stage" },
                  { f: "packHoldTime", l: "Pack/Hold" },
                  { f: "timeMoldClose", l: "Mold Close" },
                  { f: "timeMoldOpen", l: "Mold Open" },
                  { f: "timeOverallCycle", l: "Overall Cycle" },
                  { f: "injectionSpeed", l: "Inj Speed" },
                ].map((o) => (
                  <TableCell key={o.f}>
                    <strong>{o.l}</strong>
                    <br />
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={formData[o.f as keyof RunFormData]}
                      onChange={handleChange(o.f as keyof RunFormData)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Other Parameters
        </Typography>
        <Box sx={{ overflowX: "auto", mb: 4 }}>
          <Table
            sx={{ minWidth: 700, "& td": { border: "1px solid #000", p: 1 } }}
          >
            <TableBody>
              <TableRow>
                {[
                  { f: "cushion", l: "Cushion" },
                  { f: "screwRPM", l: "Screw RPM" },
                  { f: "fullShotWeight", l: "Full Shot Wt (g)" },
                  { f: "partOnlyWeight", l: "Part Wt (g)" },
                ].map((o) => (
                  <TableCell key={o.f}>
                    <strong>{o.l}</strong>
                    <br />
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={formData[o.f as keyof RunFormData]}
                      onChange={handleChange(o.f as keyof RunFormData)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Notes
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={formData.notes}
          onChange={handleChange("notes")}
          sx={{ mb: 3 }}
        />

        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {onCancel && (
            <Button variant="outlined" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Save Run"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
