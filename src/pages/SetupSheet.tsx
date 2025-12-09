// src/pages/SetupSheet.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../axios";
import toast from "react-hot-toast";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import AddRunForm from "../components/AddRunForm";
import RunTrendsChart from "../components/RunTrendsChart";
import { useCurrentInitials } from "../hooks/useCurrentInitials";

interface MoldHeader {
  moldID: number;
  baseNumber: string;
  customer?: string;
  partName?: string;
  fullBoxQuantity?: number;
  boxSize?: string;
  standardRate?: number;
  moldDimensions?: string;
  cavities?: number;
  color?: string;
}

interface ToolRun {
  id: number;
  runNumber: number;
  pressNumber: string;
  runDateTime: string;
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
  notes?: string;

  // Extended Press Parameters
  timeCool?: number;
  timeCharge?: number;
  timeCycle?: number;
  injectionVelocity1?: number;
  injectionVelocity2?: number;
  injectionVelocity3?: number;
  injectionVelocity4?: number;
  injectionVelocity5?: number;
  injectionVelocity6?: number;
  injectionPressure1?: number;
  injectionPressure2?: number;
  injectionPressure3?: number;
  holdPressure1?: number;
  holdPressure2?: number;
  holdPressure3?: number;
  backPressure1?: number;
  backPressure2?: number;
  backPressure3?: number;
  screwRPMInject1?: number;
  screwRPMInject2?: number;
  screwRPMInject3?: number;
  decompressionPosition?: number;
  decompressionSpeed?: number;
  vpChangeoverPosition?: number;
  vpChangeoverPressure?: number;
  monitorPosition?: number;
  screwPosition?: number;
  tempNozzle?: number;
  tempZone1?: number;
  tempZone2?: number;
  tempZone3?: number;
  tempZone4?: number;
  tempZone5?: number;
  chargeSize?: number;
  injectionStroke?: number;
  holdTime?: number;
  coolingTime?: number;
  moldOpenTime?: number;
  moldCloseTime?: number;
  ejectorForward?: number;
  ejectorReturn?: number;
  shotSize?: number;
  transferPosition?: number;
}

export default function SetupSheet() {
  const { id: productId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [header, setHeader] = useState<MoldHeader | null>(null);
  const [runs, setRuns] = useState<ToolRun[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const initials = useCurrentInitials();
  const showAddRun = searchParams.get("addRun") === "true";
  const workOrderId = searchParams.get("workOrderId");

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    if (!productId) return;
    try {
      setLoading(true);
      const [headerRes, runsRes] = await Promise.all([
        axios.get<MoldHeader>(`/api/products/${productId}/tool-runs/header`),
        axios.get<ToolRun[]>(`/api/products/${productId}/tool-runs`),
      ]);
      setHeader(headerRes.data);
      setRuns(runsRes.data);
    } catch (err) {
      toast.error("Failed to load setup sheet");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      setShowConfirmDialog(true);
    } else {
      navigate(`/products/${productId}`);
    }
  };

  const handleConfirmLeave = () => {
    setShowConfirmDialog(false);
    setIsDirty(false);
    navigate(`/products/${productId}`);
  };

  const handleCancelLeave = () => {
    setShowConfirmDialog(false);
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
          p: 0,
        }}
      >
        <CircularProgress sx={{ color: "#0f0" }} />
      </Box>
    );
  }

  const displayHeader: MoldHeader = header || {
    moldID: 0,
    baseNumber: "N/A",
    partName: "N/A",
    customer: "N/A",
    fullBoxQuantity: undefined,
    boxSize: undefined,
    standardRate: undefined,
    moldDimensions: undefined,
    cavities: undefined,
    color: undefined,
  };

  if (showAddRun) {
    return (
      <>
        <Box
          sx={{
            width: "100vw",
            position: "relative",
            left: "50%",
            right: "50%",
            ml: "-50vw",
            mr: "-50vw",
            bgcolor: "#000",
            minHeight: "100vh",
          }}
        >
          <Box
            sx={{
              p: 1,
              bgcolor: "transparent",
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <button onClick={() => navigate(-1)} style={styles.backBtn}>
              ← Back
            </button>
          </Box>
          <AddRunForm
            moldId={parseInt(productId!)}
            workOrderId={workOrderId ? parseInt(workOrderId) : undefined}
            onSuccess={() => {
              setIsDirty(false);
              navigate("/floor");
            }}
            onCancel={handleBack}
            onFormChange={() => setIsDirty(true)}
          />
        </Box>
        <Dialog open={showConfirmDialog} onClose={handleCancelLeave}>
          <DialogTitle sx={{ bgcolor: "#1a1a1a", color: "#0f0" }}>
            Unsaved Changes
          </DialogTitle>
          <DialogContent sx={{ bgcolor: "#1a1a1a", color: "#fff" }}>
            <DialogContentText sx={{ color: "#fff" }}>
              You have unsaved changes. Are you sure you want to leave?
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ bgcolor: "#1a1a1a" }}>
            <Button onClick={handleCancelLeave} sx={{ color: "#fff" }}>
              No, Stay
            </Button>
            <Button
              onClick={handleConfirmLeave}
              sx={{ color: "#f00", fontWeight: "bold" }}
            >
              Yes, Leave
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#000" }}>
      {/* Back button */}
      <Box
        sx={{
          p: 1,
          bgcolor: "transparent",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          ← Back
        </button>
      </Box>

      {/* Full-bleed content – overrides any Container */}
      <Box
        sx={{
          width: "100vw",
          position: "relative",
          left: "50%",
          right: "50%",
          ml: "-50vw",
          mr: "-50vw",
          px: 2,
          boxSizing: "border-box",
        }}
      >
        <Typography
          variant="h4"
          align="center"
          fontWeight="bold"
          sx={{ color: "#0f0", my: 3 }}
        >
          Setup Sheet — {displayHeader.partName ?? "N/A"} (Mold #
          {displayHeader.baseNumber})
        </Typography>

        <Box sx={{ px: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box>
              <Typography
                variant="h5"
                sx={{ color: "#0f0", fontWeight: "bold", mb: 1 }}
              >
                Run History
              </Typography>
              <Typography variant="body2" sx={{ color: "#aaa" }}>
                {runs.length} run{runs.length !== 1 ? "s" : ""} recorded
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => navigate("?addRun=true")}
              sx={{
                background: "#0f0",
                color: "#000",
                fontWeight: "bold",
                "&:hover": { background: "#0d0" },
              }}
            >
              + Add Run
            </Button>
          </Box>

          {runs.length > 0 && <RunTrendsChart runs={runs} />}

          {runs.length === 0 ? (
            <Paper
              elevation={3}
              sx={{ p: 6, bgcolor: "#1a1a1a", textAlign: "center" }}
            >
              <Typography color="#aaa">
                No runs recorded yet. Click "Add Run" to start.
              </Typography>
            </Paper>
          ) : (
            <TableContainer
              component={Paper}
              elevation={3}
              sx={{ bgcolor: "#1a1a1a" }}
            >
              <Table>
                <TableHead sx={{ bgcolor: "#000" }}>
                  <TableRow>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                      Run #
                    </TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                      Date/Time
                    </TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                      Press
                    </TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                      Operator
                    </TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                      Resin
                    </TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                      Cycle Time
                    </TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {runs.map((run) => (
                    <TableRow
                      key={run.id}
                      sx={{ "&:hover": { bgcolor: "#222" } }}
                    >
                      <TableCell sx={{ color: "#0f0", fontWeight: "bold" }}>
                        {run.runNumber}
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        {new Date(run.runDateTime).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        {run.pressNumber}
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        {run.operatorInitials}
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        {run.resin || "N/A"}
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        {run.timeOverallCycle ?? "N/A"}s
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() =>
                            navigate(
                              `/products/${productId}/tool-runs/${run.id}`,
                              { replace: false }
                            )
                          }
                          sx={{ color: "#0f0" }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>
    </Box>
  );
}

const styles = {
  backBtn: {
    background: "transparent",
    color: "#0f0",
    border: "1px solid #0f0",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    marginBottom: 16,
  },
};
