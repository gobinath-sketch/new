import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';

const PurchaseOrders = ({ user }) => {
  const [pos, setPos] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [deals, setDeals] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    vendorId: '',
    dealId: '',
    approvedCost: '',
    status: 'Draft'
  });

  useEffect(() => {
    fetchPOs();
    fetchDropdownOptions();
  }, []);

  useEffect(() => {
    if (formData.vendorId) {
      fetchDealsForVendor();
    } else {
      setDeals([]);
    }
  }, [formData.vendorId]);

  const fetchDropdownOptions = async () => {
    try {
      const response = await api.get('/dropdown-options');
      setDropdownOptions(response.data);
      if (response.data.vendors) {
        setVendors(response.data.vendors);
      }
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
    }
  };

  const fetchDealsForVendor = async () => {
    try {
      const response = await api.get('/dropdown-options');
      if (response.data.deals) {
        // Filter deals - for now show all approved deals
        // In production, this could filter by vendor association
        setDeals(response.data.deals.filter(d => d.approvalStatus === 'Approved'));
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  const fetchPOs = async () => {
    try {
      const response = await api.get('/purchase-orders');
      setPos(response.data);
    } catch (error) {
      console.error('Error fetching POs:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/purchase-orders', formData);
      setShowForm(false);
      setFormData({
        vendorId: '',
        dealId: '',
        approvedCost: '',
        status: 'Draft'
      });
      fetchPOs();
      fetchDropdownOptions();
    } catch (error) {
      console.error('Error creating PO:', error);
      // Error will be handled by form validation or backend response
      const errorMsg = error.response?.data?.error || 'Error creating PO. Please check all fields and try again.';
      // In a production app, this would use a toast/notification system
      // For now, we rely on backend validation and form error states
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">Purchase Orders</h1>
        {user.role === 'Operations Manager' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : 'Create PO'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-card">
          <h2>Create Purchase Order</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Vendor</label>
              <select 
                value={formData.vendorId} 
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    vendorId: e.target.value,
                    dealId: '' // Reset deal when vendor changes
                  });
                }} 
                required
              >
                <option value="">Select Vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor._id} value={vendor._id}>{vendor.vendorName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Deal</label>
              <select 
                value={formData.dealId} 
                onChange={(e) => setFormData({ ...formData, dealId: e.target.value })} 
                required
                disabled={!formData.vendorId}
              >
                <option value="">{formData.vendorId ? 'Select Deal' : 'Select Vendor First'}</option>
                {deals.map(deal => (
                  <option key={deal._id} value={deal._id}>{deal.dealId} - {deal.clientName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Approved Cost</label>
              <input 
                type="number" 
                value={formData.approvedCost} 
                onChange={(e) => setFormData({ ...formData, approvedCost: e.target.value })} 
                required 
              />
            </div>
            {user.role === 'Operations Manager' && (
              <div className="form-group">
                <label>PO Status</label>
                <select 
                  value={formData.status} 
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                >
                  <option value={formData.status}>{formData.status}</option>
                </select>
                <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
                  Status is system-controlled
                </small>
              </div>
            )}
          </div>
          <button type="submit" className="btn-primary">Create PO</button>
        </form>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Vendor</th>
              <th>Approved Cost</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pos.map(po => (
              <tr key={po._id}>
                <td>{po.internalPONumber}</td>
                <td>{po.vendorId?.vendorName || '-'}</td>
                <td>₹{po.approvedCost.toLocaleString()}</td>
                <td><span className={`status-badge ${po.status.toLowerCase()}`}>{po.status}</span></td>
                <td>
                  <button 
                    onClick={() => {
                      const details = `
PURCHASE ORDER DETAILS

PO Number: ${po.internalPONumber}
Vendor: ${po.vendorId?.vendorName || 'N/A'}
Deal: ${po.dealId?.dealId || 'N/A'}
Approved Cost: ₹${po.approvedCost.toLocaleString()}
Status: ${po.status}
Created Date: ${new Date(po.createdAt).toLocaleString()}
${po.updatedAt ? `Last Updated: ${new Date(po.updatedAt).toLocaleString()}` : ''}
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

export default PurchaseOrders;
