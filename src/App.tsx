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
import toast, { Toaster } from 'react-hot-toast';
import { Product } from './types/Product';
import { startSignalR, stopSignalR, getConnection } from './signalr';

interface Bom { bomid: number; product?: { name: string }; version?: string; }
interface User { id: number; username: string; role: string; }

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || '');
  const [signalRReady, setSignalRReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [boms, setBoms] = useState<Bom[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  axios.defaults.baseURL = 'http://localhost:5140';

  // Refresh functions
  const refreshProducts = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get('/api/products', { headers: { Authorization: `Bearer ${token}` } })
      .then((res: any) => setProducts(res.data))
      .catch(console.error);
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

  return (
    <div style={{ background: '#111', color: '#0f0', minHeight: '100vh' }}>
      {isAuthenticated ? (
        <>
          <nav style={{ padding: '16px', background: '#222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Link to="/products" style={navLink}>Products</Link>
              <Link to="/boms" style={navLink}>BOMs</Link>
              <Link to="/schedules" style={navLink}>Schedules</Link>
              <Link to="/floor" style={navLink}>Floor</Link>
              <Link to="/reports" style={navLink}>Reports</Link>
              <Link to="/gantt" style={navLink}>Gantt</Link>
              {userRole === 'Admin' && (
                <>
                  <Link to="/users" style={navLink}>Users</Link>
                  <Link to="/api" style={navLink}>API</Link>
                </>
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
              {/* BOMs FIRST */}
              <Route path="/boms" element={<BomList boms={boms} loading={false} onEdit={() => {}} onDelete={refreshBoms} />} />
              <Route path="/boms/new" element={<BomForm products={products} onSuccess={refreshBoms} onCancel={() => navigate('/boms')} />} />
              <Route path="/boms/:id" element={<BomForm products={products} onSuccess={refreshBoms} onCancel={() => navigate('/boms')} />} />

              {/* Products AFTER */}
              <Route path="/products" element={<ProductList products={products} onDelete={refreshProducts} />} />
              <Route path="/products/new" element={<ProductForm onSuccess={refreshProducts} onCancel={() => navigate('/products')} />} />
              <Route path="/products/:id" element={<ProductForm onSuccess={refreshProducts} onCancel={() => navigate('/products')} />} />
                
              <Route path="/schedules" element={<ScheduleList />} />
              <Route path="/schedules/new" element={<ScheduleForm />} />
              <Route path="/schedules/:id" element={<ScheduleForm />} />

              <Route 
                path="/floor" 
                element={signalRReady ? <FloorDashboard /> : <p>Connecting to floor...</p>} 
              />
              <Route path="/workorder/new" element={<WorkOrderForm />} />
              <Route path="/workorder/edit/:id" element={<WorkOrderForm />} />

              <Route path="/reports" element={<Reporting />} />
              <Route path="/gantt" element={<GanttChart />} />

              {userRole === 'Admin' && (
                <>
                  <Route path="/users" element={<UserList users={users} loading={false} onEdit={() => {}} onDelete={refreshUsers} />} />
                  <Route path="/users/new" element={<UserForm onSuccess={refreshUsers} onCancel={() => navigate('/users')} />} />
                  <Route path="/users/:id" element={<UserForm onSuccess={refreshUsers} onCancel={() => navigate('/users')} />} />
                  <Route path="/api" element={<ApiDocs />} />
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