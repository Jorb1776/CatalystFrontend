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
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";

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
import ToolPicturesGallery from "./pages/ToolPicturesGallery";
import UniversalBulkUpload from "./pages/UniversalBulkUpload";
import MoldToolPicturesUpload from "./pages/MoldToolPicturesUpload";
import MoldInsertPhotosUpload from "./pages/MoldInsertPhotosUpload";
import MoldToolPicturesGallery from "./pages/MoldToolPicturesGallery";
import MoldPhotoManager from "./pages/MoldPhotoManager";

import FirstPieceApprovalDashboard from "./pages/FirstPieceApprovalDashboard";
import PartEngineeringHub from "./pages/PartEngineeringHub";
import UploadingEngineeringFiles from "./pages/UploadingEngineeringFiles";
import QsiForm from "components/QsiForm";
import UserSettings from "./pages/UserSettings";
import SetupSheet from "./pages/SetupSheet";
import ToolRunDetails from "./pages/ToolRunDetails";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [userRole, setUserRole] = useState(localStorage.getItem("role") || "");
  const [signalRReady, setSignalRReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [boms, setBoms] = useState<Bom[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // axios.defaults.baseURL = 'https://leevalleymolding.com';

  // Refresh functions
  const refresh = () => {
    // Optional: refetch data or trigger SignalR
    console.log("Work order saved, refreshing floor...");
    // You can trigger a floor refresh via SignalR if needed
  };

  const refreshProducts = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get<Product[]>("/api/products");
      setProducts(res.data);
    } catch (err) {
      console.error("Refresh failed:", err);
    }
  };

  const refreshBoms = () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios
      .get("/api/BOMs", { headers: { Authorization: `Bearer ${token}` } })
      .then((res: any) => setBoms(res.data))
      .catch(console.error);
  };

  const refreshUsers = () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios
      .get("/api/users", { headers: { Authorization: `Bearer ${token}` } })
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

  useEffect(() => {
    if (isAuthenticated && !getConnection()) {
      startSignalR()
        .then(() => setSignalRReady(true))
        .catch(() => setSignalRReady(false));
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setUserRole(localStorage.getItem("role") || "");
    startSignalR()
      .then(() => setSignalRReady(true))
      .catch(() => setSignalRReady(false));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsAuthenticated(false);
    setUserRole("");
    setSignalRReady(false);
    stopSignalR();
  };

  return (
    <Router>
      <AppContent
        isAuthenticated={isAuthenticated}
        userRole={userRole}
        signalRReady={signalRReady}
        products={products}
        boms={boms}
        users={users}
        refreshProducts={refreshProducts}
        refreshBoms={refreshBoms}
        refreshUsers={refreshUsers}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
      />
    </Router>
  );
}

function AppContent({
  isAuthenticated,
  userRole,
  signalRReady,
  products,
  boms,
  users,
  refreshProducts,
  refreshBoms,
  refreshUsers,
  handleLogin,
  handleLogout,
}: {
  isAuthenticated: boolean;
  userRole: string;
  signalRReady: boolean;
  products: Product[];
  boms: Bom[];
  users: User[];
  refreshProducts: () => void;
  refreshBoms: () => void;
  refreshUsers: () => void;
  handleLogin: () => void;
  handleLogout: () => void;
}) {
  const navigate = useNavigate();
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  return (
    <div style={{ background: "#111", color: "#0f0", minHeight: "100vh" }}>
      {isAuthenticated ? (
        <>
          <nav
            style={{
              padding: "16px",
              background: "#222",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Link to="/products" style={navLink}>
                Products
              </Link>
              {/* <Link to="/schedules" style={navLink}>Schedules</Link>
              <Link to="/boms" style={navLink}>BOMs</Link> */}

              <Link to="/floor" style={navLink}>
                Floor
              </Link>
              {/* <Link to="/reports" style={navLink}>Reports</Link> */}
              <Link to="/molds" style={navLink}>
                Molds
              </Link>
              <Link to="/machines" style={navLink}>
                Machines
              </Link>

              {/* <Link to="/gantt" style={navLink}>Gantt</Link> */}
              {userRole === "Admin" && (
                <div
                  style={{
                    position: "relative",
                    display: "inline-block", // ← THIS is the key
                  }}
                >
                  <button
                    onClick={() => setShowAdminMenu((prev) => !prev)}
                    style={{
                      ...navLink,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "0 16px",
                      fontWeight: 600,
                      color: "#0f0",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      height: "100%",
                    }}
                  >
                    Admin{" "}
                    <span style={{ fontSize: "0.75em", marginTop: 1 }}>
                      {showAdminMenu ? "▲" : "▼"}
                    </span>
                  </button>

                  {showAdminMenu && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        minWidth: 180,
                        background: "#111",
                        border: "1px solid #0f0",
                        borderRadius: 8,
                        overflow: "hidden",
                        boxShadow: "0 8px 24px rgba(0, 255, 0, 0.25)",
                        zIndex: 1000,
                        marginTop: 4,
                      }}
                      onMouseLeave={() => setShowAdminMenu(false)}
                    >
                      {[
                        { to: "/upload-bulk", label: "Bulk Upload" },
                        { to: "/inventory", label: "Inventory" },
                        { to: "/users", label: "Users" },
                      ].map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setShowAdminMenu(false)}
                          style={{
                            display: "block",
                            padding: "12px 18px",
                            color: "#0f0",
                            textDecoration: "none",
                            fontSize: "14px",
                            transition: "all 0.18s ease",
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
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <Link to="/settings" style={navLink}>
                Account
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  navigate("/login");
                }}
                style={{
                  background: "#d33",
                  color: "#fff",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: 4,
                }}
              >
                Logout
              </button>
            </div>
          </nav>

          <div style={{ padding: 20 }}>
            <Routes>
              {/* BOMs */}
              {/* <Route path="/boms" element={<BomList boms={boms} loading={false} onEdit={() => {}} onDelete={refreshBoms} />} />
  <Route path="/boms/new" element={<BomForm products={products as any} onSuccess={refreshBoms} onCancel={() => navigate('/boms')} />} />
  <Route path="/boms/:id" element={<BomForm products={products as any} onSuccess={refreshBoms} onCancel={() => navigate('/boms')} />} /> */}

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

              {/* Schedules */}
              {/* <Route path="/schedules" element={<ScheduleList />} />
  <Route path="/schedules/new" element={<ScheduleForm />} />
  <Route path="/schedules/:id" element={<ScheduleForm />} /> */}

              <Route
                path="/floor"
                element={
                  signalRReady ? <FloorDashboard /> : <p>Connecting...</p>
                }
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
              {/* <Route path="/reports" element={<Reporting />} /> */}
              {/* <Route path="/gantt" element={<GanttChart />} /> */}

              <Route path="/molds" element={<MoldList />} />
              <Route
                path="/molds/new"
                element={<MoldForm onSuccess={() => navigate("/molds")} />}
              />
              <Route
                path="/molds/:id"
                element={<MoldForm onSuccess={() => navigate("/molds")} />}
              />

              <Route path="/machines" element={<MachineList />} />
              <Route path="/machines/:id" element={<MachineForm />} />

              <Route path="/settings" element={<UserSettings />} />

              {userRole === "Admin" && (
                <>
                  <Route
                    path="/users"
                    element={
                      <UserList
                        users={users}
                        loading={false}
                        onEdit={() => {}}
                        onDelete={refreshUsers}
                      />
                    }
                  />
                  <Route
                    path="/users/new"
                    element={
                      <UserForm
                        onSuccess={refreshUsers}
                        onCancel={() => navigate("/users")}
                      />
                    }
                  />
                  <Route
                    path="/users/:id"
                    element={
                      <UserForm
                        onSuccess={refreshUsers}
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
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
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
  color: "white",
  margin: "0 12px",
  textDecoration: "none",
  fontWeight: "500",
};

export default App;
