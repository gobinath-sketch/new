import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';

const Governance = ({ user }) => {
  const [audits, setAudits] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('audit');
  const [approvalData, setApprovalData] = useState({});

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAudits();
    } else {
      fetchAlerts();
    }
    if (user.role === 'Director') {
      fetchDropdownOptions();
    }
  }, [activeTab, user.role]);

  const fetchDropdownOptions = async () => {
    try {
      const response = await api.get('/dropdown-options');
      setDropdownOptions(response.data);
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAudits();
    } else {
      fetchAlerts();
    }
  }, [activeTab]);

  const fetchAudits = async () => {
    try {
      const response = await api.get('/governance/audit-trail');
      setAudits(response.data.audits);
    } catch (error) {
      console.error('Error fetching audits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/governance/risk-alerts');
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="page-title">Governance & Risk</h1>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--color-border)' }}>
        <button
          onClick={() => setActiveTab('audit')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'audit' ? '2px solid var(--color-accent)' : '2px solid transparent',
            color: activeTab === 'audit' ? 'var(--color-accent)' : 'var(--color-charcoal-light)',
            cursor: 'pointer',
            fontWeight: activeTab === 'audit' ? 500 : 400
          }}
        >
          Audit Trail
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'alerts' ? '2px solid var(--color-accent)' : '2px solid transparent',
            color: activeTab === 'alerts' ? 'var(--color-accent)' : 'var(--color-charcoal-light)',
            cursor: 'pointer',
            fontWeight: activeTab === 'alerts' ? 500 : 400
          }}
        >
          Risk Alerts
        </button>
      </div>

      {activeTab === 'audit' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {audits.map(audit => (
                <tr key={audit._id}>
                  <td>{new Date(audit.timestamp).toLocaleString()}</td>
                  <td>{audit.userId?.name || '-'}</td>
                  <td>{audit.action}</td>
                  <td>{audit.entityType}</td>
                  <td>{audit.userRole}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Deal/Program</th>
                <th>Alert</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(alert => (
                <tr key={alert._id}>
                  <td>{alert.fraudAlertType}</td>
                  <td>{alert.dealId?.dealId || alert.programId?.programCode || '-'}</td>
                  <td>{alert.lossMakingProjectFlag ? 'Loss Making Project' : 'Risk Alert'}</td>
                  <td>
                    {alert.directorApprovalRequired ? (
                      user.role === 'Director' ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select
                            value={approvalData[alert._id]?.decision || ''}
                            onChange={(e) => setApprovalData({
                              ...approvalData,
                              [alert._id]: { ...approvalData[alert._id], decision: e.target.value }
                            })}
                            style={{ padding: '4px 8px', fontSize: '14px' }}
                          >
                            <option value="">Select Action</option>
                            {dropdownOptions.approvalDecision?.map(decision => (
                              <option key={decision} value={decision}>{decision}</option>
                            ))}
                          </select>
                          {approvalData[alert._id]?.decision && (
                            <button
                              onClick={async () => {
                                try {
                                  await api.put(`/governance/${alert._id}/approve`, {
                                    decision: approvalData[alert._id].decision,
                                    riskCategory: approvalData[alert._id].riskCategory || 'Margin'
                                  });
                                  fetchAlerts();
                                  setApprovalData({ ...approvalData, [alert._id]: {} });
                                } catch (error) {
                                  console.error('Error approving:', error);
                                }
                              }}
                              className="btn-small"
                            >
                              Submit
                            </button>
                          )}
                        </div>
                      ) : (
                        'Pending Approval'
                      )
                    ) : (
                      'Resolved'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Governance;
