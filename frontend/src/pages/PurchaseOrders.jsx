import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';
import VendorForm from '../components/VendorForm';

const PurchaseOrders = ({ user }) => {
  const [activeTab, setActiveTab] = useState('vendor'); // Default to vendor because that was the original page content
  const [pos, setPos] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [deals, setDeals] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showPOForm, setShowPOForm] = useState(false);
  const [showVendorForm, setShowVendorForm] = useState(false);
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

  const handleCreatePO = async (e) => {
    e.preventDefault();
    try {
      await api.post('/purchase-orders', formData);
      setShowPOForm(false);
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
    }
  };

  const handleVendorCreated = () => {
    setShowVendorForm(false);
    fetchDropdownOptions(); // Refresh vendors list
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start', marginBottom: '24px' }}>
        <h1 className="page-title">Purchase Orders</h1>

        {/* Toggle Switch */}
        <div style={{ display: 'flex', background: '#f3f4f6', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setActiveTab('client')}
            style={{
              padding: '8px 24px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'client' ? 'white' : 'transparent',
              color: activeTab === 'client' ? '#6366f1' : '#6b7280',
              fontWeight: activeTab === 'client' ? '600' : '500',
              boxShadow: activeTab === 'client' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Client
          </button>
          <button
            onClick={() => setActiveTab('vendor')}
            style={{
              padding: '8px 24px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'vendor' ? 'white' : 'transparent',
              color: activeTab === 'vendor' ? '#6366f1' : '#6b7280',
              fontWeight: activeTab === 'vendor' ? '600' : '500',
              boxShadow: activeTab === 'vendor' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Vendor
          </button>
        </div>
      </div>

      {activeTab === 'client' ? (
        // CLIENT TAB - FILE UPLOAD
        <div className="upload-container" style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          border: '2px dashed #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '16px', color: '#6366f1' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Upload Client Purchase Order</h3>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>Drag and drop your file here, or click to browse</p>
          <button className="btn-primary">Select File</button>
        </div>
      ) : (
        // VENDOR TAB - EXISTING FUNCTIONALITY + VENDOR CREATION
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '24px' }}>
            {['Operations Manager', 'Finance Manager', 'Director'].includes(user.role) && (
              <>
                <button
                  onClick={() => {
                    setShowVendorForm(!showVendorForm);
                    setShowPOForm(false);
                  }}
                  className="btn-secondary"
                >
                  {showVendorForm ? 'Cancel Vendor' : 'Create Vendor'}
                </button>
                <button
                  onClick={() => {
                    setShowPOForm(!showPOForm);
                    setShowVendorForm(false);
                  }}
                  className="btn-primary"
                >
                  {showPOForm ? 'Cancel PO' : 'Create PO'}
                </button>
              </>
            )}
          </div>

          {showVendorForm && ['Operations Manager', 'Finance Manager', 'Director'].includes(user.role) && (
            <VendorForm
              user={user}
              onSuccess={handleVendorCreated}
              onCancel={() => setShowVendorForm(false)}
            />
          )}

          {showPOForm && (
            <form onSubmit={handleCreatePO} className="form-card">
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
                {['Operations Manager', 'Finance Manager', 'Director'].includes(user.role) && (
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
        </>
      )}
    </div>
  );
};

export default PurchaseOrders;
