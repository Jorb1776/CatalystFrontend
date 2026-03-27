import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { Link } from 'react-router-dom';

interface Customer {
  customerID: number;
  name: string;
  address: string;
  creditLimit: number;
  email1?: string;
  email2?: string;
  email3?: string;
}

const CustomerList = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');

  const load = async () => {
    const res = await axios.get<Customer[]>('/api/customers');
    setCustomers(res.data);
  };

  const del = async (id: number) => {
    if (!confirm('Delete customer?')) return;
    await axios.delete(`/api/customers/${id}`);
    load();
  };

  useEffect(() => { load(); }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email1 && c.email1.toLowerCase().includes(search.toLowerCase()))
  );

  const emailCount = (c: Customer) => [c.email1, c.email2, c.email3].filter(Boolean).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Customers</h2>
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={searchStyle} />
        <Link to="/customers/new"><button style={btnSuccess}>+ New Customer</button></Link>
      </div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={th}>Name</th>
            <th style={th}>Primary Email</th>
            <th style={th}>Emails</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(c => (
            <tr key={c.customerID} style={row}>
              <td style={td}>{c.name}</td>
              <td style={td}>{c.email1 || <span style={{ color: '#666' }}>Not set</span>}</td>
              <td style={td}>
                <span style={{
                  background: emailCount(c) > 0 ? '#0f03' : '#f003',
                  padding: '2px 8px',
                  borderRadius: 4,
                  color: emailCount(c) > 0 ? '#0f0' : '#f66'
                }}>
                  {emailCount(c)} / 3
                </span>
              </td>
              <td style={td}>
                <Link to={`/customers/${c.customerID}`} style={linkGreen}>Edit</Link>
                <button onClick={() => del(c.customerID)} style={btnRed}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          No customers found. Add your first customer to get started.
        </div>
      )}
    </div>
  );
};

const searchStyle: React.CSSProperties = { padding: 8, background: '#222', color: '#0f0', border: '1px solid #0f0', borderRadius: 4, width: 200 };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const th: React.CSSProperties = { textAlign: 'left', padding: '12px 8px', borderBottom: '2px solid #0f0', color: '#0f0' };
const td: React.CSSProperties = { padding: '12px 8px', borderBottom: '1px solid #333' };
const row: React.CSSProperties = { transition: 'background 0.2s' };
const btnSuccess: React.CSSProperties = { background: '#0c0', color: '#000', padding: '8px 16px', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' };
const btnRed: React.CSSProperties = { background: 'none', border: 'none', color: '#d33', marginLeft: 8, cursor: 'pointer' };
const linkGreen: React.CSSProperties = { color: '#0c0', marginRight: 8 };

export default CustomerList;
