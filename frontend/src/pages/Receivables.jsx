import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';

const Receivables = ({ user }) => {
  const [receivables, setReceivables] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    invoiceId: '',
    paymentTerms: '30',
    lateFeePerDay: '0'
  });

  useEffect(() => {
    fetchReceivables();
    fetchInvoices();
  }, []);

  const fetchReceivables = async () => {
    try {
      const response = await api.get('/receivables');
      setReceivables(response.data);
    } catch (error) {
      console.error('Error fetching receivables:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/receivables', formData);
      setShowForm(false);
      setFormData({
        invoiceId: '',
        paymentTerms: '30',
        lateFeePerDay: '0'
      });
      fetchReceivables();
    } catch (error) {
      console.error('Error creating receivable:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">Receivables</h1>
        {user.role === 'Finance Manager' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : 'Add Receivable'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-card">
          <h2>Add Receivable</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Invoice</label>
              <select value={formData.invoiceId} onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })} required>
                <option value="">Select Invoice</option>
                {invoices.map(invoice => (
                  <option key={invoice._id} value={invoice._id}>{invoice.clientInvoiceNumber} - {invoice.clientName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Payment Terms (Days)</label>
              <input type="number" value={formData.paymentTerms} onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Late Fee Per Day</label>
              <input type="number" value={formData.lateFeePerDay} onChange={(e) => setFormData({ ...formData, lateFeePerDay: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn-primary">Create Receivable</button>
        </form>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Outstanding</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {receivables.map(rec => (
              <tr key={rec._id}>
                <td>{rec.invoiceNumber}</td>
                <td>{rec.clientName}</td>
                <td>₹{rec.invoiceAmount.toLocaleString()}</td>
                <td>₹{rec.outstandingAmount.toLocaleString()}</td>
                <td>{new Date(rec.dueDate).toLocaleDateString()}</td>
                <td><span className={`status-badge ${rec.status.toLowerCase().replace(' ', '-')}`}>{rec.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Receivables;
