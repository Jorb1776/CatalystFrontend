// src/pages/ToolRunDetails.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../axios";
import toast from "react-hot-toast";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
  CircularProgress,
  Button,
} from "@mui/material";

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

export default function ToolRunDetails() {
  const { id: productId, runId } = useParams<{ id: string; runId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState<ToolRun | null>(null);

  useEffect(() => {
    loadRun();
  }, [productId, runId]);

  const loadRun = async () => {
    if (!productId || !runId) return;
    try {
      setLoading(true);
      const res = await axios.get<ToolRun>(
        `/api/products/${productId}/tool-runs/${runId}`
      );
      setRun(res.data);
    } catch (err) {
      toast.error("Failed to load run details");
    } finally {
      setLoading(false);
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

  if (!run) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#000", p: 3 }}>
        <Typography variant="h5" sx={{ color: "#f00" }}>
          Run not found
        </Typography>
        <Button onClick={() => navigate(-1)} sx={{ color: "#0f0", mt: 2 }}>
          ← Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#000", p: 0 }}>
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

      <Box
        sx={{
          maxWidth: "100%",
          px: { xs: 1, sm: 2 },
          mx: "auto",
        }}
      >
        <Paper
          sx={{
            p: { xs: 2, sm: 4 },
            bgcolor: "#fff",
            color: "#000",
            border: "2px solid #000",
            maxWidth: 1200,
            mx: "auto",
            overflow: "hidden",
          }}
        >
          <Typography
            variant="h5"
            align="center"
            fontWeight="bold"
            gutterBottom
          >
            INJECTION MOLDING SETUP SHEET
          </Typography>
          <Typography
            variant="h6"
            align="center"
            sx={{ color: "#0f0", bgcolor: "#000", py: 1, mb: 3 }}
          >
            Run #{run.runNumber}
          </Typography>

          <Box sx={{ overflowX: "auto", mb: 4, width: "100%" }}>
            <Table
              sx={{ minWidth: 500, "& td": { border: "1px solid #000", p: 1 } }}
            >
              <TableBody>
                <TableRow>
                  <TableCell>
                    <strong>Press #</strong>
                  </TableCell>
                  <TableCell>{run.pressNumber}</TableCell>
                  <TableCell>
                    <strong>Date / Time</strong>
                  </TableCell>
                  <TableCell>
                    {new Date(run.runDateTime).toLocaleString()}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>Technician Initials</strong>
                  </TableCell>
                  <TableCell colSpan={3}>{run.operatorInitials}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>

          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Materials
          </Typography>
          <Box sx={{ overflowX: "auto", mb: 4, width: "100%" }}>
            <Table
              sx={{ minWidth: 500, "& td": { border: "1px solid #000", p: 1 } }}
            >
              <TableBody>
                <TableRow>
                  <TableCell>
                    <strong>Resin</strong>
                  </TableCell>
                  <TableCell>{run.resin || "N/A"}</TableCell>
                  <TableCell>
                    <strong>Colorant</strong>
                  </TableCell>
                  <TableCell>{run.colorant || "N/A"}</TableCell>
                  <TableCell>
                    <strong>Lot Number</strong>
                  </TableCell>
                  <TableCell>{run.lotNumber || "N/A"}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>

          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Temperatures (°F)
          </Typography>
          <Box sx={{ overflowX: "auto", mb: 4, width: "100%" }}>
            <Table
              sx={{ minWidth: 600, "& td": { border: "1px solid #000", p: 1 } }}
            >
              <TableBody>
                <TableRow>
                  {[
                    { label: "Zone 1", value: run.tempZone1 },
                    { label: "Zone 2", value: run.tempZone2 },
                    { label: "Zone 3", value: run.tempZone3 },
                    { label: "Zone 4", value: run.tempZone4 },
                    { label: "Zone 5", value: run.tempZone5 },
                  ]
                    .filter((item) => item.value != null)
                    .map((item, i) => (
                      <TableCell key={i}>
                        <strong>{item.label}</strong>
                        <br />
                        {item.value}
                      </TableCell>
                    ))}
                </TableRow>
                <TableRow>
                  {[
                    { label: "Nozzle", value: run.tempNozzle },
                    { label: "Front 1", value: run.tempFront1 },
                    { label: "Front 2", value: run.tempFront2 },
                    { label: "Middle", value: run.tempMiddle },
                    { label: "Rear 1", value: run.tempRear1 },
                    { label: "Rear 2", value: run.tempRear2 },
                    { label: "Feed", value: run.tempFeed },
                  ]
                    .filter((item) => item.value != null)
                    .map((item, i) => (
                      <TableCell key={i}>
                        <strong>{item.label}</strong>
                        <br />
                        {item.value}
                      </TableCell>
                    ))}
                </TableRow>
                <TableRow>
                  {[
                    { label: "Mold Live Half", value: run.tempMoldLiveHalf },
                    { label: "Mold Dead Half", value: run.tempMoldDeadHalf },
                  ]
                    .filter((item) => item.value != null)
                    .map((item, i) => (
                      <TableCell key={i}>
                        <strong>{item.label}</strong>
                        <br />
                        {item.value}
                      </TableCell>
                    ))}
                </TableRow>
              </TableBody>
            </Table>
          </Box>

          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Injection Velocities
          </Typography>
          <Box sx={{ overflowX: "auto", mb: 4, width: "100%" }}>
            <Table
              sx={{ minWidth: 500, "& td": { border: "1px solid #000", p: 1 } }}
            >
              <TableBody>
                <TableRow>
                  {[
                    { label: "V1", value: run.injectionVelocity1 },
                    { label: "V2", value: run.injectionVelocity2 },
                    { label: "V3", value: run.injectionVelocity3 },
                    { label: "V4", value: run.injectionVelocity4 },
                    { label: "V5", value: run.injectionVelocity5 },
                    { label: "V6", value: run.injectionVelocity6 },
                  ]
                    .filter((item) => item.value != null)
                    .map((item, i) => (
                      <TableCell key={i}>
                        <strong>{item.label}</strong>
                        <br />
                        {item.value}
                      </TableCell>
                    ))}
                </TableRow>
              </TableBody>
            </Table>
          </Box>

          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Pressures (PSI)
          </Typography>
          <Box sx={{ overflowX: "auto", mb: 4, width: "100%" }}>
            <Table
              sx={{ minWidth: 500, "& td": { border: "1px solid #000", p: 1 } }}
            >
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} sx={{ bgcolor: "#f0f0f0" }}>
                    <strong>Injection Pressures</strong>
                  </TableCell>
                </TableRow>
                <TableRow>
                  {[
                    { label: "Pv1", value: run.injectionPressure1 },
                    { label: "Pv2", value: run.injectionPressure2 },
                    { label: "Pv3", value: run.injectionPressure3 },
                  ]
                    .filter((item) => item.value != null)
                    .map((item, i) => (
                      <TableCell key={i}>
                        <strong>{item.label}</strong>
                        <br />
                        {item.value}
                      </TableCell>
                    ))}
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6} sx={{ bgcolor: "#f0f0f0" }}>
                    <strong>Hold Pressures</strong>
                  </TableCell>
                </TableRow>
                <TableRow>
                  {[
                    { label: "Pp1", value: run.holdPressure1 },
                    { label: "Pp2", value: run.holdPressure2 },
                    { label: "Pp3", value: run.holdPressure3 },
                  ]
                    .filter((item) => item.value != null)
                    .map((item, i) => (
                      <TableCell key={i}>
                        <strong>{item.label}</strong>
                        <br />
                        {item.value}
                      </TableCell>
                    ))}
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6} sx={{ bgcolor: "#f0f0f0" }}>
                    <strong>Back Pressures</strong>
                  </TableCell>
                </TableRow>
                <TableRow>
                  {[
                    { label: "BP1", value: run.backPressure1 },
                    { label: "BP2", value: run.backPressure2 },
                    { label: "BP3", value: run.backPressure3 },
                  ]
                    .filter((item) => item.value != null)
                    .map((item, i) => (
                      <TableCell key={i}>
                        <strong>{item.label}</strong>
                        <br />
                        {item.value}
                      </TableCell>
                    ))}
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6} sx={{ bgcolor: "#f0f0f0" }}>
                    <strong>Other Pressures</strong>
                  </TableCell>
                </TableRow>
                <TableRow>
                  {[
                    { label: "Clamping", value: run.pressureClamping },
                    {
                      label: "V-P Changeover",
                      value: run.vpChangeoverPressure,
                    },
                  ]
                    .filter((item) => item.value != null)
                    .map((item, i) => (
                      <TableCell key={i}>
                        <strong>{item.label}</strong>
                        <br />
                        {item.value}
                      </TableCell>
                    ))}
                </TableRow>
              </TableBody>
            </Table>
          </Box>

          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Times (seconds)
          </Typography>
          <Box sx={{ overflowX: "auto", mb: 4, width: "100%" }}>
            <Table
              sx={{ minWidth: 600, "& td": { border: "1px solid #000", p: 1 } }}
            >
              <TableBody>
                <TableRow>
                  {[
                    { label: "Inject", value: run.timeInject },
                    // { label: "Cool", value: run.timeCool },
                    { label: "Charge", value: run.timeCharge },
                    { label: "Cycle", value: run.timeCycle },
                    { label: "Hold", value: run.holdTime },
                    { label: "Cooling", value: run.coolingTime },
                  ]
                    .filter((item) => item.value != null)
                    .map((item, i) => (
                      <TableCell key={i}>
                        <strong>{item.label}</strong>
                        <br />
                        {item.value}
                      </TableCell>
                    ))}
                </TableRow>
                <TableRow>
                  {[
                    { label: "Mold Close", value: run.moldCloseTime },
                    { label: "Mold Open", value: run.moldOpenTime },
                    { label: "Overall Cycle", value: run.timeOverallCycle },
                  ]
                    .filter((item) => item.value != null)
                    .map((item, i) => (
                      <TableCell key={i}>
                        <strong>{item.label}</strong>
                        <br />
                        {item.value}
                      </TableCell>
                    ))}
                </TableRow>
              </TableBody>
            </Table>
          </Box>

          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Screw Parameters
          </Typography>
          <Box sx={{ overflowX: "auto", mb: 4, width: "100%" }}>
            <Table
              sx={{ minWidth: 500, "& td": { border: "1px solid #000", p: 1 } }}
            >
              <TableBody>
                <TableRow>
                  {[
                    { label: "Screw RPM", value: run.screwRPM },
                    { label: "VS1", value: run.screwRPMInject1 },
                    { label: "VS2", value: run.screwRPMInject2 },
                    { label: "VS3", value: run.screwRPMInject3 },
                  ]
                    .filter((item) => item.value != null)
                    .map((item, i) => (
                      <TableCell key={i}>
                        <strong>{item.label}</strong>
                        <br />
                        {item.value}
                      </TableCell>
                    ))}
                </TableRow>
                <TableRow>
                  {[
                    { label: "Screw Position", value: run.screwPosition },
                    { label: "Decomp Pos", value: run.decompressionPosition },
                    { label: "Decomp Speed", value: run.decompressionSpeed },
                  ]
                    .filter((item) => item.value != null)
                    .map((item, i) => (
                      <TableCell key={i}>
                        <strong>{item.label}</strong>
                        <br />
                        {item.value}
                      </TableCell>
                    ))}
                </TableRow>
              </TableBody>
            </Table>
          </Box>

          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Positions & Sizes
          </Typography>
          <Box sx={{ overflowX: "auto", mb: 4, width: "100%" }}>
            <Table
              sx={{ minWidth: 500, "& td": { border: "1px solid #000", p: 1 } }}
            >
              <TableBody>
                <TableRow>
                  {[
                    { label: "Cushion", value: run.cushion },
                    { label: "Monitor Position", value: run.monitorPosition },
                    {
                      label: "V-P Changeover Pos",
                      value: run.vpChangeoverPosition,
                    },
                    { label: "Transfer Position", value: run.transferPosition },
                  ]
                    .filter((item) => item.value != null)
                    .map((item, i) => (
                      <TableCell key={i}>
                        <strong>{item.label}</strong>
                        <br />
                        {item.value}
                      </TableCell>
                    ))}
                </TableRow>
                <TableRow>
                  {[
                    { label: "Charge Size", value: run.chargeSize },
                    { label: "Shot Size", value: run.shotSize },
                    { label: "Injection Stroke", value: run.injectionStroke },
                  ]
                    .filter((item) => item.value != null)
                    .map((item, i) => (
                      <TableCell key={i}>
                        <strong>{item.label}</strong>
                        <br />
                        {item.value}
                      </TableCell>
                    ))}
                </TableRow>
              </TableBody>
            </Table>
          </Box>

          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Weights & Other
          </Typography>
          <Box sx={{ overflowX: "auto", mb: 4, width: "100%" }}>
            <Table
              sx={{ minWidth: 500, "& td": { border: "1px solid #000", p: 1 } }}
            >
              <TableBody>
                <TableRow>
                  {[
                    { label: "Full Shot Wt (g)", value: run.fullShotWeight },
                    { label: "Part Wt (g)", value: run.partOnlyWeight },
                    { label: "Injection Speed", value: run.injectionSpeed },
                  ]
                    .filter((item) => item.value != null)
                    .map((item, i) => (
                      <TableCell key={i}>
                        <strong>{item.label}</strong>
                        <br />
                        {item.value}
                      </TableCell>
                    ))}
                </TableRow>
                <TableRow>
                  {[
                    { label: "Ejector Forward", value: run.ejectorForward },
                    { label: "Ejector Return", value: run.ejectorReturn },
                  ]
                    .filter((item) => item.value != null)
                    .map((item, i) => (
                      <TableCell key={i}>
                        <strong>{item.label}</strong>
                        <br />
                        {item.value}
                      </TableCell>
                    ))}
                </TableRow>
              </TableBody>
            </Table>
          </Box>

          {run.notes && (
            <>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Notes
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: "#f5f5f5",
                  border: "1px solid #ccc",
                  mb: 3,
                }}
              >
                <Typography sx={{ whiteSpace: "pre-wrap" }}>
                  {run.notes}
                </Typography>
              </Paper>
            </>
          )}
        </Paper>
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
