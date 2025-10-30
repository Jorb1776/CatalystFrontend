import { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { HubConnectionBuilder } from '@microsoft/signalr';

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
import Reporting from './components/Reporting';
import ApiDocs from './components/ApiDocs';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || '');
  const [connection, setConnection] = useState(null);
  const [products, setProducts] = useState([]);
  const [boms, setBoms] = useState([]);
  const [users, setUsers] = useState([]);

  // SignalR Setup
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('token');
    const newConnection = new HubConnectionBuilder()
      .withUrl('/floorhub', { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    newConnection.start()
      .then(() => console.log('SignalR Connected'))
      .catch(err => console.error('SignalR Error:', err));

    setConnection(newConnection);

    return () => newConnection.stop();
  }, [isAuthenticated]);

  // Auth + Data Load
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const loadData = async () => {
        try {
          const requests = [
            axios.get('/api/products'),
            axios.get('/api/boms')
          ];
          if (userRole === 'Admin') requests.push(axios.get('/api/users'));

          const [prodRes, bomRes, ...rest] = await Promise.all(requests);
          setProducts(prodRes.data);
          setBoms(bomRes.data);
          if (userRole === 'Admin' && rest[0]) setUsers(rest[0].data);
        } catch (err) {
          console.error('Load failed:', err);
        }
      };
      loadData();
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [isAuthenticated, userRole]);

  const handleLogin = (role) => {
    localStorage.setItem('token', 'dummy-token');
    localStorage.setItem('role', role);
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setUserRole('');
    setConnection(null);
    window.location.href = '/login';
  };

  return (
    <Router>
      <div>
        {isAuthenticated ? (
          <>
            {/* Navigation */}
            <nav style={{
              background: '#222',
              padding: '1rem',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <Link to="/products" style={navLink}>Products</Link>
                <Link to="/boms" style={navLink}>BOMs</Link>
                <Link to="/schedules" style={navLink}>Schedules</Link>
                <Link to="/floor" style={navLink}>Floor</Link>
                <Link to="/reports" style={navLink}>Reports</Link>
                {userRole === 'Admin' && (
                  <>
                    <Link to="/users" style={navLink}>Users</Link>
                    <Link to="/api" style={navLink}>API</Link>
                  </>
                )}
              </div>
              <button onClick={handleLogout} style={{
                background: '#d33',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 4,
                cursor: 'pointer'
              }}>
                Logout
              </button>
            </nav>

            {/* Routes */}
            <div style={{ padding: 20 }}>
              <Routes>
                <Route path="/products" element={<ProductList products={products} />} />
                <Route path="/products/new" element={<ProductForm />} />
                <Route path="/products/:id" element={<ProductForm />} />

                <Route path="/boms" element={<BomList boms={boms} />} />
                <Route path="/boms/new" element={<BomForm products={products} />} />
                <Route path="/boms/:id" element={<BomForm products={products} />} />

                <Route path="/schedules" element={<ScheduleList />} />
                <Route path="/schedules/new" element={<ScheduleForm />} />
                <Route path="/schedules/:id" element={<ScheduleForm />} />

                <Route path="/floor" element={
                  connection ? <FloorDashboard connection={connection} /> : <p>Loading floor...</p>
                } />

                <Route path="/reports" element={<Reporting />} />

                {userRole === 'Admin' && (
                  <>
                    <Route path="/users" element={<UserList users={users} />} />
                    <Route path="/users/new" element={<UserForm />} />
                    <Route path="/users/:id" element={<UserForm />} />
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
      </div>
    </Router>
  );
}

const navLink = {
  color: 'white',
  margin: '0 12px',
  textDecoration: 'none',
  fontWeight: '500'
};

export default App;