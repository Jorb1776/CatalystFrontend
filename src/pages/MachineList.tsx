import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../axios";
import toast from "react-hot-toast";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";

interface Machine {
  id: number;
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

export default function MachineList() {
  const navigate = useNavigate();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [filteredMachines, setFilteredMachines] = useState<Machine[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<Machine | null>(null);

  useEffect(() => {
    loadMachines();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMachines(machines);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMachines(
        machines.filter(
          (m) =>
            m.machineID.toLowerCase().includes(query) ||
            m.name.toLowerCase().includes(query) ||
            m.status.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, machines]);

  const loadMachines = async () => {
    try {
      setLoading(true);
      const res = await axios.get<Machine[]>("/api/machines");
      setMachines(res.data);
      setFilteredMachines(res.data);
    } catch (err) {
      toast.error("Failed to load machines");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (machine: Machine) => {
    setMachineToDelete(machine);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!machineToDelete) return;

    try {
      await axios.delete(`/api/machines/${machineToDelete.id}`);
      toast.success("Machine deleted successfully");
      loadMachines();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete machine");
    } finally {
      setDeleteDialogOpen(false);
      setMachineToDelete(null);
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <h1 style={{ color: "#0f0", margin: 0 }}>Machines</h1>
        <Button
          variant="contained"
          onClick={() => navigate("/machines/new")}
          sx={{
            background: "#0f0",
            color: "#000",
            fontWeight: "bold",
            "&:hover": { background: "#0d0" },
          }}
        >
          + Add Machine
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder="Search by Machine ID, Name, or Status..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{
          mb: 3,
          "& .MuiOutlinedInput-root": {
            color: "#fff",
            backgroundColor: "#111",
            "& fieldset": { borderColor: "#0f0" },
            "&:hover fieldset": { borderColor: "#0f0" },
            "&.Mui-focused fieldset": { borderColor: "#0f0" },
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "#0f0" }} />
            </InputAdornment>
          ),
        }}
      />

      <TableContainer component={Paper} sx={{ bgcolor: "#1a1a1a" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#000" }}>
            <TableRow>
              <TableCell sx={{ color: "#0f0", fontWeight: "bold" }}>
                Machine ID
              </TableCell>
              <TableCell sx={{ color: "#0f0", fontWeight: "bold" }}>
                Name
              </TableCell>
              <TableCell sx={{ color: "#0f0", fontWeight: "bold" }}>
                Clamping Force (TF)
              </TableCell>
              <TableCell sx={{ color: "#0f0", fontWeight: "bold" }}>
                Screw Ø (mm)
              </TableCell>
              <TableCell sx={{ color: "#0f0", fontWeight: "bold" }}>
                Injection Cap. (oz)
              </TableCell>
              <TableCell sx={{ color: "#0f0", fontWeight: "bold" }}>
                Status
              </TableCell>
              <TableCell sx={{ color: "#0f0", fontWeight: "bold" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMachines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: "center", color: "#888", py: 4 }}>
                  {searchQuery
                    ? "No machines found matching your search"
                    : "No machines yet. Click 'Add Machine' to create one."}
                </TableCell>
              </TableRow>
            ) : (
              filteredMachines.map((machine) => (
                <TableRow
                  key={machine.id}
                  sx={{
                    "&:hover": { bgcolor: "#222", cursor: "pointer" },
                  }}
                  onClick={() => navigate(`/machines/${machine.id}`)}
                >
                  <TableCell sx={{ color: "#0f0", fontWeight: "bold" }}>
                    {machine.machineID}
                  </TableCell>
                  <TableCell sx={{ color: "#fff" }}>{machine.name}</TableCell>
                  <TableCell sx={{ color: "#fff" }}>
                    {machine.clampingForceTF}
                  </TableCell>
                  <TableCell sx={{ color: "#fff" }}>
                    {machine.screwDiameterMM}
                  </TableCell>
                  <TableCell sx={{ color: "#fff" }}>
                    {machine.injectionCapacityOZ}
                  </TableCell>
                  <TableCell sx={{ color: "#fff" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 4,
                        background:
                          machine.status === "Available" ? "#0f04" : "#f004",
                        color: machine.status === "Available" ? "#0f0" : "#f00",
                      }}
                    >
                      {machine.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(machine);
                      }}
                      sx={{ color: "#f00" }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { bgcolor: "#1a1a1a", color: "#fff" } }}
      >
        <DialogTitle sx={{ color: "#f00" }}>Delete Machine</DialogTitle>
        <DialogContent>
          Are you sure you want to delete machine{" "}
          <strong>{machineToDelete?.machineID}</strong> - {machineToDelete?.name}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: "#fff" }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            sx={{ color: "#f00", fontWeight: "bold" }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
