// src/App.tsx
import React, { useState, useEffect } from 'react';
import axios from './axios';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

import './styles/gantt.css';
import Login from './components/Login';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import BomList from './components/BomList';
import BomForm from './components/BomForm';
import UserList from './components/UserList';
import UserForm from './components/UserForm';
import ScheduleList from './components/ScheduleList';
import ScheduleForm from './components/ScheduleForm';
import FloorDashboard from './components/FloorDashboard';
import WorkOrderForm from './components/WorkOrderForm';
import Reporting from './components/Reporting';
import ApiDocs from './components/ApiDocs';
import GanttChart from './components/GanttChart';
import InventoryDashboard from './components/InventoryDashboard';
import toast, { Toaster } from 'react-hot-toast';
import { Product, Mold } from './types/Product';
import ProductNew from './pages/ProductNew';
import ProductDetails from './pages/ProductDetails';
import ProductEdit from './pages/ProductEdit';
import WorkOrderEdit from './pages/WorkOrderEdit';
import { startSignalR, stopSignalR, getConnection } from './signalr';
import { Bom } from './types/Bom';
import { User } from './types/User';
import MoldList from './pages/MoldList';
import MoldForm from './pages/MoldForm';
import MaterialList from './pages/MaterialList';
import MaterialForm from './pages/MaterialForm';
import ColorantList from './pages/ColorantList';
import ColorantForm from './pages/ColorantForm';
import AdditiveList from './pages/AdditiveList';
import AdditiveForm from './pages/AdditiveForm';



function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || '');
  const [signalRReady, setSignalRReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [boms, setBoms] = useState<Bom[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  

  // axios.defaults.baseURL = 'https://leevalleymolding.com';

  // Refresh functions
  const refresh = () => {
  // Optional: refetch data or trigger SignalR
  console.log('Work order saved, refreshing floor...');
  // You can trigger a floor refresh via SignalR if needed
};

const refreshProducts = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await axios.get<Product[]>('/api/products');
    setProducts(res.data);
  } catch (err) {
    console.error('Refresh failed:', err);
  }
};

  const refreshBoms = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get('/api/BOMs', { headers: { Authorization: `Bearer ${token}` } })
      .then((res: any) => setBoms(res.data))
      .catch(console.error);
  };

  const refreshUsers = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((res: any) => setUsers(res.data))
      .catch(console.error);
  };
  
  // Load data
  useEffect(() => {
    if (isAuthenticated) {
      refreshProducts();
      refreshBoms();
      if (userRole === 'Admin') refreshUsers();
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
    setUserRole(localStorage.getItem('role') || '');
    startSignalR()
      .then(() => setSignalRReady(true))
      .catch(() => setSignalRReady(false));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
    setUserRole('');
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
  handleLogout
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
    <div style={{ background: '#111', color: '#0f0', minHeight: '100vh' }}>
      {isAuthenticated ? (
        <>
          <nav style={{ padding: '16px', background: '#222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Link to="/products" style={navLink}>Products</Link>
              {/* <Link to="/schedules" style={navLink}>Schedules</Link>
              <Link to="/boms" style={navLink}>BOMs</Link> */}
              
              <Link to="/floor" style={navLink}>Floor</Link>
              {/* <Link to="/reports" style={navLink}>Reports</Link> */}
              <Link to="/molds" style={navLink}>Molds</Link>
              {/* <Link to="/gantt" style={navLink}>Gantt</Link> */}
              {userRole === 'Admin' && (
                <div style={{ position: 'relative' }}>
                  
                  <button
                    onClick={() => setShowAdminMenu(!showAdminMenu)}
                    style={{
                      ...navLink,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0 12px',
                      fontWeight: 500
                    }}
                  >
                    Admin ▼
                  </button>
                  {showAdminMenu && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        background: '#222',
                        border: '1px solid #0f0',
                        borderRadius: 6,
                        minWidth: 160,
                        zIndex: 1000,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                      }}
                      onMouseLeave={() => setShowAdminMenu(false)}
                    >
                      {[
                        { to: '/inventory', label: 'Inventory' },
                        { to: '/users', label: 'Users' },
                        // { to: '/api', label: 'API Docs' },
                        // { to: '/materials', label: 'Materials' },
                        // { to: '/colorants', label: 'Colorants' },
                        // { to: '/additives', label: 'Additives' },
                        
                      ].map(item => (
                        <Link
                          key={item.to}
                          to={item.to}
                          style={{
                            display: 'block',
                            padding: '10px 16px',
                            color: '#0f0',
                            textDecoration: 'none',
                            fontSize: 14,
                            borderBottom: '1px solid #333'
                          }}
                          onClick={() => setShowAdminMenu(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
</div>
<button onClick={() => {
  handleLogout();
  navigate('/login');
}} style={{ background: '#d33', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: 4 }}>
  Logout
</button>
</nav>

<div style={{ padding: 20 }}>
<Routes>
  <Route path="/login" element={<Login onLogin={handleLogin} />} />
  <Route path="*" element={<Navigate to="/login" />} />

  {/* BOMs */}
  {/* <Route path="/boms" element={<BomList boms={boms} loading={false} onEdit={() => {}} onDelete={refreshBoms} />} />
  <Route path="/boms/new" element={<BomForm products={products as any} onSuccess={refreshBoms} onCancel={() => navigate('/boms')} />} />
  <Route path="/boms/:id" element={<BomForm products={products as any} onSuccess={refreshBoms} onCancel={() => navigate('/boms')} />} /> */}

  {/* Products */}
  <Route path="/products" element={<ProductList products={products} refreshProducts={refreshProducts} />} />
  <Route path="/products/new" element={<ProductNew />} />
  <Route path="/products/:id" element={<ProductDetails />} />
  <Route path="/products/:id/edit" element={<ProductEdit />} />

  {/* Schedules */}
  {/* <Route path="/schedules" element={<ScheduleList />} />
  <Route path="/schedules/new" element={<ScheduleForm />} />
  <Route path="/schedules/:id" element={<ScheduleForm />} /> */}

  <Route path="/floor" element={signalRReady ? <FloorDashboard /> : <p>Connecting...</p>} />
  <Route  path="/workorder/new" element={<WorkOrderForm onSuccess={() => navigate('/floor')} onCancel={() => navigate('/floor')} />}/>
  <Route path="/workorder/edit/:id" element={<WorkOrderEdit />} />
  {/* <Route path="/reports" element={<Reporting />} /> */}
  {/* <Route path="/gantt" element={<GanttChart />} /> */}

  <Route path="/molds" element={<MoldList />} />
  <Route path="/molds/new" element={<MoldForm onSuccess={() => navigate('/molds')} />} />
  <Route path="/molds/:id" element={<MoldForm onSuccess={() => navigate('/molds')} />} />

  {userRole === 'Admin' && (
    <>
      <Route path="/users" element={<UserList users={users} loading={false} onEdit={() => {}} onDelete={refreshUsers} />} />
      <Route path="/users/new" element={<UserForm onSuccess={refreshUsers} onCancel={() => navigate('/users')} />} />
      <Route path="/users/:id" element={<UserForm onSuccess={refreshUsers} onCancel={() => navigate('/users')} />} />
      <Route path="/api" element={<ApiDocs />} />

      <Route path="/materials" element={<MaterialList />} />
      <Route path="/materials/new" element={<MaterialForm onSuccess={() => navigate('/materials')} />} />
      <Route path="/materials/:id" element={<MaterialForm onSuccess={() => navigate('/materials')} />} />

      <Route path="/colorants" element={<ColorantList />} />
      <Route path="/colorants/new" element={<ColorantForm onSuccess={() => navigate('/colorants')} />} />
      <Route path="/colorants/:id" element={<ColorantForm onSuccess={() => navigate('/colorants')} />} />

      <Route path="/additives" element={<AdditiveList />} />
      <Route path="/additives/new" element={<AdditiveForm onSuccess={() => navigate('/additives')} />} />
      <Route path="/additives/:id" element={<AdditiveForm onSuccess={() => navigate('/additives')} />} />

      <Route path="/inventory" element={<InventoryDashboard />} />
    </>
  )}

  <Route path="*" element={<Navigate to="/products" />} />
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
        position="top-right"
        toastOptions={{
          style: {
            background: '#222',
            color: '#0f0',
            border: '1px solid #0f0',
            borderRadius: '8px',
            padding: '12px 16px',
          },
          success: { duration: 3000 },
          error: { duration: 5000 },
        }}
      />
    </div>
  );
}

const navLink: React.CSSProperties = {
  color: 'white',
  margin: '0 12px',
  textDecoration: 'none',
  fontWeight: '500'
};

export default App;