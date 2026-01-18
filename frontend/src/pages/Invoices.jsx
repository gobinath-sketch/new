import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';

const Invoices = ({ user }) => {
  const [invoices, setInvoices] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    programId: '',
    clientName: '',
    invoiceAmount: '',
    gstType: 'IGST',
    gstPercent: '18',
    sacCode: '',
    tdsPercent: '0',
    status: 'Draft'
  });

  useEffect(() => {
    fetchInvoices();
    fetchPrograms();
    fetchDropdownOptions();
  }, []);

  useEffect(() => {
    // Auto-determine GST Type based on location if program is selected
    if (formData.programId) {
      const program = programs.find(p => p._id === formData.programId);
      if (program && program.location) {
        // Simple logic: if location contains state name, use CGST+SGST, else IGST
        // For now, default to IGST (inter-state)
        // In production, this would check against a state master
        if (formData.gstType === 'IGST' || formData.gstType === '') {
          // Keep current or set default
        }
      }
    }
  }, [formData.programId, programs]);

  const fetchDropdownOptions = async () => {
    try {
      const response = await api.get('/dropdown-options');
      setDropdownOptions(response.data);
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await api.get('/programs');
      setPrograms(response.data.filter(p => p.clientSignOff));
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const program = programs.find(p => p._id === formData.programId);
      await api.post('/invoices', {
        ...formData,
        clientName: program?.clientName || formData.clientName,
        invoiceDate: new Date().toISOString()
      });
      setShowForm(false);
      setFormData({
        programId: '',
        clientName: '',
        invoiceAmount: '',
        gstType: 'IGST',
        gstPercent: '18',
        sacCode: '',
        tdsPercent: '0',
        status: 'Draft'
      });
      fetchInvoices();
      fetchDropdownOptions();
    } catch (error) {
      console.error('Error creating invoice:', error);
      // Error will be handled by form validation or backend response
      const errorMsg = error.response?.data?.error || 'Error creating invoice. Please check all fields and try again.';
      // In a production app, this would use a toast/notification system
      // For now, we rely on backend validation and form error states
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">Invoices</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Generate Invoice'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-card">
          <h2>Generate Invoice</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Program</label>
              <select value={formData.programId} onChange={(e) => {
                const program = programs.find(p => p._id === e.target.value);
                setFormData({ 
                  ...formData, 
                  programId: e.target.value,
                  clientName: program?.clientName || formData.clientName,
                  sacCode: program?.sacCode || formData.sacCode
                });
              }} required>
                <option value="">Select Program</option>
                {programs.map(program => (
                  <option key={program._id} value={program._id}>{program.programName} - {program.clientName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Client Name</label>
              <input type="text" value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Invoice Amount</label>
              <input type="number" value={formData.invoiceAmount} onChange={(e) => setFormData({ ...formData, invoiceAmount: e.target.value })} step="any" required />
            </div>
            <div className="form-group">
              <label>GST Type</label>
              <select 
                value={formData.gstType} 
                onChange={(e) => setFormData({ ...formData, gstType: e.target.value })}
                required
              >
                <option value="">Select GST Type</option>
                {dropdownOptions.gstType?.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>GST %</label>
              <input 
                type="number" 
                value={formData.gstPercent} 
                onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })} 
                required 
              />
            </div>
            <div className="form-group">
              <label>SAC Code</label>
              <input 
                type="text" 
                value={formData.sacCode} 
                onChange={(e) => setFormData({ ...formData, sacCode: e.target.value })} 
                required 
                readOnly={user.role === 'Finance Manager'}
                style={user.role === 'Finance Manager' ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              />
            </div>
            <div className="form-group">
              <label>TDS %</label>
              <input 
                type="number" 
                value={formData.tdsPercent} 
                onChange={(e) => setFormData({ ...formData, tdsPercent: e.target.value })} 
                readOnly={user.role === 'Finance Manager'}
                style={user.role === 'Finance Manager' ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              />
              {user.role === 'Finance Manager' && (
                <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
                  TDS is system-calculated
                </small>
              )}
            </div>
            <div className="form-group">
              <label>Invoice Status</label>
              <select 
                value={formData.status} 
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              >
                <option value="">Select Status</option>
                {dropdownOptions.invoiceStatus?.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary">Generate Invoice</button>
        </form>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Total</th>
              <th>IRN</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(invoice => (
              <tr key={invoice._id}>
                <td>{invoice.clientInvoiceNumber}</td>
                <td>{invoice.clientName}</td>
                <td>₹{invoice.invoiceAmount.toLocaleString()}</td>
                <td>₹{invoice.totalAmount.toLocaleString()}</td>
                <td>{invoice.irnNumber || '-'}</td>
                <td><span className={`status-badge ${invoice.status.toLowerCase()}`}>{invoice.status}</span></td>
                <td>
                  <button 
                    onClick={() => {
                      const details = `
INVOICE DETAILS

Invoice Number: ${invoice.clientInvoiceNumber}
Client Name: ${invoice.clientName || 'N/A'}
Deal ID: ${invoice.dealId?.dealId || 'N/A'}
Invoice Date: ${invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A'}
Invoice Amount: ₹${invoice.invoiceAmount?.toLocaleString() || 0}
GST Amount: ₹${invoice.gstAmount?.toLocaleString() || 0}
Total Amount: ₹${invoice.totalAmount?.toLocaleString() || 0}
TDS Amount: ₹${invoice.tdsAmount?.toLocaleString() || 0}
Net Receivable: ₹${invoice.netReceivable?.toLocaleString() || 0}
IRN Number: ${invoice.irnNumber || 'N/A'}
Status: ${invoice.status || 'N/A'}
Created Date: ${new Date(invoice.createdAt).toLocaleString()}
                      `;
                      alert(details);
                    }}
                    className="btn-small"
                    style={{ backgroundColor: '#007bff', color: 'white' }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Invoices;
