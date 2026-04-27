// src/App.tsx
import React, { useState, useEffect } from "react";
import axios from "./axios";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import "./styles/gantt.css";
import Login from "./components/Login";
import ProductList from "./components/ProductList";
import ProductForm from "./components/ProductForm";
import BomList from "./components/BomList";
import BomForm from "./components/BomForm";
import UserList from "./components/UserList";
import UserForm from "./components/UserForm";
import ScheduleList from "./components/ScheduleList";
import ScheduleForm from "./components/ScheduleForm";
import FloorDashboard from "./components/FloorDashboard";
import WorkOrderForm from "./components/WorkOrderForm";
import Reporting from "./components/Reporting";
import ApiDocs from "./components/ApiDocs";
import GanttChart from "./components/GanttChart";
import InventoryDashboard from "./components/InventoryDashboard";
import toast, { Toaster } from "react-hot-toast";
import { Product, Mold } from "./types/Product";
import ProductNew from "./pages/ProductNew";
import ProductDetails from "./pages/ProductDetails";
import ProductEdit from "./pages/ProductEdit";
import WorkOrderEdit from "./pages/WorkOrderEdit";
import { startSignalR, stopSignalR, getConnection } from "./signalr";
import { Bom } from "./types/Bom";
import { User } from "./types/User";
import MoldList from "./pages/MoldList";
import MoldForm from "./pages/MoldForm";
import MachineList from "./pages/MachineList";
import MachineForm from "./pages/MachineForm";
import MaterialList from "./pages/MaterialList";
import MaterialForm from "./pages/MaterialForm";
import ColorantList from "./pages/ColorantList";
import ColorantForm from "./pages/ColorantForm";
import AdditiveList from "./pages/AdditiveList";
import AdditiveForm from "./pages/AdditiveForm";
import QuoteList from "./pages/QuoteList";
import QuoteFormNew from "./pages/QuoteFormNew";
import ToolPicturesGallery from "./pages/ToolPicturesGallery";
import UniversalBulkUpload from "./pages/UniversalBulkUpload";
import MoldToolPicturesUpload from "./pages/MoldToolPicturesUpload";
import MoldInsertPhotosUpload from "./pages/MoldInsertPhotosUpload";
import MoldToolPicturesGallery from "./pages/MoldToolPicturesGallery";
import MoldPhotoManager from "./pages/MoldPhotoManager";
import MoldView from "./pages/MoldView";

import FirstPieceApprovalDashboard from "./pages/FirstPieceApprovalDashboard";
import PartEngineeringHub from "./pages/PartEngineeringHub";
import UploadingEngineeringFiles from "./pages/UploadingEngineeringFiles";
import QsiForm from "components/QsiForm";
import UserSettings from "./pages/UserSettings";
import SetupSheet from "./pages/SetupSheet";
import ToolRunDetails from "./pages/ToolRunDetails";
import ToolPreSampleChecklist from "./pages/ToolPreSampleChecklist";
import EngineeringPacketChecklist from "./pages/EngineeringPacketChecklist";
import CustomerList from "./pages/CustomerList";
import CustomerForm from "./pages/CustomerForm";
import BulkWorkOrderForm from "./components/BulkWorkOrderForm";
import Reports from "./pages/Reports";
import QBInventoryReport from "./pages/QBInventoryReport";
import ReceivablesReport from "./pages/ReceivablesReport";
import BestSellersReport from "./pages/BestSellersReport";
import FinancialReport from "./pages/FinancialReport";

import { AuthProvider, useAuth, LOCATIONS } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated, user, logout, location, setLocation } = useAuth();
  const userRole = user?.role || "";
  const userInitials = user?.initials || "";

  const [signalRReady, setSignalRReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [boms, setBoms] = useState<Bom[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const navigate = useNavigate();
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Refresh functions
  const refresh = () => {
    console.log("Work order saved, refreshing floor...");
  };

  const refreshProducts = async (location?: string) => {
    if (!isAuthenticated) return;
    try {
      const params = location ? `?location=${location}` : "";
      const res = await axios.get<Product[]>(`/api/products${params}`);
      setProducts(res.data);
    } catch (err) {
      console.error("Refresh failed:", err);
    }
  };

  const refreshBoms = () => {
    if (!isAuthenticated) return;
    axios
      .get("/api/BOMs")
      .then((res: any) => setBoms(res.data))
      .catch(console.error);
  };

  const refreshUsers = () => {
    if (!isAuthenticated) return;
    axios
      .get("/api/users")
      .then((res: any) => setUsers(res.data))
      .catch(console.error);
  };

  // Load data
  useEffect(() => {
    if (isAuthenticated) {
      refreshProducts();
      refreshBoms();
      if (userRole === "Admin") refreshUsers();
    }
  }, [isAuthenticated, userRole]);

  // SignalR connection
  useEffect(() => {
    if (isAuthenticated && !getConnection()) {
      startSignalR()
        .then(() => setSignalRReady(true))
        .catch(() => setSignalRReady(false));
    }

    // Cleanup on logout
    if (!isAuthenticated) {
      setSignalRReady(false);
      stopSignalR();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    setSignalRReady(false);
    stopSignalR();
    navigate("/login");
  };

  return (
    <div style={{ background: "#111", color: "#0f0", minHeight: "100vh", width: "100%", boxSizing: "border-box" }}>
      {isAuthenticated ? (
        <>
          <nav
            style={{
              padding: "12px 16px",
              background: "#000",
              borderBottom: "2px solid #0f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "sticky",
              top: 0,
              zIndex: 100,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Hamburger Menu - Mobile Only */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              style={{
                display: "none",
                background: "transparent",
                border: "1px solid #0f0",
                color: "#0f0",
                fontSize: "20px",
                padding: "8px 12px",
                cursor: "pointer",
                borderRadius: "4px",
              }}
              className="hamburger-btn"
            >
              ☰
            </button>

            {/* Desktop Menu */}
            <div className="desktop-menu" style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              <Link to="/products" style={navLink}>Products</Link>
              <Link to="/floor" style={navLink}>Floor</Link>
              <Link to="/molds" style={navLink}>Molds</Link>
              <Link to="/machines" style={navLink}>Machines</Link>
              {userRole === "Admin" && (
                <div style={{ position: "relative", display: "inline-block" }}>
                  <button
                    onClick={() => setShowAdminMenu((prev) => !prev)}
                    style={{
                      ...navLink,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "0 12px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    Admin <span style={{ fontSize: "0.75em" }}>{showAdminMenu ? "▲" : "▼"}</span>
                  </button>

                  {showAdminMenu && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        minWidth: 160,
                        background: "#000",
                        border: "1px solid #0f0",
                        borderRadius: 4,
                        overflow: "hidden",
                        boxShadow: "0 4px 12px rgba(0, 255, 0, 0.3)",
                        zIndex: 1000,
                        marginTop: 4,
                      }}
                      onMouseLeave={() => setShowAdminMenu(false)}
                    >
                      {[
                        { type: "header", label: "QuickBooks" },
                        { to: "/reports", label: "Reports" },
                        { to: "/qb-inventory", label: "QB Inventory" },
                        { to: "/receivables", label: "Receivables" },
                        { type: "header", label: "Financial" },
                        { to: "/financial", label: "Financial Report" },
                        { to: "/best-sellers", label: "Best Sellers" },
                        { type: "header", label: "Management" },
                        { to: "/quotes", label: "Quotes" },
                        { to: "/customers", label: "Customers" },
                        { to: "/inventory", label: "Inventory" },
                        { to: "/upload-bulk", label: "Bulk Upload" },
                        { type: "header", label: "System" },
                        { to: "/users", label: "Users" },
                      ].map((item, idx) => {
                        if (item.type === "header") {
                          return (
                            <div
                              key={"header-" + idx}
                              style={{
                                padding: "6px 16px 4px",
                                color: "#0ff",
                                fontSize: "11px",
                                fontWeight: "bold",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                borderTop: idx === 0 ? "none" : "1px solid #333",
                                marginTop: idx === 0 ? 0 : 4,
                              }}
                            >
                              {item.label}
                            </div>
                          );
                        }
                        return (
                          <Link
                            key={item.to}
                            to={item.to!}
                            onClick={() => setShowAdminMenu(false)}
                            style={{
                              display: "block",
                              padding: "8px 16px 8px 24px",
                              color: "#0f0",
                              textDecoration: "none",
                              fontSize: "14px",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#0f0";
                              e.currentTarget.style.color = "#000";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = "#0f0";
                            }}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Side */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  background: "#000",
                  color: "#0f0",
                  border: "1px solid #0f0",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <span style={{ color: "#0ff", fontWeight: "bold", fontSize: "14px" }}>
                {userInitials}
              </span>
              <Link to="/settings" style={navLink} className="account-link">Account</Link>
              <button
                onClick={handleLogout}
                style={{
                  background: "transparent",
                  color: "#d33",
                  padding: "6px 14px",
                  border: "1px solid #d33",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Logout
              </button>
            </div>

            {/* Mobile Menu Overlay */}
            {showMobileMenu && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100vw",
                  height: "100vh",
                  background: "rgba(0, 0, 0, 0.9)",
                  zIndex: 9999,
                  display: "flex",
                  flexDirection: "column",
                  padding: "20px",
                  overflowY: "auto",
                }}
              >
                <button
                  onClick={() => setShowMobileMenu(false)}
                  style={{
                    alignSelf: "flex-end",
                    background: "transparent",
                    border: "1px solid #0f0",
                    color: "#0f0",
                    fontSize: "24px",
                    padding: "8px 16px",
                    cursor: "pointer",
                    marginBottom: "20px",
                    borderRadius: "4px",
                  }}
                >
                  ✕
                </button>
                <Link to="/products" style={mobileNavLink} onClick={() => setShowMobileMenu(false)}>Products</Link>
                <Link to="/floor" style={mobileNavLink} onClick={() => setShowMobileMenu(false)}>Floor</Link>
                <Link to="/molds" style={mobileNavLink} onClick={() => setShowMobileMenu(false)}>Molds</Link>
                <Link to="/machines" style={mobileNavLink} onClick={() => setShowMobileMenu(false)}>Machines</Link>
                {userRole === "Admin" && (
                  <>
                    <div style={{ ...mobileNavLink, color: "#0ff", fontWeight: "bold", cursor: "default" }}>Admin</div>
                    <div style={{ ...mobileNavLink, color: "#0ff", fontSize: "0.75rem", textTransform: "uppercase", cursor: "default", paddingTop: 8 }}>  QuickBooks</div>
                    <Link to="/reports" style={mobileNavLink} onClick={() => setShowMobileMenu(false)}>    • Reports</Link>
                    <Link to="/qb-inventory" style={mobileNavLink} onClick={() => setShowMobileMenu(false)}>    • QB Inventory</Link>
                    <Link to="/receivables" style={mobileNavLink} onClick={() => setShowMobileMenu(false)}>    • Receivables</Link>
                    <div style={{ ...mobileNavLink, color: "#0ff", fontSize: "0.75rem", textTransform: "uppercase", cursor: "default", paddingTop: 8 }}>  Financial</div>
                    <Link to="/financial" style={mobileNavLink} onClick={() => setShowMobileMenu(false)}>    • Financial Report</Link>
                    <Link to="/best-sellers" style={mobileNavLink} onClick={() => setShowMobileMenu(false)}>    • Best Sellers</Link>
                    <div style={{ ...mobileNavLink, color: "#0ff", fontSize: "0.75rem", textTransform: "uppercase", cursor: "default", paddingTop: 8 }}>  Management</div>
                    <Link to="/quotes" style={mobileNavLink} onClick={() => setShowMobileMenu(false)}>    • Quotes</Link>
                    <Link to="/customers" style={mobileNavLink} onClick={() => setShowMobileMenu(false)}>    • Customers</Link>
                    <Link to="/inventory" style={mobileNavLink} onClick={() => setShowMobileMenu(false)}>    • Inventory</Link>
                    <Link to="/upload-bulk" style={mobileNavLink} onClick={() => setShowMobileMenu(false)}>    • Bulk Upload</Link>
                    <div style={{ ...mobileNavLink, color: "#0ff", fontSize: "0.75rem", textTransform: "uppercase", cursor: "default", paddingTop: 8 }}>  System</div>
                    <Link to="/users" style={mobileNavLink} onClick={() => setShowMobileMenu(false)}>    • Users</Link>
                  </>
                )}
                <Link to="/settings" style={mobileNavLink} onClick={() => setShowMobileMenu(false)}>Account</Link>
                <div style={{ ...mobileNavLink, display: "flex", alignItems: "center", gap: 12 }}>
                  <span>Location:</span>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{
                      background: "#000",
                      color: "#0f0",
                      border: "1px solid #0f0",
                      borderRadius: 4,
                      padding: "8px 12px",
                      fontSize: "16px",
                      cursor: "pointer",
                    }}
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </nav>

          <style>
            {`
              * {
                box-sizing: border-box;
              }

              body, html {
                margin: 0;
                padding: 0;
                max-width: 100vw;
              }

              @media (max-width: 768px) {
                .hamburger-btn {
                  display: block !important;
                }
                .desktop-menu {
                  display: none !important;
                }
                .account-link {
                  display: none !important;
                }
                .main-content {
                  padding: 10px !important;
                  max-width: 100vw !important;
                }
              }
            `}
          </style>

          <div className="main-content" style={{ padding: 20, width: "100%", boxSizing: "border-box" }}>
            <Routes>
              {/* Products */}
              <Route
                path="/products"
                element={
                  <ProductList
                    products={products}
                    refreshProducts={refreshProducts}
                  />
                }
              />
              <Route
                path="/products/new"
                element={<ProductNew refreshProducts={refreshProducts} />}
              />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route
                path="/products/:id/edit"
                element={<ProductEdit refreshProducts={refreshProducts} />}
              />
              <Route
                path="/products/:id/setup-sheet"
                element={<SetupSheet />}
              />
              <Route
                path="/products/:id/tool-runs/:runId"
                element={<ToolRunDetails />}
              />

              <Route
                path="/floor"
                element={<FloorDashboard />}
              />
              <Route
                path="/workorder/new"
                element={
                  <WorkOrderForm
                    onSuccess={() => navigate("/floor")}
                    onCancel={() => navigate("/floor")}
                  />
                }
              />
              <Route path="/workorder/edit/:id" element={<WorkOrderEdit />} />
              <Route path="/workorder/bulk" element={<BulkWorkOrderForm />} />

              <Route path="/molds" element={<MoldList />} />
              <Route
                path="/molds/new"
                element={<MoldForm onSuccess={() => navigate("/molds")} />}
              />
              <Route path="/molds/:id/view" element={<MoldView />} />
              <Route
                path="/molds/:id"
                element={<MoldForm onSuccess={() => navigate("/molds")} />}
              />
              <Route path="/tool-checklist" element={<ToolPreSampleChecklist />} />
              <Route path="/engineering-packet" element={<EngineeringPacketChecklist />} />

              <Route path="/machines" element={<MachineList />} />
              <Route path="/machines/:id" element={<MachineForm />} />

              <Route path="/settings" element={<UserSettings />} />
              {userRole === "Admin" && <Route path="/reports" element={<Reports />} />}
              {userRole === "Admin" && <Route path="/qb-inventory" element={<QBInventoryReport />} />}
              {userRole === "Admin" && <Route path="/receivables" element={<ReceivablesReport />} />}
              {userRole === "Admin" && <Route path="/best-sellers" element={<BestSellersReport />} />}
              {userRole === "Admin" && <Route path="/financial" element={<FinancialReport />} />}

              {userRole === "Admin" && (
                <>
                  <Route
                    path="/users"
                    element={
                      <UserList
                        users={users}
                        loading={false}
                        onEdit={(u) => navigate(`/users/${u.id}`)}
                        onDelete={refreshUsers}
                      />
                    }
                  />
                  <Route
                    path="/users/new"
                    element={
                      <UserForm
                        onSuccess={async () => { await axios.get("/api/users").then((res: any) => setUsers(res.data)); navigate("/users"); }}
                        onCancel={() => navigate("/users")}
                      />
                    }
                  />
                  <Route
                    path="/users/:id"
                    element={
                      <UserForm
                        onSuccess={async () => { await axios.get("/api/users").then((res: any) => setUsers(res.data)); navigate("/users"); }}
                        onCancel={() => navigate("/users")}
                      />
                    }
                  />
                  <Route path="/api" element={<ApiDocs />} />

                  <Route path="/materials" element={<MaterialList />} />
                  <Route
                    path="/materials/new"
                    element={
                      <MaterialForm onSuccess={() => navigate("/materials")} />
                    }
                  />
                  <Route
                    path="/materials/:id"
                    element={
                      <MaterialForm onSuccess={() => navigate("/materials")} />
                    }
                  />

                  <Route path="/colorants" element={<ColorantList />} />
                  <Route
                    path="/colorants/new"
                    element={
                      <ColorantForm onSuccess={() => navigate("/colorants")} />
                    }
                  />
                  <Route
                    path="/colorants/:id"
                    element={
                      <ColorantForm onSuccess={() => navigate("/colorants")} />
                    }
                  />

                  <Route path="/additives" element={<AdditiveList />} />
                  <Route
                    path="/additives/new"
                    element={
                      <AdditiveForm onSuccess={() => navigate("/additives")} />
                    }
                  />
                  <Route
                    path="/additives/:id"
                    element={
                      <AdditiveForm onSuccess={() => navigate("/additives")} />
                    }
                  />

                  {/* Quotes */}
                  <Route path="/quotes" element={<QuoteList />} />
                  <Route path="/quotes/new" element={<QuoteFormNew />} />
                  <Route path="/quotes/:id" element={<QuoteFormNew />} />

                  {/* Customers */}
                  <Route path="/customers" element={<CustomerList />} />
                  <Route path="/customers/new" element={<CustomerForm />} />
                  <Route path="/customers/:id" element={<CustomerForm />} />

                  <Route path="/inventory" element={<InventoryDashboard />} />
                  <Route
                    path="/upload-bulk"
                    element={<UniversalBulkUpload />}
                  />
                  <Route
                    path="/products/:id/upload-engineering"
                    element={<UploadingEngineeringFiles />}
                  />
                  <Route
                    path="/part/:partNumber/engineering"
                    element={<PartEngineeringHub />}
                  />
                  <Route
                    path="/molds/:moldId/tool-pictures"
                    element={<MoldToolPicturesGallery />}
                  />
                  <Route
                    path="/molds/:moldId/tool-pictures/upload"
                    element={<MoldToolPicturesUpload />}
                  />
                  <Route
                    path="/molds/:moldId/tool-pictures/manage"
                    element={<MoldPhotoManager />}
                  />
                  <Route
                    path="/molds/:moldId/inserts/:fullNumber/photos"
                    element={<MoldInsertPhotosUpload />}
                  />
                  <Route
                    path="/products/:id/tool-pictures"
                    element={<ToolPicturesGallery />}
                  />

                  <Route path="/qsi/:productId" element={<QsiForm />} />
                  <Route
                    path="/approvals"
                    element={<FirstPieceApprovalDashboard />}
                  />
                </>
              )}

              <Route path="*" element={<Navigate to="/floor" />} />
            </Routes>
          </div>
        </>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#111",
            color: "#0f0",
            border: "2px solid #0f0",
            borderRadius: 8,
            padding: "16px 20px",
            fontWeight: "bold",
            fontSize: "0.9rem",
            boxShadow: "0 0 30px #0f0, inset 0 0 20px rgba(0,255,0,0.2)",
          },
          success: {
            style: {
              borderColor: "#0f0",
              boxShadow: "0 0 40px #0f0, inset 0 0 25px rgba(0,255,0,0.3)",
            },
            iconTheme: { primary: "#0f0", secondary: "#111" },
          },
          error: {
            style: {
              borderColor: "#f33",
              boxShadow: "0 0 40px #f33, inset 0 0 25px rgba(255,0,0,0.3)",
              color: "#fff",
            },
            iconTheme: { primary: "#f33", secondary: "#111" },
          },
        }}
      />
    </div>
  );
}

const navLink: React.CSSProperties = {
  color: "#0f0",
  margin: "0 8px",
  textDecoration: "none",
  fontWeight: "500",
  fontSize: "14px",
};

const mobileNavLink: React.CSSProperties = {
  color: "#0f0",
  textDecoration: "none",
  fontSize: "18px",
  padding: "12px 0",
  borderBottom: "1px solid #003300",
  display: "block",
};

export default App;
