import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../axios';
import toast from 'react-hot-toast';
import { Quote } from '../types/Quote';

const QuoteList: React.FC = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedVersions, setSelectedVersions] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await axios.get<Quote[]>('/api/quotes');
      setQuotes(response.data);

      // Initialize selected versions to currentVersion for each quote
      const initialVersions: Record<number, number> = {};
      response.data.forEach(quote => {
        if (quote.quoteID) {
          initialVersions[quote.quoteID] = quote.currentVersion;
        }
      });
      setSelectedVersions(initialVersions);
    } catch (error) {
      toast.error('Failed to fetch quotes');
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this quote?')) return;

    try {
      await axios.delete(`/api/quotes/${id}`);
      toast.success('Quote deleted successfully');
      fetchQuotes();
    } catch (error) {
      toast.error('Failed to delete quote');
      console.error(error);
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch =
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.productName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || quote.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return '#888';
      case 'Sent': return '#00f';
      case 'Approved': return '#0f0';
      case 'Rejected': return '#f00';
      case 'Expired': return '#f90';
      default: return '#888';
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#111', color: '#0f0', minHeight: '100vh', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #0f0', paddingBottom: '10px' }}>
        <h1 style={{ margin: 0 }}>Quotes</h1>
        <button
          onClick={() => navigate('/quotes/new')}
          style={{ padding: '10px 20px', backgroundColor: '#0f0', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          + Create New Quote
        </button>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search by quote number, customer, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px', backgroundColor: '#000', color: '#0f0', border: '1px solid #0f0' }}
          />
        </div>
        <div>
          <label style={{ marginRight: '10px' }}>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '10px', backgroundColor: '#000', color: '#0f0', border: '1px solid #0f0' }}
          >
            <option value="All">All</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Quotes Table */}
      <div style={{ border: '1px solid #0f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#000', borderBottom: '2px solid #0f0' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Quote #</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Product</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Quantity</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>$/Part</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Total</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Version</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Created</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotes.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                  No quotes found. Click "Create New Quote" to get started.
                </td>
              </tr>
            ) : (
              filteredQuotes.map(quote => (
                <tr key={quote.quoteID} style={{ borderBottom: '1px solid #0f0', cursor: 'pointer' }} onClick={() => {
                  const version = selectedVersions[quote.quoteID!] || quote.currentVersion;
                  navigate(`/quotes/${quote.quoteID}?version=${version}`);
                }}>
                  <td style={{ padding: '12px' }}>
                    <strong>{quote.quoteNumber}</strong>
                  </td>
                  <td style={{ padding: '12px' }}>{quote.customerName}</td>
                  <td style={{ padding: '12px' }}>{quote.productName}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>{quote.quantity.toLocaleString()}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>${quote.pricePerPart.toFixed(4)}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>${quote.totalCost.toFixed(2)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    {quote.currentVersion > 1 ? (
                      <select
                        value={selectedVersions[quote.quoteID!] || quote.currentVersion}
                        onChange={(e) => {
                          setSelectedVersions(prev => ({
                            ...prev,
                            [quote.quoteID!]: parseInt(e.target.value)
                          }));
                        }}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#000',
                          color: '#0f0',
                          border: '1px solid #0f0',
                          cursor: 'pointer',
                          fontFamily: 'monospace'
                        }}
                      >
                        {Array.from({ length: quote.currentVersion }, (_, i) => i + 1).reverse().map(version => (
                          <option key={version} value={version}>
                            v{version}{version === quote.currentVersion ? ' (Latest)' : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>v{quote.currentVersion}</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ color: getStatusColor(quote.status), fontWeight: 'bold' }}>
                      {quote.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {new Date(quote.createdDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        const version = selectedVersions[quote.quoteID!] || quote.currentVersion;
                        navigate(`/quotes/${quote.quoteID}?version=${version}`);
                      }}
                      style={{ padding: '5px 10px', backgroundColor: '#000', color: '#0f0', border: '1px solid #0f0', cursor: 'pointer', marginRight: '5px' }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(quote.quoteID!)}
                      style={{ padding: '5px 10px', backgroundColor: '#000', color: '#f00', border: '1px solid #f00', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #0f0', display: 'flex', gap: '30px' }}>
        <div>
          <strong>Total Quotes:</strong> {filteredQuotes.length}
        </div>
        <div>
          <strong>Total Value:</strong> ${filteredQuotes.reduce((sum, q) => sum + q.totalCost, 0).toFixed(2)}
        </div>
        <div>
          <strong>Draft:</strong> {filteredQuotes.filter(q => q.status === 'Draft').length}
        </div>
        <div>
          <strong>Sent:</strong> {filteredQuotes.filter(q => q.status === 'Sent').length}
        </div>
        <div>
          <strong>Approved:</strong> {filteredQuotes.filter(q => q.status === 'Approved').length}
        </div>
      </div>
    </div>
  );
};

export default QuoteList;
