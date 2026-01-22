import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';

const Opportunities = ({ user }) => {
  const [opportunities, setOpportunities] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientCompanyName: '',
    clientContactName: '',
    clientEmail: '',
    clientPhone: '',
    designation: '',
    location: '',
    opportunityType: 'Training',
    serviceCategory: 'Corporate',
    expectedParticipants: '',
    expectedDuration: '',
    expectedStartDate: '',
    expectedCommercialValue: '',
    notes: ''
  });

  useEffect(() => {
    fetchOpportunities();
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

  const fetchOpportunities = async () => {
    try {
      const response = await api.get('/opportunities');
      setOpportunities(response.data);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/opportunities', formData);
      setShowForm(false);
      setFormData({
        clientCompanyName: '',
        clientContactName: '',
        clientEmail: '',
        clientPhone: '',
        designation: '',
        location: '',
        opportunityType: 'Training',
        serviceCategory: 'Enterprise',
        expectedParticipants: '',
        expectedDuration: '',
        expectedStartDate: '',
        expectedCommercialValue: '',
        notes: ''
      });
      fetchOpportunities();
      fetchDropdownOptions();
    } catch (error) {
      console.error('Error creating opportunity:', error);
    }
  };

  const handleQualify = async (id) => {
    try {
      await api.put(`/opportunities/${id}`, { opportunityStatus: 'Qualified' });
      fetchOpportunities();
    } catch (error) {
      console.error('Error qualifying opportunity:', error);
    }
  };

  const handleSendToDelivery = async (id) => {
    try {
      await api.put(`/opportunities/${id}/send-to-delivery`);
      fetchOpportunities();
    } catch (error) {
      console.error('Error sending to delivery:', error);
    }
  };

  const [lostReason, setLostReason] = useState('');
  const [showLostForm, setShowLostForm] = useState(null);

  const handleMarkLost = async (id) => {
    if (!lostReason.trim()) {
      return;
    }
    try {
      await api.put(`/opportunities/${id}/lost`, { lostReason });
      setShowLostForm(null);
      setLostReason('');
      fetchOpportunities();
    } catch (error) {
      console.error('Error marking as lost:', error);
    }
  };

  const handleDownload = async (id, opportunityId) => {
    try {
      const response = await api.get(`/opportunities/${id}/download`, {
        responseType: 'blob'
      });

      // Check if response is actually a PDF blob
      if (response.data && response.data instanceof Blob) {
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Adhoc-${opportunityId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        // Clean up the object URL after a short delay
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      } else {
        throw new Error('Invalid PDF response');
      }
    } catch (error) {
      if (error.response?.status === 403) {
        alert('Access denied. You do not have permission to download this PDF.');
      } else if (error.response?.status === 404) {
        alert('Opportunity not found.');
      } else if (error.response?.status === 400) {
        alert('Opportunity is incomplete and cannot be downloaded.');
      } else {
        alert('Error downloading PDF. Please try again.');
      }
      console.error('Error downloading PDF:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Opportunities</h1>
        {user.role === 'Business Head' && user.subRole === 'SalesExecutive' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : 'Create Opportunity'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-card">
          <h2>Create Opportunity</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Client Company Name</label>
              <input
                type="text"
                value={formData.clientCompanyName}
                onChange={(e) => setFormData({ ...formData, clientCompanyName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Client Contact Name</label>
              <input
                type="text"
                value={formData.clientContactName}
                onChange={(e) => setFormData({ ...formData, clientContactName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Client Email</label>
              <input
                type="email"
                value={formData.clientEmail}
                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                placeholder="example@gmail.com or corporate@company.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Client Phone</label>
              <input
                type="text"
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                placeholder="Enter phone number (10+ digits accepted)"
                required
              />
            </div>
            <div className="form-group">
              <label>Designation</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Opportunity Type</label>
              <select
                value={formData.opportunityType}
                onChange={(e) => setFormData({ ...formData, opportunityType: e.target.value })}
                required
              >
                <option value="">Select Opportunity Type</option>
                {dropdownOptions.opportunityType?.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Service Category</label>
              <select
                value={formData.serviceCategory}
                onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })}
                required
              >
                <option value="">Select Service Category</option>
                {dropdownOptions.serviceCategory?.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Expected Participants</label>
              <input
                type="number"
                value={formData.expectedParticipants}
                onChange={(e) => setFormData({ ...formData, expectedParticipants: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Expected Duration (Days)</label>
              <input
                type="number"
                value={formData.expectedDuration}
                onChange={(e) => setFormData({ ...formData, expectedDuration: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Expected Start Date</label>
              <input
                type="date"
                value={formData.expectedStartDate}
                onChange={(e) => setFormData({ ...formData, expectedStartDate: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Expected Commercial Value (₹)</label>
              <input
                type="number"
                value={formData.expectedCommercialValue}
                onChange={(e) => setFormData({ ...formData, expectedCommercialValue: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Notes (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
              />
            </div>
          </div>
          <button type="submit" className="btn-primary">Create Opportunity</button>
        </form>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Adhoc ID</th>
              <th>Client Company</th>
              <th>Contact</th>
              <th>Type</th>
              <th>Category</th>
              <th>Value</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map(opp => (
              <tr key={opp._id}>
                <td><strong>{opp.opportunityId}</strong></td>
                <td>{opp.clientCompanyName}</td>
                <td>{opp.clientContactName}</td>
                <td>{opp.opportunityType}</td>
                <td>{opp.serviceCategory}</td>
                <td>₹{opp.expectedCommercialValue?.toLocaleString()}</td>
                <td><span className={`status-badge ${opp.opportunityStatus.toLowerCase().replace(/\s+/g, '-')}`}>{opp.opportunityStatus}</span></td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => window.location.href = `/opportunities/${opp._id}`}
                      className="btn-small btn-primary"
                    >
                      View
                    </button>
                    {user.role === 'Sales Manager' && opp.opportunityStatus === 'New' && (
                      <button onClick={() => handleQualify(opp._id)} className="btn-small btn-success">Qualify</button>
                    )}
                    {user.role === 'Sales Manager' && opp.opportunityStatus === 'Qualified' && (
                      <button onClick={() => handleSendToDelivery(opp._id)} className="btn-small btn-secondary">Send to Delivery</button>
                    )}
                    {user.role === 'Sales Manager' && ['New', 'Qualified'].includes(opp.opportunityStatus) && (
                      <>
                        {showLostForm === opp._id ? (
                          <div className="lost-form-group">
                            <input
                              type="text"
                              value={lostReason}
                              onChange={(e) => setLostReason(e.target.value)}
                              placeholder="Reason for loss"
                              className="lost-reason-input"
                            />
                            <button onClick={() => handleMarkLost(opp._id)} className="btn-small btn-danger">Confirm</button>
                            <button onClick={() => { setShowLostForm(null); setLostReason(''); }} className="btn-small btn-secondary">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setShowLostForm(opp._id)} className="btn-small btn-danger">Mark Lost</button>
                        )}
                      </>
                    )}
                    {['Sent to Delivery', 'Converted to Deal'].includes(opp.opportunityStatus) && (
                      <button onClick={() => handleDownload(opp._id, opp.opportunityId)} className="btn-small btn-secondary">Download PDF</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Opportunities;
