// src/components/ConfirmDialog.tsx
import React from "react";
import { Box, Button, Typography } from "@mui/material";

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  message,
  onConfirm,
  onCancel,
}) => (
  <Box
    sx={{
      position: "fixed",
      inset: 0,
      bgcolor: "rgba(0,0,0,0.95)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}
    onClick={onCancel}
  >
    <Box
      sx={{
        bgcolor: "#111",
        border: "2px solid #0f0",
        borderRadius: 2,
        p: 4,
        minWidth: 360,
        textAlign: "center",
        boxShadow: "0 0 40px #0f0",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Typography
        variant="h6"
        sx={{ color: "#0f0", fontWeight: "bold", mb: 3 }}
      >
        {message}
      </Typography>
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
        <Button
          variant="contained"
          color="success"
          size="large"
          onClick={onConfirm}
          sx={{ px: 4, fontWeight: "bold" }}
        >
          Confirm
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={onCancel}
          sx={{
            borderColor: "#666",
            color: "#fff",
            "&:hover": { borderColor: "#888" },
          }}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  </Box>
);

// ADD THESE WHERE NEEDED

// // Inside component
// const [confirmOpen, setConfirmOpen] = useState(false);
// const [confirmMessage, setConfirmMessage] = useState("");
// const confirmCallback = useRef<() => void>(() => {});

// const requestConfirm = (msg: string, callback: () => void) => {
//   setConfirmMessage(msg);
//   confirmCallback.current = callback;
//   setConfirmOpen(true);
// };

// // Render dialog (put before lightbox)
// {confirmOpen && (
//   <ConfirmDialog
//     message={confirmMessage}
//     onConfirm={() => {
//       confirmCallback.current();
//       setConfirmOpen(false);
//     }}
//     onCancel={() => setConfirmOpen(false)}
//   />
// )}
