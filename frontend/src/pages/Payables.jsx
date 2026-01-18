import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';

const Payables = ({ user }) => {
  const [payables, setPayables] = useState([]);
  const [pos, setPos] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    purchaseOrderId: '',
    paymentTerms: '30',
    paymentMode: 'NEFT',
    status: 'Pending',
    reconciliationStatus: 'Pending'
  });

  useEffect(() => {
    fetchPayables();
    fetchPOs();
    fetchDropdownOptions();
  }, []);

  const fetchDropdownOptions = async () => {
    try {
      const response = await api.get('/dropdown-options');
      setDropdownOptions(response.data);
      if (response.data.purchaseOrders) {
        setPos(response.data.purchaseOrders);
      }
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
    }
  };

  const fetchPayables = async () => {
    try {
      const response = await api.get('/payables');
      setPayables(response.data);
    } catch (error) {
      console.error('Error fetching payables:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payables', formData);
      setShowForm(false);
      setFormData({
        purchaseOrderId: '',
        paymentTerms: '30',
        paymentMode: 'NEFT',
        status: 'Pending',
        reconciliationStatus: 'Pending'
      });
      fetchPayables();
      fetchDropdownOptions();
    } catch (error) {
      console.error('Error creating payable:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">Payables</h1>
        {user.role === 'Finance Manager' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : 'Add Payable'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-card">
          <h2>Add Payable</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Purchase Order</label>
              <select value={formData.purchaseOrderId} onChange={(e) => setFormData({ ...formData, purchaseOrderId: e.target.value })} required>
                <option value="">Select PO</option>
                {pos.map(po => (
                  <option key={po._id} value={po._id}>{po.internalPONumber}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Payment Terms (Days)</label>
              <input 
                type="number" 
                value={formData.paymentTerms} 
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Payment Mode</label>
              <select 
                value={formData.paymentMode} 
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                required
              >
                <option value="">Select Payment Mode</option>
                {dropdownOptions.paymentMode?.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Payment Status</label>
              <select 
                value={formData.status} 
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              >
                <option value="">Select Payment Status</option>
                {dropdownOptions.paymentStatus?.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Reconciliation Status</label>
              <select 
                value={formData.reconciliationStatus} 
                onChange={(e) => setFormData({ ...formData, reconciliationStatus: e.target.value })}
                required
              >
                <option value="">Select Reconciliation Status</option>
                {dropdownOptions.reconciliationStatus?.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary">Create Payable</button>
        </form>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Payout Reference</th>
              <th>Vendor</th>
              <th>Amount</th>
              <th>Outstanding</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payables.map(payable => (
              <tr key={payable._id}>
                <td>{payable.vendorPayoutReference}</td>
                <td>{payable.vendorName}</td>
                <td>₹{payable.adjustedPayableAmount.toLocaleString()}</td>
                <td>₹{payable.outstandingAmount.toLocaleString()}</td>
                <td><span className={`status-badge ${payable.status.toLowerCase().replace(' ', '-')}`}>{payable.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payables;
