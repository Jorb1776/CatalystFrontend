// src/data/updates.ts
//
// The "What's New" feed shown at /updates.
//
// To add an update: put a new entry at the TOP of the array below. Newest first.
// Keep `text` short and written for the people who use the system, not for
// developers -- say what changed for them, not how it was built.
//
// date: "YYYY-MM-DD"  (used for sorting and display)

export type UpdateCategory = "Feature" | "Improvement" | "Fix" | "Security";

export interface UpdateItem {
  category: UpdateCategory;
  text: string;
}

export interface UpdateEntry {
  date: string;
  title: string;
  items: UpdateItem[];
}

export const UPDATES: UpdateEntry[] = [
  {
    date: "2026-08-22",
    title: "Feedback, permissions & mobile",
    items: [
      { category: "Feature", text: "New Feedback button in the bottom corner of every page -- send a bug report, question or suggestion without leaving what you're doing." },
      { category: "Feature", text: "Managers now have their own Reports menu with Reports, QB Inventory and Receivables." },
      { category: "Feature", text: "Products can now record a Color Code alongside the Insert Code." },
      { category: "Security", text: "Read-only accounts can browse the system but can no longer create, edit or delete records." },
      { category: "Security", text: "The server now requires a login for every action that changes data, and checks your role before allowing it." },
      { category: "Improvement", text: "Phones and tablets: wide tables now scroll on their own with the header staying in place, and the Molds, Product and Report pages fit the screen properly." },
      { category: "Improvement", text: "Show/hide toggle on the password box at login." },
      { category: "Fix", text: "Drop ship errors now show the actual reason instead of a generic failure message." },
    ],
  },
  {
    date: "2026-04-27",
    title: "Drop ship tracking",
    items: [
      { category: "Feature", text: "Log drop shipments against a work order and see the history on the card." },
      { category: "Feature", text: "Printable mold report." },
      { category: "Improvement", text: "Financial reports moved into their own menu section." },
    ],
  },
  {
    date: "2026-04-21",
    title: "User management & QB inventory",
    items: [
      { category: "Feature", text: "Admins can add, edit and remove user accounts from the Users page." },
      { category: "Feature", text: "QuickBooks inventory report showing stock levels, reorder points and items needing attention." },
      { category: "Feature", text: "Printable versions of the main reports." },
      { category: "Fix", text: "Corrected how mold inserts were matched to products." },
    ],
  },
  {
    date: "2026-04-13",
    title: "QuickBooks integration",
    items: [
      { category: "Feature", text: "Live QuickBooks connection for inventory and receivables." },
      { category: "Feature", text: "Reports dashboard with sales charts and 12-month history per part." },
    ],
  },
  {
    date: "2026-03-27",
    title: "Customer images & photos",
    items: [
      { category: "Feature", text: "Attach photos to customers and parts, with multiple photos per record." },
      { category: "Feature", text: "Click any photo to open it full size." },
      { category: "Security", text: "General security hardening across the site." },
    ],
  },
  {
    date: "2026-01-11",
    title: "Material loss as a percentage",
    items: [
      { category: "Improvement", text: "Material Loss is now entered as a percentage instead of a fixed dollar amount, so it scales with material cost." },
    ],
  },
  {
    date: "2025-12-08",
    title: "Machine selection on start",
    items: [
      { category: "Feature", text: "Pick the machine when starting a work order." },
      { category: "Fix", text: "Fixed a navigation problem on the Machines page." },
    ],
  },
  {
    date: "2025-11-12",
    title: "Work order completion",
    items: [
      { category: "Feature", text: "Completing a work order sends a notification email." },
      { category: "Feature", text: "Undo Start, for when a job is started by mistake." },
    ],
  },
  {
    date: "2025-11-07",
    title: "Molds",
    items: [
      { category: "Feature", text: "Full mold records with search -- add, edit and remove molds and their inserts." },
    ],
  },
  {
    date: "2025-10-31",
    title: "Live floor board",
    items: [
      { category: "Feature", text: "The Floor board updates in real time -- work orders move between columns as they're started and finished, with no need to refresh." },
    ],
  },
];
