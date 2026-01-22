import { useState, useEffect } from 'react';
import api from '../services/api';
import './Dashboard.css';
import SalesPipelineChart from '../components/SalesPipelineChart';
import RevenueGrowthChart from '../components/RevenueGrowthChart';
import NotificationBell from '../components/NotificationBell';
import DashboardCard from '../components/DashboardCard';

const Dashboard = ({ user }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLowGPAlert, setShowLowGPAlert] = useState(false);
    const [lowGPItems, setLowGPItems] = useState([]);
    const [showLowGPList, setShowLowGPList] = useState(false);
    const [revenueTargetForm, setRevenueTargetForm] = useState({
        year: new Date().getFullYear(),
        period: 'Yearly',
        quarter: '',
        amount: ''
    });
    const [targetMessage, setTargetMessage] = useState('');

    // Charts toggle state
    const [chartsExpanded, setChartsExpanded] = useState(true);

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
                else endpoint = '/dashboards/sales-executive'; // Fallback

                const response = await api.get(endpoint);
                setData(response.data);

                // Check for low GP alerts - Role specific
                let alertKey = '';
                if (user.role === 'Sales Executive') alertKey = 'lowGPAlertAcknowledged_SE';
                else if (user.role === 'Business Head') alertKey = 'lowGPAlertAcknowledged_BH';
                else if (user.role === 'Director') alertKey = 'veryLowGPAlertAcknowledged_DIR';

                if (alertKey) {
                    const acknowledged = localStorage.getItem(alertKey);

                    if ((user.role === 'Business Head' || user.role === 'Sales Executive') && response.data.lowGPAlerts && response.data.lowGPAlerts.length > 0) {
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
                }
            } catch (error) {
                console.error('Dashboard error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboard();
            const interval = setInterval(fetchDashboard, 5000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const handleApprove = async (item) => {
        if (window.confirm(`Are you sure you want to APPROVE this opportunity/program?\n\nAdhoc ID: ${item.opportunityId || item.programName || 'N/A'}`)) {
            if (window.confirm('Final confirmation: Approve this item?')) {
                try {
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
                    window.location.reload();
                } catch (error) {
                    alert('Error approving item: ' + (error.response?.data?.error || error.message));
                }
            }
        }
    };

    const handleReject = async (item) => {
        const reason = window.prompt(`Enter rejection reason for:\n\nAdhoc ID: ${item.opportunityId || item.programName || 'N/A'}`);
        if (reason) {
            if (window.confirm('Final confirmation: Reject this item?')) {
                try {
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

            await api.post('/revenue-targets', payload);
            setTargetMessage(`Revenue target set successfully! Amount: ₹${parseFloat(revenueTargetForm.amount).toLocaleString()}`);
            setRevenueTargetForm({
                year: new Date().getFullYear(),
                period: 'Yearly',
                quarter: '',
                amount: ''
            });

            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            setTargetMessage('Error setting revenue target: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleAcknowledgeLowGP = () => {
        setShowLowGPAlert(false);
        setShowLowGPList(true);
        let key = '';
        if (user.role === 'Sales Executive') key = 'lowGPAlertAcknowledged_SE';
        else if (user.role === 'Business Head') key = 'lowGPAlertAcknowledged_BH';
        else if (user.role === 'Director') key = 'veryLowGPAlertAcknowledged_DIR';
        if (key) localStorage.setItem(key, 'true');
    };

    if (loading) {
        return (
            <div className="dashboard">
                <div className="dashboard-header" style={{ height: '40px' }}></div>
                <div className="dashboard-grid">
                    <div className="dashboard-card" style={{ minHeight: '140px' }}></div>
                    <div className="dashboard-card" style={{ minHeight: '140px' }}></div>
                    <div className="dashboard-card" style={{ minHeight: '140px' }}></div>
                    <div className="dashboard-card" style={{ minHeight: '140px' }}></div>
                </div>
            </div>
        );
    }

    // --- RENDER PER ROLE ---

    if (user.role === 'Operations Manager') {
        return (
            <div className="dashboard">
                <div className="dashboard-header">
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
            </div>
        );
    }

    if (user.role === 'Business Head') {
        return (
            <div className="dashboard">
                {showLowGPAlert && (
                    <>
                        <div className="low-gp-alert-overlay" />
                        <div className="low-gp-alert-popup">
                            <div className="low-gp-alert-header">
                                <h3 className="low-gp-alert-title">⚠️ Low GP Alert</h3>
                                <button onClick={() => setShowLowGPAlert(false)} className="low-gp-alert-close">×</button>
                            </div>
                            <div className="low-gp-alert-body">The following opportunities have GP below 15% and require your attention:</div>
                            <ul className="low-gp-alert-list">
                                {lowGPItems.map((item, idx) => {
                                    const gpPercent = item.tov && item.tov > 0 ? ((item.finalGP || 0) / item.tov * 100).toFixed(2) : '0.00';
                                    return (
                                        <li key={idx} className="low-gp-alert-item">
                                            <strong>{item.opportunityId || 'N/A'}</strong> - {item.billingClient || 'N/A'} - GP: <span className="gp-value">{gpPercent}%</span>
                                        </li>
                                    );
                                })}
                            </ul>
                            <button onClick={handleAcknowledgeLowGP} className="low-gp-alert-acknowledge">Acknowledge</button>
                        </div>
                    </>
                )}
                <div className="dashboard-header">
                    <NotificationBell user={user} />
                </div>
                <div className="dashboard-grid">
                    <DashboardCard title="Revenue Target" value={`₹${(data?.revenueTarget || 0).toLocaleString()}`} />
                    <DashboardCard title="Current Year Revenue" value={`₹${(data?.currentRevenue || 0).toLocaleString()}`} />
                    <DashboardCard title="Last Year Revenue" value={`₹${(data?.lastYearRevenue || 0).toLocaleString()}`} />
                    <DashboardCard title="Growth %" value={`${data?.revenueGrowth || 0}%`} />
                    <DashboardCard title="Top Clients" count={data?.topClients?.length || 0} />
                    <DashboardCard title="TDS Impact" value={`₹${(data?.tdsImpactOnMargin || 0).toLocaleString()}`} />
                </div>

                {data?.pipeline && (
                    <div className="combined-charts-container">
                        <div className="combined-charts-header">
                            <div className="combined-charts-title">Performance Overview</div>
                            <div className="combined-charts-controls">
                                <button className="chart-toggle-btn-global" onClick={() => setChartsExpanded(!chartsExpanded)}>
                                    {chartsExpanded ? 'Minimize' : 'Maximize'}
                                </button>
                            </div>
                        </div>
                        {chartsExpanded && (
                            <div className="dashboard-charts-grid">
                                <div className="chart-wrapper">
                                    <SalesPipelineChart
                                        pipelineData={{
                                            total: (data?.pipeline?.new || 0) + (data?.pipeline?.qualified || 0) + (data?.pipeline?.sentToDelivery || 0) + (data?.pipeline?.converted || 0) + (data?.pipeline?.lost || 0),
                                            qualified: data?.pipeline?.qualified || 0,
                                            sentToDelivery: data?.pipeline?.sentToDelivery || 0,
                                            converted: data?.pipeline?.converted || 0
                                        }}
                                    />
                                </div>
                                <div className="chart-wrapper"><RevenueGrowthChart /></div>
                            </div>
                        )}
                    </div>
                )}

                {showLowGPList && lowGPItems.length > 0 && (
                    <div className="low-gp-list">
                        <h3>Low GP Opportunities (Needs Attention)</h3>
                        {lowGPItems.map((item, idx) => (
                            <div key={idx} className="low-gp-item">
                                <div className="low-gp-item-header">
                                    <span className="low-gp-item-id">{item.opportunityId}</span>
                                    <span className="low-gp-item-gp">GP: {item.tov ? ((item.finalGP || 0) / item.tov * 100).toFixed(2) : '0.00'}%</span>
                                </div>
                                <div className="low-gp-item-actions">
                                    <button onClick={() => window.location.href = `/opportunities/${item._id}`} className="btn-small btn-primary">View</button>
                                    <button onClick={() => handleApprove(item)} className="btn-small btn-approve">Approve</button>
                                    <button onClick={() => handleReject(item)} className="btn-small btn-reject">Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {data?.aiInsight && <div className="ai-insight"><div className="ai-insight-label">System Insight</div><div className="ai-insight-text">{data.aiInsight}</div></div>}
            </div>
        );
    }

    if (user.role === 'Finance Manager') {
        return (
            <div className="dashboard">
                <div className="dashboard-header"><NotificationBell user={user} /></div>
                <div className="dashboard-grid">
                    <DashboardCard title="Pending Invoices" count={data?.pendingInvoices?.length || 0} />
                    <DashboardCard title="Overdue Receivables" count={data?.overdueReceivables?.length || 0} />
                    <DashboardCard title="Cash Position" value={`₹${(data?.cashPosition || 0).toLocaleString()}`} />
                    <DashboardCard title="Tax Compliant" count={data?.taxComplianceStatus?.compliant || 0} />
                    <DashboardCard title="Non-Compliant TDS" count={data?.nonCompliantTds || 0} />
                </div>
            </div>
        );
    }

    if (user.role === 'Director') {
        return (
            <div className="dashboard">
                {showLowGPAlert && (
                    <>
                        <div className="low-gp-alert-overlay" />
                        <div className="low-gp-alert-popup critical">
                            <div className="low-gp-alert-header">
                                <h3 className="low-gp-alert-title">🚨 Critical Low GP Alert</h3>
                                <button onClick={() => setShowLowGPAlert(false)} className="low-gp-alert-close">×</button>
                            </div>
                            <div className="low-gp-alert-body">The following items have GP below 10%:</div>
                            <ul className="low-gp-alert-list">
                                {lowGPItems.map((item, idx) => (
                                    <li key={idx} className="low-gp-alert-item">
                                        <strong>{item.opportunityId || item.programName}</strong> - GP: {item.tov ? ((item.finalGP || 0) / item.tov * 100).toFixed(2) : '0.00'}%
                                    </li>
                                ))}
                            </ul>
                            <button onClick={handleAcknowledgeLowGP} className="low-gp-alert-acknowledge">Acknowledge</button>
                        </div>
                    </>
                )}
                <div className="dashboard-header"><NotificationBell user={user} /></div>
                <div className="dashboard-grid">
                    <DashboardCard title="Revenue" value={`₹${(data?.revenue || 0).toLocaleString()}`} />
                    <DashboardCard title="Expenses" value={`₹${(data?.expenses || 0).toLocaleString()}`} />
                    <DashboardCard title="Profit/Loss" value={`₹${(data?.profitLoss || 0).toLocaleString()}`} />
                    <DashboardCard title="Risk Alerts" count={data?.riskAlerts?.length || 0} />
                </div>

                {/* Set Target Form */}
                <div className="dashboard-section">
                    <h2 className="section-title">Set Revenue Target</h2>
                    <form onSubmit={handleSetRevenueTarget} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
                        <div className="form-group"><label>Year</label><input type="number" value={revenueTargetForm.year} onChange={e => setRevenueTargetForm({ ...revenueTargetForm, year: e.target.value })} required className="form-control" /></div>
                        <div className="form-group"><label>Period</label><select value={revenueTargetForm.period} onChange={e => setRevenueTargetForm({ ...revenueTargetForm, period: e.target.value })} className="form-control"><option value="Yearly">Yearly</option><option value="Quarterly">Quarterly</option></select></div>
                        <div className="form-group"><label>Amount</label><input type="number" value={revenueTargetForm.amount} onChange={e => setRevenueTargetForm({ ...revenueTargetForm, amount: e.target.value })} required className="form-control" /></div>
                        <button type="submit" className="btn-small btn-primary">Set Target</button>
                    </form>
                    {targetMessage && <div className="error-message">{targetMessage}</div>}
                </div>

                {showLowGPList && lowGPItems.length > 0 && (
                    <div className="low-gp-list">
                        <h3>Critical Low GP Items</h3>
                        {lowGPItems.map((item, idx) => (
                            <div key={idx} className="low-gp-item">
                                <strong>{item.opportunityId || item.programName}</strong>
                                <div className="low-gp-item-actions">
                                    <button onClick={() => handleApprove(item)} className="btn-small btn-approve">Approve</button>
                                    <button onClick={() => handleReject(item)} className="btn-small btn-reject">Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // DEFAULT: Sales Executive (and fallback for Sales Manager with similar view)
    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <NotificationBell user={user} />
            </div>

            {showLowGPAlert && (
                <>
                    <div className="low-gp-alert-overlay" />
                    <div className="low-gp-alert-popup">
                        <div className="low-gp-alert-header">
                            <h3 className="low-gp-alert-title">⚠️ Low GP Opportunities Detected</h3>
                            <button
                                className="low-gp-alert-close"
                                onClick={() => setShowLowGPAlert(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="low-gp-alert-body">
                            <p>The following opportunities have a Gross Profit (GP) below the 50% threshold. These require your attention and may need adjustment before approval.</p>
                        </div>
                        <ul className="low-gp-alert-list">
                            {lowGPItems.map((item) => (
                                <li key={item._id} className="low-gp-alert-item">
                                    <strong>{item.opportunityId}</strong> - {item.clientCompanyName}<br />
                                    GP: <span className="gp-value">
                                        {item.tov && item.tov > 0
                                            ? ((item.finalGP || 0) / item.tov * 100).toFixed(2)
                                            : '0.00'}%
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <button
                            className="low-gp-alert-acknowledge"
                            onClick={handleAcknowledgeLowGP}
                        >
                            I Understand - View Dashboard
                        </button>
                    </div>
                </>
            )}

            <div className="dashboard-grid">
                <DashboardCard title="Revenue Target" value={`₹${(data?.revenueTarget || 0).toLocaleString()}`} />
                <DashboardCard title={user.role === 'Sales Manager' ? "Team Pipeline" : "Lead Capture"} count={(user.role === 'Sales Manager' ? data?.totalValue : data?.leadCapture) || 0} />
                <DashboardCard title="Opportunities" count={(user.role === 'Sales Manager' ? data?.pipeline?.new : data?.opportunities) || 0} />
                <DashboardCard title="Closures" count={(user.role === 'Sales Manager' ? data?.pipeline?.converted : data?.closures) || 0} />
            </div>

            {/* Sales Pipeline Chart & Revenue Growth Chart - Collapsible Section */}
            {data?.pipeline && (
                <div className="combined-charts-container">
                    <div className="combined-charts-header">
                        <div className="combined-charts-title">Performance Overview</div>
                        <div className="combined-charts-controls">
                            <button
                                className="chart-toggle-btn-global"
                                onClick={() => setChartsExpanded(!chartsExpanded)}
                            >
                                {chartsExpanded ? (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6" /></svg>
                                        Minimize
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                                        Maximize
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {chartsExpanded && (
                        <div className="dashboard-charts-grid">
                            <div className="chart-wrapper">
                                <SalesPipelineChart
                                    pipelineData={{
                                        total: user.role === 'Sales Manager'
                                            ? ((data?.pipeline?.new || 0) + (data?.pipeline?.qualified || 0) + (data?.pipeline?.sentToDelivery || 0) + (data?.pipeline?.converted || 0) + (data?.pipeline?.lost || 0))
                                            : (data?.opportunities || 0),
                                        qualified: data?.pipeline?.qualified || 0,
                                        sentToDelivery: data?.pipeline?.sentToDelivery || 0,
                                        converted: user.role === 'Sales Manager' ? data?.pipeline?.converted : (data?.closures || 0)
                                    }}
                                />
                            </div>
                            <div className="chart-wrapper">
                                <RevenueGrowthChart />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Low GP List */}
            {showLowGPList && lowGPItems.length > 0 && (
                <div className="low-gp-list">
                    <h3>Low GP Opportunities (Needs Attention)</h3>
                    {lowGPItems.map((item) => (
                        <div key={item._id} className="low-gp-item">
                            <div className="low-gp-item-header">
                                <span className="low-gp-item-id">{item.opportunityId}</span>
                                <span className="low-gp-item-gp">GP: {item.tov && item.tov > 0 ? ((item.finalGP || 0) / item.tov * 100).toFixed(2) : '0.00'}%</span>
                            </div>
                            <div className="low-gp-item-client">{item.clientCompanyName}</div>
                            <div className="low-gp-item-actions">
                                <button
                                    onClick={() => window.location.href = `/opportunities/${item._id}`}
                                    className="btn-small btn-primary"
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
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
};

export default Dashboard;
