import { useState, useEffect } from 'react';
import api from '../services/api';
import './Dashboard.css';
import SalesPipelineChart from '../components/SalesPipelineChart';
import NotificationBell from '../components/NotificationBell';

const Dashboard = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLowGPAlert, setShowLowGPAlert] = useState(false);
  const [lowGPItems, setLowGPItems] = useState([]);
  const [showLowGPList, setShowLowGPList] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [revenueTargetForm, setRevenueTargetForm] = useState({
    year: new Date().getFullYear(),
    period: 'Yearly',
    quarter: '',
    amount: ''
  });
  const [targetMessage, setTargetMessage] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        let endpoint = '';
        if (user.role === 'Operations Manager') endpoint = '/dashboards/operations';
        else if (user.role === 'Sales Executive') endpoint = '/dashboards/sales-executive';
        else if (user.role === 'Sales Manager') endpoint = '/dashboards/sales-manager';
        else if (user.role === 'Business Head') endpoint = '/dashboards/business';
        else if (user.role === 'Finance Manager') endpoint = '/dashboards/finance';
        else if (user.role === 'Director') endpoint = '/dashboards/director';

        const response = await api.get(endpoint);
        setData(response.data);

        // Check for low GP alerts - only show if not already acknowledged
        const alertKey = user.role === 'Business Head' ? 'lowGPAlertAcknowledged_BH' : 'veryLowGPAlertAcknowledged_DIR';
        const acknowledged = localStorage.getItem(alertKey);

        if (user.role === 'Business Head' && response.data.lowGPAlerts && response.data.lowGPAlerts.length > 0) {
          setLowGPItems(response.data.lowGPAlerts);
          if (!acknowledged) {
            setShowLowGPAlert(true);
          } else {
            setShowLowGPList(true);
          }
        } else if (user.role === 'Director' && response.data.veryLowGPAlerts && response.data.veryLowGPAlerts.length > 0) {
          setLowGPItems(response.data.veryLowGPAlerts);
          if (!acknowledged) {
            setShowLowGPAlert(true);
          } else {
            setShowLowGPList(true);
          }
        }
      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();

    // Auto-refresh every 5 seconds for real-time updates
    const interval = setInterval(fetchDashboard, 5000);

    return () => clearInterval(interval);
  }, [user]);

  const handleApprove = async (item) => {
    if (window.confirm(`Are you sure you want to APPROVE this opportunity/program?\n\nAdhoc ID: ${item.opportunityId || item.programName || 'N/A'}\nClient: ${item.billingClient || item.endClient || 'N/A'}\nGP: ${item.tov && item.tov > 0 ? ((item.finalGP || 0) / item.tov * 100).toFixed(2) : '0.00'}%`)) {
      if (window.confirm('Final confirmation: Approve this item?')) {
        try {
          // Update opportunity/program status
          if (item.opportunityId) {
            await api.put(`/opportunities/${item._id}`, {
              opportunityStatus: 'Approved',
              approvedBy: user.id,
              approvedAt: new Date()
            });
          } else {
            await api.put(`/programs/${item._id}`, {
              trainingStatus: 'Approved',
              approvedBy: user.id,
              approvedAt: new Date()
            });
          }
          alert('Item approved successfully!');
          // Refresh dashboard
          window.location.reload();
        } catch (error) {
          alert('Error approving item: ' + (error.response?.data?.error || error.message));
        }
      }
    }
  };

  const handleReject = async (item) => {
    const reason = window.prompt(`Enter rejection reason for:\n\nAdhoc ID: ${item.opportunityId || item.programName || 'N/A'}\nClient: ${item.billingClient || item.endClient || 'N/A'}`);
    if (reason) {
      if (window.confirm('Final confirmation: Reject this item?')) {
        try {
          // Update opportunity/program status
          if (item.opportunityId) {
            await api.put(`/opportunities/${item._id}`, {
              opportunityStatus: 'Rejected',
              rejectedBy: user.id,
              rejectedAt: new Date(),
              rejectionReason: reason
            });
          } else {
            await api.put(`/programs/${item._id}`, {
              trainingStatus: 'Rejected',
              rejectedBy: user.id,
              rejectedAt: new Date(),
              rejectionReason: reason
            });
          }
          alert('Item rejected successfully!');
          // Refresh dashboard
          window.location.reload();
        } catch (error) {
          alert('Error rejecting item: ' + (error.response?.data?.error || error.message));
        }
      }
    }
  };

  const handleSetRevenueTarget = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        year: parseInt(revenueTargetForm.year),
        period: revenueTargetForm.period,
        amount: parseFloat(revenueTargetForm.amount)
      };
      
      if (revenueTargetForm.period === 'Quarterly') {
        if (!revenueTargetForm.quarter) {
          alert('Please select a quarter for Quarterly period');
          return;
        }
        payload.quarter = parseInt(revenueTargetForm.quarter);
      }
      
      const response = await api.post('/revenue-targets', payload);
      setTargetMessage(`Revenue target set successfully! Amount: ₹${revenueTargetForm.amount.toLocaleString()}`);
      setRevenueTargetForm({
        year: new Date().getFullYear(),
        period: 'Yearly',
        quarter: '',
        amount: ''
      });
      
      // Refresh dashboard to show updated targets
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      setTargetMessage('Error setting revenue target: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  if (user.role === 'Operations Manager') {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="page-title">Operations Dashboard</h1>
          <NotificationBell user={user} />
        </div>
        <div className="dashboard-grid">
          <DashboardCard title="Today's Sessions" count={data?.todaysSessions?.length || 0} />
          <DashboardCard title="Upcoming Programs" count={data?.upcomingPrograms?.length || 0} />
          <DashboardCard title="Pending Approvals" count={data?.pendingApprovals?.length || 0} />
          <DashboardCard title="Delivery Risks" count={data?.deliveryRisks?.length || 0} />
        </div>

        {data?.pendingApprovals && data.pendingApprovals.length > 0 && (
          <div className="dashboard-section">
            <h2 className="section-title">Pending Approvals</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Program/Item Name</th>
                    <th>Client Name</th>
                    <th>Pending Items</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pendingApprovals.map((approval) => (
                    <tr key={approval._id}>
                      <td><span className="status-badge">{approval.source}</span></td>
                      <td>{approval.sourceName || approval.sourceId}</td>
                      <td>{approval.clientName || 'N/A'}</td>
                      <td>{approval.pendingItems.join(', ')}</td>
                      <td><span className="status-badge pending">Pending</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data?.opportunitiesForDelivery && data.opportunitiesForDelivery.length > 0 && (
          <div className="dashboard-section">
            <h2 className="section-title">Opportunities Sent to Delivery</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Adhoc ID</th>
                    <th>Client Company</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Expected Start</th>
                    <th>Sales Executive</th>
                  </tr>
                </thead>
                <tbody>
                  {data.opportunitiesForDelivery.map((opp) => (
                    <tr key={opp._id}>
                      <td>{opp.opportunityId}</td>
                      <td>{opp.clientCompanyName}</td>
                      <td>{opp.opportunityType}</td>
                      <td>₹{opp.expectedCommercialValue?.toLocaleString()}</td>
                      <td>{new Date(opp.expectedStartDate).toLocaleDateString()}</td>
                      <td>{opp.salesExecutiveId?.name || opp.salesManagerId?.name || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data?.recentOpportunities && data.recentOpportunities.length > 0 && (
          <div className="dashboard-section">
            <h2 className="section-title">Recent Opportunities (Real-Time)</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Adhoc ID</th>
                    <th>Client Company</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOpportunities.map((opp) => (
                    <tr key={opp._id}>
                      <td><strong>{opp.opportunityId}</strong></td>
                      <td>{opp.clientCompanyName || opp.endClient || 'N/A'}</td>
                      <td>{opp.opportunityType || opp.trainingOpportunity || 'N/A'}</td>
                      <td>₹{(opp.expectedCommercialValue || opp.tov || 0).toLocaleString()}</td>
                      <td><span className={`status-badge ${(opp.opportunityStatus || opp.trainingStatus || 'New').toLowerCase().replace(' ', '-')}`}>
                        {opp.opportunityStatus || opp.trainingStatus || 'New'}
                      </span></td>
                      <td>{opp.salesExecutiveId?.name || opp.salesManagerId?.name || 'N/A'}</td>
                      <td>{new Date(opp.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          onClick={() => window.location.href = `/opportunities/${opp._id}`}
                          className="btn-small btn-primary"
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
        )}

        {data?.aiInsight && (
          <div className="ai-insight">
            <div className="ai-insight-label">System Insight</div>
            <div className="ai-insight-text">{data.aiInsight}</div>
          </div>
        )}
      </div>
    );
  }

  if (user.role === 'Business Head') {
    return (
      <div className="dashboard">
        {showLowGPAlert && lowGPItems.length > 0 && (
          <>
            <div className="low-gp-alert-overlay" onClick={() => setShowLowGPAlert(false)} />
            <div className="low-gp-alert-popup">
              <div className="low-gp-alert-header">
                <h3 className="low-gp-alert-title">⚠️ Low GP Alert</h3>
                <button
                  onClick={() => setShowLowGPAlert(false)}
                  className="low-gp-alert-close"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="low-gp-alert-body">
                The following opportunities have GP below 15% and require your attention:
              </div>
              <ul className="low-gp-alert-list">
                {lowGPItems.map((item, idx) => {
                  const gpPercent = item.tov && item.tov > 0 ? ((item.finalGP || 0) / item.tov * 100).toFixed(2) : '0.00';
                  return (
                    <li key={idx} className="low-gp-alert-item">
                      <strong>{item.opportunityId || item.programName || 'N/A'}</strong> - {' '}
                      {item.billingClient || item.endClient || 'N/A'} - {' '}
                      GP: <span className="gp-value">{gpPercent}%</span> (₹{(item.finalGP || 0).toLocaleString()})
                    </li>
                  );
                })}
              </ul>
              <button
                onClick={() => {
                  localStorage.setItem('lowGPAlertAcknowledged_BH', 'true');
                  setShowLowGPAlert(false);
                  setShowLowGPList(true);
                }}
                className="low-gp-alert-acknowledge"
              >
                Acknowledge
              </button>
            </div>
          </>
        )}
        <div className="dashboard-header">
          <h1 className="page-title">Business Dashboard</h1>
          <NotificationBell user={user} />
        </div>
        <div className="dashboard-grid">
          <DashboardCard title="Revenue Target" value={`₹${(data?.revenueTarget || 0).toLocaleString()}`} />
          <DashboardCard title="Current Year Revenue" value={`₹${(data?.currentRevenue || 0).toLocaleString()}`} />
          <DashboardCard title="Last Year Revenue" value={`₹${(data?.lastYearRevenue || 0).toLocaleString()}`} />
          <DashboardCard title="Growth %" value={`${data?.revenueGrowth || 0}%`} />
          <DashboardCard title="Top Clients" count={data?.topClients?.length || 0} />
          <DashboardCard title="TDS Impact on Margin" value={`₹${(data?.tdsImpactOnMargin || 0).toLocaleString()}`} />
        </div>

        {/* Sales Pipeline Chart */}
        {data?.pipeline && (
          <div className="dashboard-section">
            <SalesPipelineChart 
              pipelineData={{
                total: (data?.pipeline?.new || 0) + (data?.pipeline?.qualified || 0) + (data?.pipeline?.sentToDelivery || 0) + (data?.pipeline?.converted || 0) + (data?.pipeline?.lost || 0),
                qualified: data?.pipeline?.qualified || 0,
                sentToDelivery: data?.pipeline?.sentToDelivery || 0,
                converted: data?.pipeline?.converted || 0
              }}
            />
          </div>
        )}

        {/* Low GP Items List (after acknowledgment) */}
        {showLowGPList && lowGPItems.length > 0 && (
          <div className="dashboard-section" style={{ marginTop: '20px' }}>
            <h2 className="section-title" style={{ color: 'var(--color-warning)' }}>
              ⚠️ Low GP Opportunities (GP &lt; 15%)
            </h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Adhoc ID</th>
                    <th>Client</th>
                    <th>TOV</th>
                    <th>Total Expenses</th>
                    <th>GP Amount</th>
                    <th>GP %</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lowGPItems.map((item, idx) => {
                    const gpPercent = item.tov && item.tov > 0 ? ((item.finalGP || 0) / item.tov * 100).toFixed(2) : '0.00';
                    const totalExpenses = (item.tov || 0) - (item.finalGP || 0);
                    return (
                      <tr key={idx} style={{ backgroundColor: gpPercent < 10 ? '#fef2f2' : '#fffbeb' }}>
                        <td><strong>{item.opportunityId || 'N/A'}</strong></td>
                        <td>{item.billingClient || item.endClient || 'N/A'}</td>
                        <td>₹{(item.tov || 0).toLocaleString()}</td>
                        <td>₹{totalExpenses.toLocaleString()}</td>
                        <td>₹{(item.finalGP || 0).toLocaleString()}</td>
                        <td><strong style={{ color: gpPercent < 10 ? 'var(--color-danger)' : 'var(--color-warning)' }}>{gpPercent}%</strong></td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => window.location.href = `/opportunities/${item._id}`}
                              className="btn-small btn-primary"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleApprove(item)}
                              className="btn-small btn-success"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(item)}
                              className="btn-small btn-danger"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data?.aiInsight && (
          <div className="ai-insight">
            <div className="ai-insight-label">System Insight</div>
            <div className="ai-insight-text">{data.aiInsight}</div>
          </div>
        )}
      </div>
    );
  }

  if (user.role === 'Finance Manager') {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="page-title">Finance Dashboard</h1>
          <NotificationBell user={user} />
        </div>
        <div className="dashboard-grid">
          <DashboardCard title="Pending Invoices" count={data?.pendingInvoices?.length || 0} />
          <DashboardCard title="Overdue Receivables" count={data?.overdueReceivables?.length || 0} />
          <DashboardCard title="Cash Position" value={`₹${(data?.cashPosition || 0).toLocaleString()}`} />
          <DashboardCard title="Tax Compliant" count={data?.taxComplianceStatus?.compliant || 0} />
          <DashboardCard title="Non-Compliant TDS" count={data?.nonCompliantTds || 0} />
        </div>
        {data?.recentOpportunities && data.recentOpportunities.length > 0 && (
          <div className="dashboard-section">
            <h2 className="section-title">Recent Opportunities (Real-Time)</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Adhoc ID</th>
                    <th>Client Company</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOpportunities.map((opp) => (
                    <tr key={opp._id}>
                      <td><strong>{opp.opportunityId}</strong></td>
                      <td>{opp.clientCompanyName || opp.endClient || 'N/A'}</td>
                      <td>{opp.opportunityType || opp.trainingOpportunity || 'N/A'}</td>
                      <td>₹{(opp.expectedCommercialValue || opp.tov || 0).toLocaleString()}</td>
                      <td><span className={`status-badge ${(opp.opportunityStatus || opp.trainingStatus || 'New').toLowerCase().replace(' ', '-')}`}>
                        {opp.opportunityStatus || opp.trainingStatus || 'New'}
                      </span></td>
                      <td>{opp.salesExecutiveId?.name || opp.salesManagerId?.name || 'N/A'}</td>
                      <td>{new Date(opp.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          onClick={() => window.location.href = `/opportunities/${opp._id}`}
                          className="btn-small btn-primary"
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
        )}
      </div>
    );
  }

  if (user.role === 'Director') {
    return (
      <div className="dashboard">
        {showLowGPAlert && lowGPItems.length > 0 && (
          <>
            <div className="low-gp-alert-overlay" onClick={() => setShowLowGPAlert(false)} />
            <div className="low-gp-alert-popup critical">
              <div className="low-gp-alert-header">
                <h3 className="low-gp-alert-title">🚨 Critical Low GP Alert</h3>
                <button
                  onClick={() => setShowLowGPAlert(false)}
                  className="low-gp-alert-close"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="low-gp-alert-body" style={{ fontWeight: '600' }}>
                The following opportunities/programs have GP below 10% and require your immediate attention:
              </div>
              <ul className="low-gp-alert-list">
                {lowGPItems.map((item, idx) => {
                  const gpPercent = item.tov && item.tov > 0 ? ((item.finalGP || 0) / item.tov * 100).toFixed(2) : '0.00';
                  const itemName = item.opportunityId || item.programName || item.courseName || 'N/A';
                  const clientName = item.billingClient || item.endClient || 'N/A';
                  return (
                    <li key={idx} className="low-gp-alert-item">
                      <strong>{itemName}</strong> - {' '}
                      {clientName} - {' '}
                      GP: <span className="gp-value">{gpPercent}%</span> (₹{(item.finalGP || 0).toLocaleString()})
                    </li>
                  );
                })}
              </ul>
              <button
                onClick={() => {
                  localStorage.setItem('veryLowGPAlertAcknowledged_DIR', 'true');
                  setShowLowGPAlert(false);
                  setShowLowGPList(true);
                }}
                className="low-gp-alert-acknowledge"
              >
                Acknowledge
              </button>
            </div>
          </>
        )}
        <div className="dashboard-header">
          <h1 className="page-title">Director Dashboard</h1>
          <NotificationBell user={user} />
        </div>
        <div className="dashboard-grid">
          <DashboardCard title="Revenue" value={`₹${(data?.revenue || 0).toLocaleString()}`} />
          <DashboardCard title="Expenses" value={`₹${(data?.expenses || 0).toLocaleString()}`} />
          <DashboardCard title="Profit/Loss" value={`₹${(data?.profitLoss || 0).toLocaleString()}`} />
          <DashboardCard title="Risk Alerts" count={data?.riskAlerts?.length || 0} />
        </div>

        {/* Revenue Target Setting Section */}
        <div className="dashboard-section" style={{ marginTop: '20px' }}>
          <h2 className="section-title">Set Revenue Target</h2>
          <form onSubmit={handleSetRevenueTarget} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label>Year</label>
              <select
                value={revenueTargetForm.year}
                onChange={(e) => setRevenueTargetForm({ ...revenueTargetForm, year: e.target.value })}
                required
              >
                {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Period</label>
              <select
                value={revenueTargetForm.period}
                onChange={(e) => setRevenueTargetForm({ ...revenueTargetForm, period: e.target.value, quarter: e.target.value === 'Quarterly' ? revenueTargetForm.quarter : '' })}
                required
              >
                <option value="Yearly">Yearly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="H1">H1 (Jan-Jun)</option>
                <option value="H2">H2 (Jul-Dec)</option>
              </select>
            </div>
            {revenueTargetForm.period === 'Quarterly' && (
              <div className="form-group">
                <label>Quarter</label>
                <select
                  value={revenueTargetForm.quarter}
                  onChange={(e) => setRevenueTargetForm({ ...revenueTargetForm, quarter: e.target.value })}
                  required
                >
                  <option value="">Select Quarter</option>
                  <option value="1">Q1 (Jan-Mar)</option>
                  <option value="2">Q2 (Apr-Jun)</option>
                  <option value="3">Q3 (Jul-Sep)</option>
                  <option value="4">Q4 (Oct-Dec)</option>
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                value={revenueTargetForm.amount}
                onChange={(e) => setRevenueTargetForm({ ...revenueTargetForm, amount: e.target.value })}
                placeholder="Enter amount"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn-primary">Set Target</button>
            </div>
          </form>
          {targetMessage && (
            <div style={{ padding: '12px', backgroundColor: targetMessage.includes('Error') ? '#fee' : '#efe', color: targetMessage.includes('Error') ? '#c33' : '#363', borderRadius: '4px', marginBottom: '16px' }}>
              {targetMessage}
            </div>
          )}
          {data?.revenueTargets && data.revenueTargets.length > 0 && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Period</th>
                    <th>Quarter</th>
                    <th>Target Amount</th>
                    <th>Set By</th>
                    <th>Set At</th>
                  </tr>
                </thead>
                <tbody>
                  {data.revenueTargets.map((target) => (
                    <tr key={target._id}>
                      <td>{target.year}</td>
                      <td>{target.period}</td>
                      <td>{target.quarter ? `Q${target.quarter}` : '-'}</td>
                      <td>₹{target.amount.toLocaleString()}</td>
                      <td>{target.setBy?.name || 'N/A'}</td>
                      <td>{new Date(target.setAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Very Low GP Items List (after acknowledgment) */}
        {showLowGPList && lowGPItems.length > 0 && (
          <div className="dashboard-section" style={{ marginTop: '20px' }}>
            <h2 className="section-title" style={{ color: 'var(--color-danger)' }}>
              🚨 Critical Low GP Items (GP &lt; 10%)
            </h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Client</th>
                    <th>TOV</th>
                    <th>Total Expenses</th>
                    <th>GP Amount</th>
                    <th>GP %</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lowGPItems.map((item, idx) => {
                    const gpPercent = item.tov && item.tov > 0 ? ((item.finalGP || 0) / item.tov * 100).toFixed(2) : '0.00';
                    const totalExpenses = (item.tov || 0) - (item.finalGP || 0);
                    const itemId = item.opportunityId || item.programName || item.courseName || 'N/A';
                    const itemType = item.opportunityId ? 'Opportunity' : 'Program';
                    return (
                      <tr key={idx} style={{ backgroundColor: '#fef2f2' }}>
                        <td><strong>{itemId}</strong></td>
                        <td>{itemType}</td>
                        <td>{item.billingClient || item.endClient || 'N/A'}</td>
                        <td>₹{(item.tov || 0).toLocaleString()}</td>
                        <td>₹{totalExpenses.toLocaleString()}</td>
                        <td>₹{(item.finalGP || 0).toLocaleString()}</td>
                        <td><strong style={{ color: 'var(--color-danger)' }}>{gpPercent}%</strong></td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => {
                                if (item.opportunityId) {
                                  window.location.href = `/opportunities/${item._id}`;
                                } else {
                                  window.location.href = `/programs/${item._id}`;
                                }
                              }}
                              className="btn-small btn-primary"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleApprove(item)}
                              className="btn-small btn-success"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(item)}
                              className="btn-small btn-danger"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data?.recentOpportunities && data.recentOpportunities.length > 0 && (
          <div className="dashboard-section">
            <h2 className="section-title">Recent Opportunities (Real-Time)</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Adhoc ID</th>
                    <th>Client Company</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOpportunities.map((opp) => (
                    <tr key={opp._id}>
                      <td><strong>{opp.opportunityId}</strong></td>
                      <td>{opp.clientCompanyName || opp.endClient || 'N/A'}</td>
                      <td>{opp.opportunityType || opp.trainingOpportunity || 'N/A'}</td>
                      <td>₹{(opp.expectedCommercialValue || opp.tov || 0).toLocaleString()}</td>
                      <td><span className={`status-badge ${(opp.opportunityStatus || opp.trainingStatus || 'New').toLowerCase().replace(' ', '-')}`}>
                        {opp.opportunityStatus || opp.trainingStatus || 'New'}
                      </span></td>
                      <td>{opp.salesExecutiveId?.name || opp.salesManagerId?.name || 'N/A'}</td>
                      <td>{new Date(opp.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          onClick={() => window.location.href = `/opportunities/${opp._id}`}
                          className="btn-small btn-primary"
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
        )}
        {data?.aiInsight && (
          <div className="ai-insight">
            <div className="ai-insight-label">Weekly AI Insight</div>
            <div className="ai-insight-text">{data.aiInsight}</div>
          </div>
        )}
      </div>
    );
  }

  if (user.role === 'Sales Executive') {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="page-title">Sales Executive Dashboard</h1>
          <NotificationBell user={user} />
        </div>
        <div className="dashboard-grid">
          <DashboardCard title="Revenue Target" value={`₹${(data?.revenueTarget || 0).toLocaleString()}`} />
          <DashboardCard title="Lead Capture" count={data?.leadCapture || 0} />
          <DashboardCard title="Opportunities" count={data?.opportunities || 0} />
          <DashboardCard title="Closures" count={data?.closures || 0} />
        </div>

        {/* Sales Pipeline Chart */}
        {data?.pipeline && (
          <div className="dashboard-section">
            <SalesPipelineChart 
              pipelineData={{
                total: data?.opportunities || 0,
                qualified: data?.pipeline?.qualified || 0,
                sentToDelivery: data?.pipeline?.sentToDelivery || 0,
                converted: data?.closures || 0
              }}
            />
          </div>
        )}
        {data?.myOpportunities && data.myOpportunities.length > 0 && (
          <div className="dashboard-section">
            <h2 className="section-title">My Opportunities</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Adhoc ID</th>
                    <th>Client Company</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.myOpportunities.map((opp) => (
                    <tr key={opp._id}>
                      <td>{opp.opportunityId}</td>
                      <td>{opp.clientCompanyName}</td>
                      <td>{opp.opportunityType}</td>
                      <td>₹{opp.expectedCommercialValue?.toLocaleString()}</td>
                      <td><span className={`status-badge ${opp.opportunityStatus?.toLowerCase().replace(' ', '-')}`}>
                        {opp.opportunityStatus}
                      </span></td>
                      <td>
                        <button
                          onClick={() => window.location.href = `/opportunities/${opp._id}`}
                          className="btn-small btn-primary"
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
        )}
        {data?.recentOpportunities && data.recentOpportunities.length > 0 && (
          <div className="dashboard-section">
            <h2 className="section-title">All Recent Opportunities (Real-Time)</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Adhoc ID</th>
                    <th>Client Company</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOpportunities.map((opp) => (
                    <tr key={opp._id}>
                      <td><strong>{opp.opportunityId}</strong></td>
                      <td>{opp.clientCompanyName || opp.endClient || 'N/A'}</td>
                      <td>{opp.opportunityType || opp.trainingOpportunity || 'N/A'}</td>
                      <td>₹{(opp.expectedCommercialValue || opp.tov || 0).toLocaleString()}</td>
                      <td><span className={`status-badge ${(opp.opportunityStatus || opp.trainingStatus || 'New').toLowerCase().replace(' ', '-')}`}>
                        {opp.opportunityStatus || opp.trainingStatus || 'New'}
                      </span></td>
                      <td>{opp.salesExecutiveId?.name || opp.salesManagerId?.name || 'N/A'}</td>
                      <td>{new Date(opp.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          onClick={() => window.location.href = `/opportunities/${opp._id}`}
                          className="btn-small btn-primary"
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
        )}
      </div>
    );
  }

  if (user.role === 'Sales Manager') {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="page-title">Sales Manager Dashboard</h1>
          <NotificationBell user={user} />
        </div>
        <div className="dashboard-grid">
          <DashboardCard title="Revenue Target" value={`₹${(data?.revenueTarget || 0).toLocaleString()}`} />
          <DashboardCard title="New Opportunities" count={data?.pipeline?.new || 0} />
          <DashboardCard title="Qualified" count={data?.pipeline?.qualified || 0} />
          <DashboardCard title="Sent to Delivery" count={data?.pipeline?.sentToDelivery || 0} />
          <DashboardCard title="Converted" count={data?.pipeline?.converted || 0} />
          <DashboardCard title="Lost" count={data?.pipeline?.lost || 0} />
          <DashboardCard title="Total Pipeline Value" value={`₹${(data?.totalValue || 0).toLocaleString()}`} />
          <DashboardCard title="Converted Value" value={`₹${(data?.convertedValue || 0).toLocaleString()}`} />
        </div>

        {/* Sales Pipeline Chart */}
        {data?.pipeline && (
          <div className="dashboard-section">
            <SalesPipelineChart 
              pipelineData={{
                total: (data?.pipeline?.new || 0) + (data?.pipeline?.qualified || 0) + (data?.pipeline?.sentToDelivery || 0) + (data?.pipeline?.converted || 0) + (data?.pipeline?.lost || 0),
                qualified: data?.pipeline?.qualified || 0,
                sentToDelivery: data?.pipeline?.sentToDelivery || 0,
                converted: data?.pipeline?.converted || 0
              }}
            />
          </div>
        )}
        {data?.pendingQualification && data.pendingQualification.length > 0 && (
          <div className="dashboard-section">
            <h2 className="section-title">Pending Qualification</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Adhoc ID</th>
                    <th>Client Company</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Sales Executive</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pendingQualification.map((opp) => (
                    <tr key={opp._id}>
                      <td>{opp.opportunityId}</td>
                      <td>{opp.clientCompanyName}</td>
                      <td>{opp.opportunityType}</td>
                      <td>₹{opp.expectedCommercialValue?.toLocaleString()}</td>
                      <td>{opp.salesExecutiveId?.name || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {data?.recentOpportunities && data.recentOpportunities.length > 0 && (
          <div className="dashboard-section">
            <h2 className="section-title">All Recent Opportunities (Real-Time)</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Adhoc ID</th>
                    <th>Client Company</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOpportunities.map((opp) => (
                    <tr key={opp._id}>
                      <td><strong>{opp.opportunityId}</strong></td>
                      <td>{opp.clientCompanyName || opp.endClient || 'N/A'}</td>
                      <td>{opp.opportunityType || opp.trainingOpportunity || 'N/A'}</td>
                      <td>₹{(opp.expectedCommercialValue || opp.tov || 0).toLocaleString()}</td>
                      <td><span className={`status-badge ${(opp.opportunityStatus || opp.trainingStatus || 'New').toLowerCase().replace(' ', '-')}`}>
                        {opp.opportunityStatus || opp.trainingStatus || 'New'}
                      </span></td>
                      <td>{opp.salesExecutiveId?.name || opp.salesManagerId?.name || 'N/A'}</td>
                      <td>{new Date(opp.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          onClick={() => window.location.href = `/opportunities/${opp._id}`}
                          className="btn-small btn-primary"
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
        )}
      </div>
    );
  }

  return null;
};

const DashboardCard = ({ title, count, value }) => (
  <div className="dashboard-card">
    <div className="dashboard-card-title">{title}</div>
    <div className="dashboard-card-value">{value || count}</div>
  </div>
);

export default Dashboard;
