import { useState, useEffect, useMemo } from "react";
import axios from "../axios";
import toast from "react-hot-toast";
import { useAuth, useLocation } from "../context/AuthContext";

interface StartWithPressDataModalProps {
  workOrderId: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface Machine {
  id: number;
  machineID: string;
  name: string;
  status: string;
}

interface PressData {
  message: string;
  csvFile: string | null;
  toolRunId: number | null;
  runNumber: number;
  parsedData: any;
  rawValues: Record<string, string>;
  hasPressData: boolean;
  productInfo: {
    resinName?: string;
    colorantName?: string;
    colorantCode?: string;
  };
}

interface NoDataResponse {
  message: string;
  canSkip: boolean;
  moldNumber: string;
  pressNumber: string;
}

export const StartWithPressDataModal = ({
  workOrderId,
  onClose,
  onSuccess,
}: StartWithPressDataModalProps) => {
  const { user } = useAuth();
  const { location: currentLocation } = useLocation();

  // Use stored initials, or derive from username, or fallback to OPR
  const defaultInitials =
    user?.initials && user.initials.trim()
      ? user.initials.trim().toUpperCase()
      : "OPR";

  const [pressNumber, setPressNumber] = useState("");
  const [operatorInitials, setOperatorInitials] = useState(defaultInitials);
  const [lotNumber, setLotNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(true);
  const [noDataFound, setNoDataFound] = useState<NoDataResponse | null>(null);

  // Natural sort for machine IDs like "IN-1", "IN-2", "IN-10"
  const naturalSort = (a: Machine, b: Machine) => {
    const regex = /(\D*)(\d*)/g;
    const aParts = a.machineID.match(regex) || [];
    const bParts = b.machineID.match(regex) || [];

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || '';
      const bPart = bParts[i] || '';

      const aNum = parseInt(aPart, 10);
      const bNum = parseInt(bPart, 10);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        if (aNum !== bNum) return aNum - bNum;
      } else {
        if (aPart !== bPart) return aPart.localeCompare(bPart);
      }
    }
    return 0;
  };

  // Load machines on mount
  useEffect(() => {
    const loadMachines = async () => {
      try {
        const res = await axios.get<Machine[]>("/api/machines");
        // Sort machines naturally by machineID (IN-1, IN-2, IN-10, etc.)
        const sorted = [...res.data].sort(naturalSort);
        setMachines(sorted);
      } catch (err) {
        console.error("Failed to load machines:", err);
        toast.error("Failed to load machines");
      } finally {
        setLoadingMachines(false);
      }
    };
    loadMachines();
  }, []);

  // Filter machines by current location
  const filteredMachines = useMemo(() => {
    if (!currentLocation || currentLocation === 'All') {
      return machines;
    }
    // Filter machines where machineID starts with the location code (e.g., "IN-" or "TN-")
    return machines.filter(m =>
      m.machineID.toUpperCase().startsWith(currentLocation.toUpperCase() + '-') ||
      m.machineID.toUpperCase().startsWith(currentLocation.toUpperCase())
    );
  }, [machines, currentLocation]);

  // Update operatorInitials when defaultInitials changes (after localStorage loads)
  useEffect(() => {
    setOperatorInitials(defaultInitials);
  }, [defaultInitials]);

  const handleStart = async (skipPressData = false) => {
    if (!pressNumber.trim()) {
      toast.error("Press number is required");
      return;
    }

    setLoading(true);
    setError(null);
    setNoDataFound(null);

    const requestData = {
      pressNumber: pressNumber.trim(),
      operatorInitials: operatorInitials.trim() || defaultInitials,
      lotNumber: lotNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      skipPressData,
    };

    try {
      const response = await axios.post<PressData>(
        `/api/workorder/${workOrderId}/start-with-press-data`,
        requestData
      );

      toast.success(response.data.hasPressData
        ? "Work order started with press data!"
        : "Work order started!");

      // If no press data, close immediately. Otherwise show preview briefly.
      if (response.data.hasPressData) {
        setPreviewData(response.data);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      // Check if this is a "no press data found" response with canSkip option
      if (err.response?.status === 404 && err.response?.data?.canSkip) {
        setNoDataFound(err.response.data as NoDataResponse);
        setLoading(false);
        return;
      }

      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to start work order";
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  };

  const renderParameterGroup = (title: string, params: [string, any][]) => {
    const validParams = params.filter(([_, value]) => value != null);
    if (validParams.length === 0) return null;

    return (
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: "0.85rem",
            fontWeight: "bold",
            color: "#0f0",
            marginBottom: 8,
            borderBottom: "1px solid #333",
            paddingBottom: 4,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 8,
            fontSize: "0.75rem",
          }}
        >
          {validParams.map(([label, value]) => (
            <div
              key={label}
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <span style={{ color: "#888" }}>{label}:</span>
              <span style={{ color: "#fff", fontWeight: "500" }}>
                {typeof value === "number" ? value.toFixed(2) : value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    if (!previewData) return null;

    const data = previewData.parsedData;

    // If no press data, show a simple success message instead of the parameter preview
    if (!previewData.hasPressData || !data) {
      return (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            background: "#1a1a1a",
            borderRadius: 8,
            border: "1px solid #0f0",
          }}
        >
          <div
            style={{
              fontSize: "0.9rem",
              fontWeight: "bold",
              color: "#0f0",
              marginBottom: 8,
            }}
          >
            Work Order Started
          </div>
          <div style={{ fontSize: "0.85rem", color: "#888" }}>
            No press data was imported. The work order is now active.
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          marginTop: 16,
          padding: 16,
          background: "#1a1a1a",
          borderRadius: 8,
          border: "1px solid #0f0",
          maxHeight: "50vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            fontSize: "0.9rem",
            fontWeight: "bold",
            color: "#0f0",
            marginBottom: 12,
          }}
        >
          Imported Press Data
        </div>
        <div style={{ fontSize: "0.7rem", color: "#888", marginBottom: 12 }}>
          Source: {previewData.csvFile}
        </div>

        {renderParameterGroup("Temperatures", [
          ["Nozzle", data.tempNozzle],
          ["Zone 1", data.tempZone1],
          ["Zone 2", data.tempZone2],
          ["Zone 3", data.tempZone3],
          ["Zone 4", data.tempZone4],
          ["Zone 5", data.tempZone5],
          ["Feed", data.tempFeed],
          ["Rear 1", data.tempRear1],
          ["Rear 2", data.tempRear2],
          ["Middle", data.tempMiddle],
          ["Front 1", data.tempFront1],
          ["Front 2", data.tempFront2],
          ["Mold Live", data.tempMoldLiveHalf],
          ["Mold Dead", data.tempMoldDeadHalf],
        ])}

        {renderParameterGroup("Injection Velocities", [
          ["V1", data.injectionVelocity1],
          ["V2", data.injectionVelocity2],
          ["V3", data.injectionVelocity3],
          ["V4", data.injectionVelocity4],
          ["V5", data.injectionVelocity5],
          ["V6", data.injectionVelocity6],
        ])}

        {renderParameterGroup("Pressures", [
          ["Injection P1", data.injectionPressure1],
          ["Injection P2", data.injectionPressure2],
          ["Injection P3", data.injectionPressure3],
          ["Hold P1", data.holdPressure1],
          ["Hold P2", data.holdPressure2],
          ["Hold P3", data.holdPressure3],
          ["Back P1", data.backPressure1],
          ["Back P2", data.backPressure2],
          ["Back P3", data.backPressure3],
          ["Clamping", data.pressureClamping],
        ])}

        {renderParameterGroup("Times", [
          ["Inject", data.timeInject],
          ["Cool", data.timeCool],
          ["Charge", data.timeCharge],
          ["Cycle", data.timeCycle],
          ["Hold", data.holdTime],
          ["Cooling", data.coolingTime],
          ["Mold Open", data.moldOpenTime],
          ["Mold Close", data.moldCloseTime],
        ])}

        {renderParameterGroup("Screw & Transfer", [
          ["Screw RPM", data.screwRPM],
          ["Screw RPM 1", data.screwRPMInject1],
          ["Screw RPM 2", data.screwRPMInject2],
          ["Screw RPM 3", data.screwRPMInject3],
          ["V-P Position", data.vpChangeoverPosition],
          ["V-P Pressure", data.vpChangeoverPressure],
          ["Transfer Pos", data.transferPosition],
        ])}

        {renderParameterGroup("Positions & Sizes", [
          ["Cushion", data.cushion],
          ["Monitor Pos", data.monitorPosition],
          ["Screw Pos", data.screwPosition],
          ["Charge Size", data.chargeSize],
          ["Shot Size", data.shotSize],
          ["Injection Stroke", data.injectionStroke],
          ["Decomp Pos", data.decompressionPosition],
          ["Decomp Speed", data.decompressionSpeed],
        ])}

        {renderParameterGroup("Ejector", [
          ["Forward", data.ejectorForward],
          ["Return", data.ejectorReturn],
        ])}
      </div>
    );
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111",
          border: "2px solid #0f0",
          borderRadius: 12,
          padding: 24,
          maxWidth: 800,
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
          color: "#fff",
        }}
      >
        <div
          style={{
            fontSize: "1.2rem",
            fontWeight: "bold",
            color: "#0f0",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Start Work Order with Press Data</span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#0f0",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: 0,
              width: 32,
              height: 32,
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: 12,
              background: "#ff000020",
              border: "1px solid #ff0000",
              borderRadius: 6,
              color: "#ff6666",
              marginBottom: 16,
              fontSize: "0.85rem",
            }}
          >
            {error}
          </div>
        )}

        {!previewData && !noDataFound && (
          <>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    color: "#888",
                    marginBottom: 6,
                  }}
                >
                  Machine *
                </label>
                <select
                  value={pressNumber}
                  onChange={(e) => setPressNumber(e.target.value)}
                  autoFocus
                  disabled={loadingMachines}
                  style={{
                    width: "100%",
                    padding: 10,
                    background: "#000",
                    border: "1px solid #0f0",
                    borderRadius: 6,
                    color: "#fff",
                    fontSize: "0.9rem",
                    cursor: loadingMachines ? "wait" : "pointer",
                  }}
                >
                  <option value="" style={{ background: "#000", color: "#888" }}>
                    {loadingMachines ? "Loading machines..." : `Select a machine${currentLocation && currentLocation !== 'All' ? ` (${currentLocation})` : ''}`}
                  </option>
                  {filteredMachines.map((machine) => (
                    <option
                      key={machine.id}
                      value={machine.machineID}
                      style={{ background: "#000", color: "#fff" }}
                    >
                      {machine.machineID} - {machine.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    color: "#888",
                    marginBottom: 6,
                  }}
                >
                  Operator Initials
                </label>
                <input
                  type="text"
                  value={operatorInitials}
                  onChange={(e) =>
                    setOperatorInitials(e.target.value.toUpperCase())
                  }
                  placeholder="Initials"
                  maxLength={3}
                  style={{
                    width: "100%",
                    padding: 10,
                    background: "#000",
                    border: "1px solid #333",
                    borderRadius: 6,
                    color: "#fff",
                    fontSize: "0.9rem",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  color: "#888",
                  marginBottom: 6,
                }}
              >
                Lot Number
              </label>
              <input
                type="text"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="Enter lot number"
                style={{
                  width: "100%",
                  padding: 10,
                  background: "#000",
                  border: "1px solid #333",
                  borderRadius: 6,
                  color: "#fff",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  color: "#888",
                  marginBottom: 6,
                }}
              >
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes..."
                rows={3}
                style={{
                  width: "100%",
                  padding: 10,
                  background: "#000",
                  border: "1px solid #333",
                  borderRadius: 6,
                  color: "#fff",
                  fontSize: "0.85rem",
                  resize: "vertical",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
                marginTop: 20,
              }}
            >
              <button
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  background: "#333",
                  border: "1px solid #555",
                  borderRadius: 6,
                  color: "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleStart(false)}
                disabled={loading || !pressNumber.trim()}
                style={{
                  padding: "10px 20px",
                  background: "#0f0",
                  border: "none",
                  borderRadius: 6,
                  color: "#000",
                  fontWeight: "bold",
                  cursor:
                    loading || !pressNumber.trim() ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  opacity: loading || !pressNumber.trim() ? 0.5 : 1,
                }}
              >
                {loading ? "Starting..." : "Start & Import Press Data"}
              </button>
            </div>
          </>
        )}

        {noDataFound && !previewData && (
          <div
            style={{
              padding: 16,
              background: "#332200",
              border: "1px solid #ff9900",
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: "1rem",
                fontWeight: "bold",
                color: "#ff9900",
                marginBottom: 12,
              }}
            >
              No Press Data Found
            </div>
            <div style={{ color: "#ccc", marginBottom: 16, fontSize: "0.9rem" }}>
              No press data file was found for mold <strong>{noDataFound.moldNumber}</strong> on machine <strong>{noDataFound.pressNumber}</strong>.
            </div>
            <div style={{ color: "#888", marginBottom: 16, fontSize: "0.85rem" }}>
              You can still start this work order without importing press data. The work order will be marked as active but no tool run parameters will be recorded.
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setNoDataFound(null)}
                style={{
                  padding: "10px 20px",
                  background: "#333",
                  border: "1px solid #555",
                  borderRadius: 6,
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Go Back
              </button>
              <button
                onClick={() => handleStart(true)}
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  background: "#ff9900",
                  border: "none",
                  borderRadius: 6,
                  color: "#000",
                  fontWeight: "bold",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? "Starting..." : "Start Without Press Data"}
              </button>
            </div>
          </div>
        )}

        {renderPreview()}
      </div>
    </div>
  );
};
