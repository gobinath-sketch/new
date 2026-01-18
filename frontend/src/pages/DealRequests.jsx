import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';

const DealRequests = ({ user }) => {
  const [dealRequests, setDealRequests] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    offeringType: 'Training',
    expectedStartDate: '',
    expectedEndDate: '',
    expectedRevenue: ''
  });

  useEffect(() => {
    fetchDealRequests();
    fetchDropdownOptions();
  }, []);

  const fetchDropdownOptions = async () => {
    try {
      const response = await api.get('/dropdown-options');
      setDropdownOptions(response.data);
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
    }
  };

  const fetchDealRequests = async () => {
    try {
      const response = await api.get('/deal-requests');
      setDealRequests(response.data);
    } catch (error) {
      console.error('Error fetching deal requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/deal-requests', formData);
      setShowForm(false);
      setFormData({
        clientName: '',
        offeringType: 'Training',
        expectedStartDate: '',
        expectedEndDate: '',
        expectedRevenue: ''
      });
      fetchDealRequests();
      fetchDropdownOptions();
    } catch (error) {
      console.error('Error creating deal request:', error);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await api.put(`/deal-requests/${id}/acknowledge`, { action: 'acknowledge' });
      fetchDealRequests();
    } catch (error) {
      console.error('Error acknowledging:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">Deal Requests</h1>
        {user.role === 'Business Head' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : 'Create Deal Request'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-card">
          <h2>Create Deal Request</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Client Name</label>
              <input type="text" value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Offering Type</label>
              <select 
                value={formData.offeringType} 
                onChange={(e) => setFormData({ ...formData, offeringType: e.target.value })}
                required
              >
                <option value="">Select Offering Type</option>
                {dropdownOptions.offeringType?.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Expected Start Date</label>
              <input type="date" value={formData.expectedStartDate} onChange={(e) => setFormData({ ...formData, expectedStartDate: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Expected End Date</label>
              <input type="date" value={formData.expectedEndDate} onChange={(e) => setFormData({ ...formData, expectedEndDate: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Expected Revenue</label>
              <input type="number" value={formData.expectedRevenue} onChange={(e) => setFormData({ ...formData, expectedRevenue: e.target.value })} required />
            </div>
          </div>
          <button type="submit" className="btn-primary">Create Deal Request</button>
        </form>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Deal ID</th>
              <th>Client</th>
              <th>Offering</th>
              <th>Expected Revenue</th>
              <th>Approval Status</th>
              <th>Ops Status</th>
              {user.role === 'Operations Manager' && <th>Action</th>}
              {user.role === 'Business Head' && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {dealRequests.map(deal => (
              <tr key={deal._id}>
                <td>{deal.dealId}</td>
                <td>{deal.clientName}</td>
                <td>{deal.offeringType}</td>
                <td>₹{deal.expectedRevenue.toLocaleString()}</td>
                <td><span className={`status-badge ${deal.dealApprovalStatus.toLowerCase()}`}>{deal.dealApprovalStatus}</span></td>
                <td><span className={`status-badge ${deal.opsAcknowledgementStatus.toLowerCase().replace(' ', '-')}`}>{deal.opsAcknowledgementStatus}</span></td>
                {user.role === 'Operations Manager' && deal.dealApprovalStatus === 'Approved' && deal.opsAcknowledgementStatus === 'Pending' && (
                  <td>
                    <button onClick={() => handleAcknowledge(deal._id)} className="btn-small">Acknowledge</button>
                  </td>
                )}
                {user.role === 'Business Head' && deal.dealApprovalStatus === 'Pending' && (
                  <td>
                    <button onClick={async () => {
                      try {
                        await api.put(`/deal-requests/${deal._id}/approve`);
                        fetchDealRequests();
                      } catch (error) {
                        console.error('Error approving:', error);
                      }
                    }} className="btn-small">Approve</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DealRequests;
