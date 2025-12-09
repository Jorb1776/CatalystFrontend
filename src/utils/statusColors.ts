// src/utils/statusColors.ts
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "New":
      return "#ffeb3b";
    case "Active":
      return "#ee1809ff";
    case "OnHold":
      return "#ff9800";
    case "Done":
      return "#2196f3";
    case "Cancelled":
      return "#f44336";
    case "FirstPiecePending":
      return "#ff0";
    default:
      return "#666";
  }
};
