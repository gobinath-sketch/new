import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';
import { useModal } from '../contexts/context/ModalContext.jsx';

const Deals = ({ user }) => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const modal = useModal();
  const [formData, setFormData] = useState({
    opportunityId: '',
    clientName: '',
    totalOrderValue: '',
    trainerCost: '',
    labCost: '',
    logisticsCost: '',
    contentCost: '',
    contingencyBuffer: ''
  });

  useEffect(() => {
    fetchDeals();
    if (user.role === 'Operations Manager') {
      fetchOpportunities();
    }
    fetchDropdownOptions();
  }, [user]);

  const fetchDeals = async () => {
    try {
      const response = await api.get('/deals');
      setDeals(response.data);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const response = await api.get('/opportunities/for-delivery');
      setOpportunities(response.data);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    }
  };

  const fetchDropdownOptions = async () => {
    try {
      const response = await api.get('/dropdown-options');
      setDropdownOptions(response.data);
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
    }
  };

  const handleOpportunitySelect = (opportunityId) => {
    const opportunity = opportunities.find(o => o._id === opportunityId);
    if (opportunity) {
      setFormData({
        ...formData,
        opportunityId: opportunityId,
        clientName: opportunity.clientCompanyName,
        totalOrderValue: opportunity.expectedCommercialValue || ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/deals', formData);
      setShowForm(false);
      setFormData({
        opportunityId: '',
        clientName: '',
        totalOrderValue: '',
        trainerCost: '',
        labCost: '',
        logisticsCost: '',
        contentCost: '',
        contingencyBuffer: ''
      });
      fetchDeals();
    } catch (error) {
      console.error('Error creating deal:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">Deals & Pricing</h1>
        {(user.role === 'Business Head' || user.role === 'Operations Manager') && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : 'Add Deal'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-card">
          <h2>Add Deal</h2>
          <div className="form-grid">
            {user.role === 'Operations Manager' && opportunities.length > 0 && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Select Opportunity (Optional)</label>
                <select 
                  value={formData.opportunityId} 
                  onChange={(e) => handleOpportunitySelect(e.target.value)}
                >
                  <option value="">Select Opportunity</option>
                  {opportunities.map(opp => (
                    <option key={opp._id} value={opp._id}>
                      {opp.opportunityId} - {opp.clientCompanyName} - ₹{opp.expectedCommercialValue?.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Client Name</label>
              <input type="text" value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Total Order Value</label>
              <input type="number" value={formData.totalOrderValue} onChange={(e) => setFormData({ ...formData, totalOrderValue: e.target.value })} step="any" required />
            </div>
            <div className="form-group">
              <label>Trainer Cost</label>
              <input type="number" value={formData.trainerCost} onChange={(e) => setFormData({ ...formData, trainerCost: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Lab Cost</label>
              <input type="number" value={formData.labCost} onChange={(e) => setFormData({ ...formData, labCost: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Logistics Cost</label>
              <input type="number" value={formData.logisticsCost} onChange={(e) => setFormData({ ...formData, logisticsCost: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Content Cost</label>
              <input type="number" value={formData.contentCost} onChange={(e) => setFormData({ ...formData, contentCost: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Contingency Buffer</label>
              <input type="number" value={formData.contingencyBuffer} onChange={(e) => setFormData({ ...formData, contingencyBuffer: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn-primary">Create Deal</button>
        </form>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Deal ID</th>
              <th>Client</th>
              <th>Order Value</th>
              <th>Margin %</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deals.map(deal => (
              <tr key={deal._id}>
                <td>{deal.dealId}</td>
                <td>{deal.clientName}</td>
                <td>₹{deal.totalOrderValue.toLocaleString()}</td>
                <td>{deal.grossMarginPercent.toFixed(2)}%</td>
                <td><span className={`status-badge ${deal.approvalStatus.toLowerCase()}`}>{deal.approvalStatus}</span></td>
                <td>
                  <button 
                    onClick={() => {
                      modal.alert({
                        title: 'Deal Details',
                        okText: 'Close',
                        type: 'info',
                        containerClassName: 'modal-wide',
                        message: (
                          <div className="modal-scroll-area">
                            <h4 className="modal-section-title">Summary</h4>
                            <div className="modal-kv-grid">
                              <div className="modal-kv-label">Deal ID</div>
                              <div className="modal-kv-value">{deal.dealId || 'N/A'}</div>

                              <div className="modal-kv-label">Client</div>
                              <div className="modal-kv-value">{deal.clientName || 'N/A'}</div>

                              <div className="modal-kv-label">Adhoc ID</div>
                              <div className="modal-kv-value">{deal.opportunityId || 'N/A'}</div>

                              <div className="modal-kv-label">Approval Status</div>
                              <div className="modal-kv-value">{deal.approvalStatus || 'N/A'}</div>
                            </div>

                            <div style={{ height: '16px' }} />

                            <h4 className="modal-section-title">Financials</h4>
                            <div className="modal-kv-grid">
                              <div className="modal-kv-label">Total Order Value</div>
                              <div className="modal-kv-value">₹{(deal.totalOrderValue || 0).toLocaleString()}</div>

                              <div className="modal-kv-label">Total Cost</div>
                              <div className="modal-kv-value">₹{(deal.totalCost || 0).toLocaleString()}</div>

                              <div className="modal-kv-label">Gross Margin %</div>
                              <div className="modal-kv-value">{(deal.grossMarginPercent || 0).toFixed(2)}%</div>

                              <div className="modal-kv-label">Gross Margin Amount</div>
                              <div className="modal-kv-value">₹{(deal.grossMarginAmount || 0).toLocaleString()}</div>
                            </div>

                            <div style={{ height: '16px' }} />

                            <h4 className="modal-section-title">Audit</h4>
                            <div className="modal-kv-grid">
                              <div className="modal-kv-label">Approved By</div>
                              <div className="modal-kv-value">{deal.approvedBy || 'N/A'}</div>

                              <div className="modal-kv-label">Approved At</div>
                              <div className="modal-kv-value">{deal.approvedAt ? new Date(deal.approvedAt).toLocaleString() : 'N/A'}</div>

                              <div className="modal-kv-label">Created Date</div>
                              <div className="modal-kv-value">{deal.createdAt ? new Date(deal.createdAt).toLocaleString() : 'N/A'}</div>
                            </div>
                          </div>
                        )
                      });
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

export default Deals;
