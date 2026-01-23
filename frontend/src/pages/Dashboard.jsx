import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import './Dashboard.css';
import SalesPipelineChart from '../components/SalesPipelineChart.jsx';
import RevenueGrowthChart from '../components/RevenueGrowthChart.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import DashboardCard from '../components/DashboardCard.jsx';
import { useModal } from '../contexts/context/ModalContext.jsx';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

const Dashboard = ({ user }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLowGPAlert, setShowLowGPAlert] = useState(false);
    const [lowGPItems, setLowGPItems] = useState([]);
    const [showLowGPList, setShowLowGPList] = useState(false);
    const [currency, setCurrency] = useState('INR');
    const [clientHealth, setClientHealth] = useState({ active: 0, mid: 0, inactive: 0 });
    const [docTracking, setDocTracking] = useState([]);
    const [performance, setPerformance] = useState({ target: 0, achieved: 0 });
    const [monthlyTrends, setMonthlyTrends] = useState([]);
    const [gpReport, setGpReport] = useState(null);
    const [gpLoading, setGpLoading] = useState(false);
    const [gpFilterType, setGpFilterType] = useState('month');
    const [gpMonth, setGpMonth] = useState(new Date().getMonth() + 1);
    const [gpQuarter, setGpQuarter] = useState('Q1');
    const [gpYear, setGpYear] = useState(new Date().getFullYear());
    const modal = useModal();
    const dashboardRefreshSeconds = useMemo(() => {
        const seconds = Number(user?.settings?.dashboardRefresh);
        if (!Number.isFinite(seconds)) return 5;
        return seconds;
    }, [user?.settings?.dashboardRefresh]);
    const [revenueTargetForm, setRevenueTargetForm] = useState({
        year: new Date().getFullYear(),
        period: 'Yearly',
        quarter: '',
        amount: ''
    });
    const [targetMessage, setTargetMessage] = useState('');

    // Charts toggle state
    const [chartsExpanded, setChartsExpanded] = useState(true);

    // Operations Manager specific state
    const [opsVendorStats, setOpsVendorStats] = useState([]);
    const [opsGpStats, setOpsGpStats] = useState([]);
    const [opsFiscalYear, setOpsFiscalYear] = useState('2024-2025');

    // Sales Manager specific state
    const [smTeamMembers, setSmTeamMembers] = useState([]);
    const [smMonthlyPerf, setSmMonthlyPerf] = useState([]);
    const [smSelectedMember, setSmSelectedMember] = useState('all');
    const [smEditingTarget, setSmEditingTarget] = useState(null);
    const [smTargetValue, setSmTargetValue] = useState('');
    const [smTargetPeriod, setSmTargetPeriod] = useState('Yearly');

    // Finance Manager specific state
    const [finClientGP, setFinClientGP] = useState([]);
    const [finVendorExp, setFinVendorExp] = useState([]);
    const [finFilterType, setFinFilterType] = useState('year');
    const [finSelectedMonth, setFinSelectedMonth] = useState(new Date().getMonth());
    const [finSelectedQuarter, setFinSelectedQuarter] = useState('Q1');

    const userId = user?.id || user?._id;
    const usdRate = 83;
    const formatMoney = (amount) => {
        const val = Number(amount) || 0;
        if (currency === 'USD') {
            const usd = val / usdRate;
            return usd.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
        }
        return val.toLocaleString(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    };

    const fetchMonthlyTrends = async () => {
        try {
            const y = new Date().getFullYear();
            const res = await api.get(`/dashboards/monthly-trends?year=${y}`);
            if (Array.isArray(res?.data)) setMonthlyTrends(res.data);
        } catch {
            // ignore
        }
    };

    const fetchGPReport = async (next = {}) => {
        const type = next.type || gpFilterType;
        const year = Number(next.year || gpYear);
        const month = Number(next.month || gpMonth);
        const quarter = String(next.quarter || gpQuarter);
        try {
            setGpLoading(true);
            const params = new URLSearchParams();
            params.set('type', type);
            params.set('year', String(year));
            if (type === 'month') params.set('month', String(month));
            if (type === 'quarter') params.set('quarter', String(quarter));
            if (type === 'fiscal_year') {
                // year only
            }
            const res = await api.get(`/reports/gp-analysis?${params.toString()}`);
            if (res?.data) setGpReport(res.data);
        } catch {
            // ignore
        } finally {
            setGpLoading(false);
        }
    };

    const exportGpCsv = () => {
        if (!gpReport?.clientData || !Array.isArray(gpReport.clientData)) return;
        const header = ['S.No', 'Client Name', 'Total Revenue', 'Total Expenses', 'Gross Profit', 'GP %', 'Opportunities'];
        const rows = gpReport.clientData.map((c) => [
            c.sno,
            String(c.clientName || ''),
            Number(c.totalRevenue || 0),
            Number(c.totalExpenses || 0),
            Number(c.gp || 0),
            Number(c.gpPercent || 0).toFixed(2),
            Number(c.opportunityCount || 0)
        ]);
        const csv = [header, ...rows]
            .map((r) => r.map((cell) => {
                const s = String(cell ?? '');
                if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
                return s;
            }).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().slice(0, 10);
        a.download = `gp_report_${gpFilterType}_${dateStr}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
    };

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

                if (user?.role === 'Sales Executive' && userId) {
                    try {
                        const [chRes, docRes, perfRes] = await Promise.all([
                            api.get('/dashboards/client-health'),
                            api.get('/dashboards/document-tracking?limit=10'),
                            api.get(`/dashboards/performance/${userId}?timeline=Yearly&year=${new Date().getFullYear()}`)
                        ]);
                        if (chRes?.data) setClientHealth(chRes.data);
                        if (Array.isArray(docRes?.data)) setDocTracking(docRes.data);
                        if (perfRes?.data) setPerformance(perfRes.data);
                    } catch {
                        // ignore
                    }

                    fetchMonthlyTrends();
                    fetchGPReport();
                }

                // Operations Manager specific data fetching
                if (user?.role === 'Operations Manager') {
                    try {
                        const [vendorRes, gpRes] = await Promise.all([
                            api.get(`/dashboards/operations/vendor-stats?year=${opsFiscalYear}`),
                            api.get(`/dashboards/operations/gp-stats?year=${opsFiscalYear}`)
                        ]);
                        if (Array.isArray(vendorRes?.data)) setOpsVendorStats(vendorRes.data);
                        if (Array.isArray(gpRes?.data)) setOpsGpStats(gpRes.data);
                    } catch {
                        // ignore
                    }
                }

                // Sales Manager specific data fetching
                if (user?.role === 'Sales Manager') {
                    try {
                        const [teamRes, perfRes] = await Promise.all([
                            api.get('/dashboards/sales-manager/team-members'),
                            api.get(`/dashboards/sales-manager/monthly-performance?userId=${smSelectedMember}`)
                        ]);
                        if (Array.isArray(teamRes?.data)) setSmTeamMembers(teamRes.data);
                        if (Array.isArray(perfRes?.data)) setSmMonthlyPerf(perfRes.data);
                    } catch {
                        // ignore
                    }
                }

                // Finance Manager specific data fetching
                if (user?.role === 'Finance Manager') {
                    try {
                        let timeline = 'thisYear';
                        if (finFilterType === 'month') timeline = `month-${finSelectedMonth}`;
                        else if (finFilterType === 'quarter') timeline = `quarter-${finSelectedQuarter}`;

                        const [clientRes, vendorRes] = await Promise.all([
                            api.get(`/dashboards/finance/client-gp?timeline=${timeline}`),
                            api.get(`/dashboards/finance/vendor-expenses?timeline=${timeline}`)
                        ]);
                        if (clientRes?.data?.clientData) setFinClientGP(clientRes.data.clientData);
                        if (vendorRes?.data?.vendorData) setFinVendorExp(vendorRes.data.vendorData);
                    } catch {
                        // ignore
                    }
                }

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

        if (!user) return;

        let intervalId = null;
        const start = () => {
            fetchDashboard();
            const seconds = dashboardRefreshSeconds;
            const ms = seconds <= 0 ? 0 : Math.max(3, seconds) * 1000;
            if (ms > 0) intervalId = setInterval(fetchDashboard, ms);
        };
        const stop = () => {
            if (intervalId) clearInterval(intervalId);
            intervalId = null;
        };

        const onSettingsUpdated = () => {
            stop();
            start();
        };

        start();
        window.addEventListener('userSettingsUpdated', onSettingsUpdated);
        return () => {
            stop();
            window.removeEventListener('userSettingsUpdated', onSettingsUpdated);
        };
    }, [user, dashboardRefreshSeconds]);

    const performanceTarget = Number(performance?.target) || 0;
    const performanceAchieved = Number(performance?.achieved) || 0;
    const performancePct = performanceTarget > 0 ? (performanceAchieved / performanceTarget) * 100 : 0;
    const performanceDiff = performanceAchieved - performanceTarget;

    const handleApprove = async (item) => {
        modal.confirm({
            title: 'Approve Item',
            message: (
                <div>
                    Are you sure you want to approve this item?
                    <div style={{ marginTop: '8px', color: '#475569' }}>
                        <strong>Adhoc ID:</strong> {item.opportunityId || item.programName || 'N/A'}
                    </div>
                </div>
            ),
            confirmText: 'Continue',
            cancelText: 'Cancel',
            type: 'info',
            onConfirm: async () => {
                modal.confirm({
                    title: 'Final Confirmation',
                    message: 'Approve this item? This action will update the status immediately.',
                    confirmText: 'Approve',
                    cancelText: 'Cancel',
                    type: 'info',
                    onConfirm: async () => {
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
                            modal.alert({
                                title: 'Approved',
                                message: 'Item approved successfully.',
                                okText: 'Close',
                                type: 'info'
                            });
                            window.location.reload();
                        } catch (error) {
                            modal.alert({
                                title: 'Approval Failed',
                                message: error.response?.data?.error || error.message || 'Error approving item',
                                okText: 'Close',
                                type: 'danger'
                            });
                        }
                    }
                });
            }
        });
    };

    const handleReject = async (item) => {
        modal.prompt({
            title: 'Reject Item',
            message: (
                <div>
                    Please enter the rejection reason.
                    <div style={{ marginTop: '8px', color: '#475569' }}>
                        <strong>Adhoc ID:</strong> {item.opportunityId || item.programName || 'N/A'}
                    </div>
                </div>
            ),
            placeholder: 'Rejection reason',
            inputType: 'textarea',
            confirmText: 'Continue',
            cancelText: 'Cancel',
            onSubmit: async (reason) => {
                const finalReason = (reason || '').trim();
                if (!finalReason) return;

                modal.confirm({
                    title: 'Final Confirmation',
                    message: 'Reject this item? This action will update the status immediately.',
                    confirmText: 'Reject',
                    cancelText: 'Cancel',
                    type: 'warning',
                    onConfirm: async () => {
                        try {
                            if (item.opportunityId) {
                                await api.put(`/opportunities/${item._id}`, {
                                    opportunityStatus: 'Rejected',
                                    rejectedBy: user.id,
                                    rejectedAt: new Date(),
                                    rejectionReason: finalReason
                                });
                            } else {
                                await api.put(`/programs/${item._id}`, {
                                    trainingStatus: 'Rejected',
                                    rejectedBy: user.id,
                                    rejectedAt: new Date(),
                                    rejectionReason: finalReason
                                });
                            }
                            modal.alert({
                                title: 'Rejected',
                                message: 'Item rejected successfully.',
                                okText: 'Close',
                                type: 'info'
                            });
                            window.location.reload();
                        } catch (error) {
                            modal.alert({
                                title: 'Rejection Failed',
                                message: error.response?.data?.error || error.message || 'Error rejecting item',
                                okText: 'Close',
                                type: 'danger'
                            });
                        }
                    }
                });
            }
        });
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
                    modal.alert({
                        title: 'Validation',
                        message: 'Please select a quarter for Quarterly period.',
                        okText: 'Close',
                        type: 'warning'
                    });
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
        const handleOpsFiscalYearChange = async (year) => {
            setOpsFiscalYear(year);
            try {
                const [vendorRes, gpRes] = await Promise.all([
                    api.get(`/dashboards/operations/vendor-stats?year=${year}`),
                    api.get(`/dashboards/operations/gp-stats?year=${year}`)
                ]);
                if (Array.isArray(vendorRes?.data)) setOpsVendorStats(vendorRes.data);
                if (Array.isArray(gpRes?.data)) setOpsGpStats(gpRes.data);
            } catch {
                // ignore
            }
        };

        return (
            <div className="dashboard">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Operations Dashboard</h1>
                    <NotificationBell user={user} />
                </div>

                {/* KPI Cards */}
                <div className="dashboard-grid">
                    <DashboardCard title="Today's Sessions" count={data?.todaysSessions?.length || 0} />
                    <DashboardCard title="Upcoming Programs" count={data?.upcomingPrograms?.length || 0} />
                    <DashboardCard title="Pending Sign-offs" count={data?.pendingApprovals?.length || 0} />
                    <DashboardCard title="Delivery Risks" count={data?.deliveryRisks?.length || 0} />
                </div>

                {/* Analytics Charts Row */}
                <div className="ops-analytics-grid">
                    {/* Top Vendors by Spend */}
                    <div className="analytics-card">
                        <div className="analytics-card-header">
                            <h3>Top Vendors by Spend</h3>
                            <select
                                value={opsFiscalYear}
                                onChange={(e) => handleOpsFiscalYearChange(e.target.value)}
                                className="fiscal-year-select"
                            >
                                <option value="2023-2024">2023-2024</option>
                                <option value="2024-2025">2024-2025</option>
                                <option value="2025-2026">2025-2026</option>
                            </select>
                        </div>
                        <div className="analytics-chart-container">
                            {opsVendorStats.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart layout="vertical" data={opsVendorStats} margin={{ left: 10, right: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#6b7280' }} />
                                        <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Spend']} />
                                        <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={18} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="no-data-message">No vendor spend data available</div>
                            )}
                        </div>
                    </div>

                    {/* GP Trend */}
                    <div className="analytics-card">
                        <div className="analytics-card-header">
                            <h3>Average GP % (Monthly)</h3>
                        </div>
                        <div className="analytics-chart-container">
                            {opsGpStats.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={opsGpStats} margin={{ left: 0, right: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
                                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} unit="%" />
                                        <Tooltip formatter={(value) => [`${value}%`, 'Avg GP']} />
                                        <Bar dataKey="gp" fill="#10b981" radius={[4, 4, 0, 0]} barSize={28} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="no-data-message">No GP data available</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pending Sign-offs Table */}
                {data?.pendingApprovals && data.pendingApprovals.length > 0 && (
                    <div className="dashboard-section">
                        <h2 className="section-title">Pending Sign-offs</h2>
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

                {/* Opportunities Sent to Delivery */}
                {data?.opportunitiesForDelivery && data.opportunitiesForDelivery.length > 0 && (
                    <div className="dashboard-section">
                        <h2 className="section-title">Opportunities for Delivery</h2>
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
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.opportunitiesForDelivery.map((opp) => (
                                        <tr key={opp._id}>
                                            <td><strong>{opp.opportunityId}</strong></td>
                                            <td>{opp.clientCompanyName}</td>
                                            <td>{opp.opportunityType}</td>
                                            <td>₹{opp.expectedCommercialValue?.toLocaleString()}</td>
                                            <td>{opp.expectedStartDate ? new Date(opp.expectedStartDate).toLocaleDateString() : 'N/A'}</td>
                                            <td>{opp.salesExecutiveId?.name || opp.salesManagerId?.name || 'N/A'}</td>
                                            <td>
                                                <a href={`/opportunities/${opp._id}?tab=delivery`} className="view-link">View</a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Delivery Risks */}
                {data?.deliveryRisks && data.deliveryRisks.length > 0 && (
                    <div className="dashboard-section">
                        <h2 className="section-title risk-title">Delivery Risks</h2>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Program Name</th>
                                        <th>Client</th>
                                        <th>Status</th>
                                        <th>Deviation Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.deliveryRisks.map((risk) => (
                                        <tr key={risk._id}>
                                            <td>{risk.programName || risk.courseName || 'N/A'}</td>
                                            <td>{risk.billingClient || risk.endClient || 'N/A'}</td>
                                            <td><span className="status-badge danger">{risk.deliveryStatus}</span></td>
                                            <td>{risk.deviationReason || 'N/A'}</td>
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
        const handleFinFilterChange = async (type, value) => {
            if (type === 'filterType') setFinFilterType(value);
            else if (type === 'month') setFinSelectedMonth(value);
            else if (type === 'quarter') setFinSelectedQuarter(value);

            let timeline = 'thisYear';
            const ft = type === 'filterType' ? value : finFilterType;
            const sm = type === 'month' ? value : finSelectedMonth;
            const sq = type === 'quarter' ? value : finSelectedQuarter;

            if (ft === 'month') timeline = `month-${sm}`;
            else if (ft === 'quarter') timeline = `quarter-${sq}`;

            try {
                const [clientRes, vendorRes] = await Promise.all([
                    api.get(`/dashboards/finance/client-gp?timeline=${timeline}`),
                    api.get(`/dashboards/finance/vendor-expenses?timeline=${timeline}`)
                ]);
                if (clientRes?.data?.clientData) setFinClientGP(clientRes.data.clientData);
                if (vendorRes?.data?.vendorData) setFinVendorExp(vendorRes.data.vendorData);
            } catch {
                // ignore
            }
        };

        const finMonths = [
            { value: 0, label: 'January' }, { value: 1, label: 'February' }, { value: 2, label: 'March' },
            { value: 3, label: 'April' }, { value: 4, label: 'May' }, { value: 5, label: 'June' },
            { value: 6, label: 'July' }, { value: 7, label: 'August' }, { value: 8, label: 'September' },
            { value: 9, label: 'October' }, { value: 10, label: 'November' }, { value: 11, label: 'December' }
        ];

        return (
            <div className="dashboard">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Finance Manager Dashboard</h1>
                    <NotificationBell user={user} />
                </div>

                {/* GP Summary Cards */}
                <div className="dashboard-grid">
                    <DashboardCard title="Total Revenue" value={`₹${(data?.totalRevenue || 0).toLocaleString()}`} />
                    <DashboardCard title="Total Expenses" value={`₹${(data?.totalExpenses || 0).toLocaleString()}`} />
                    <DashboardCard title="Gross Profit" value={`₹${(data?.grossProfit || 0).toLocaleString()}`} />
                    <DashboardCard title="GP %" value={`${(data?.gpPercent || 0).toFixed(1)}%`} />
                    <DashboardCard title="Opportunities" count={data?.totalOpportunities || 0} />
                    <DashboardCard title="Cash Position" value={`₹${(data?.cashPosition || 0).toLocaleString()}`} />
                </div>

                {/* Filter Controls */}
                <div className="ops-analytics-grid" style={{ marginBottom: '20px' }}>
                    <div className="analytics-card">
                        <div className="analytics-card-header">
                            <h3>Client-wise GP Analysis</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className={`btn-small ${finFilterType === 'month' ? 'btn-primary' : ''}`}
                                    onClick={() => handleFinFilterChange('filterType', 'month')}
                                >Month</button>
                                <button
                                    className={`btn-small ${finFilterType === 'quarter' ? 'btn-primary' : ''}`}
                                    onClick={() => handleFinFilterChange('filterType', 'quarter')}
                                >Quarter</button>
                                <button
                                    className={`btn-small ${finFilterType === 'year' ? 'btn-primary' : ''}`}
                                    onClick={() => handleFinFilterChange('filterType', 'year')}
                                >Year</button>
                                {finFilterType === 'month' && (
                                    <select
                                        value={finSelectedMonth}
                                        onChange={(e) => handleFinFilterChange('month', parseInt(e.target.value))}
                                        className="fiscal-year-select"
                                    >
                                        {finMonths.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                )}
                                {finFilterType === 'quarter' && (
                                    <select
                                        value={finSelectedQuarter}
                                        onChange={(e) => handleFinFilterChange('quarter', e.target.value)}
                                        className="fiscal-year-select"
                                    >
                                        <option value="Q1">Q1</option>
                                        <option value="Q2">Q2</option>
                                        <option value="Q3">Q3</option>
                                        <option value="Q4">Q4</option>
                                    </select>
                                )}
                            </div>
                        </div>
                        <div className="analytics-chart-container">
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={finClientGP.slice(0, 10)} margin={{ bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="clientName" angle={-45} textAnchor="end" tick={{ fontSize: 10 }} height={80} />
                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                                    <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']} />
                                    <Bar dataKey="totalRevenue" name="Revenue" fill="#3b82f6" />
                                    <Bar dataKey="totalExpenses" name="Expenses" fill="#ef4444" />
                                    <Bar dataKey="gp" name="GP" fill="#10b981" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="analytics-card">
                        <div className="analytics-card-header">
                            <h3>Vendor-wise Expenses</h3>
                        </div>
                        <div className="analytics-chart-container">
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={finVendorExp.slice(0, 10)} margin={{ bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="vendorName" angle={-45} textAnchor="end" tick={{ fontSize: 10 }} height={80} />
                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                                    <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Expense']} />
                                    <Bar dataKey="totalExpense" name="Total Expense" fill="#ef4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Existing Finance Cards */}
                <div className="dashboard-grid">
                    <DashboardCard title="Pending Invoices" count={data?.pendingInvoices?.length || 0} />
                    <DashboardCard title="Overdue Receivables" count={data?.overdueReceivables?.length || 0} />
                    <DashboardCard title="Tax Compliant" count={data?.taxComplianceStatus?.compliant || 0} />
                    <DashboardCard title="Non-Compliant TDS" count={data?.nonCompliantTds || 0} />
                </div>

                {/* TDS Summary Table */}
                {data?.tdsSummary && data.tdsSummary.length > 0 && (
                    <div className="dashboard-section">
                        <h2 className="section-title">TDS Summary by Section</h2>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>TDS Section</th>
                                        <th style={{ textAlign: 'right' }}>Total TDS</th>
                                        <th style={{ textAlign: 'right' }}>Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.tdsSummary.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item._id || 'Unknown'}</td>
                                            <td style={{ textAlign: 'right' }}>₹{(item.totalTds || 0).toLocaleString()}</td>
                                            <td style={{ textAlign: 'right' }}>{item.count || 0}</td>
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

                <div className="dashboard-header">
                    <h1 className="dashboard-title">Director Dashboard</h1>
                    <NotificationBell user={user} />
                </div>

                {/* Financial Overview Cards */}
                <div className="dashboard-grid">
                    <DashboardCard title="Total Revenue" value={`₹${(data?.revenue || 0).toLocaleString()}`} />
                    <DashboardCard title="Total Expenses" value={`₹${(data?.expenses || 0).toLocaleString()}`} />
                    <DashboardCard title="Profit/Loss" value={`₹${(data?.profitLoss || 0).toLocaleString()}`} />
                    <DashboardCard title="Profit Margin" value={`${(data?.profitMargin || 0).toFixed(1)}%`} />
                    <DashboardCard title="Receivables" value={`₹${(data?.receivables || 0).toLocaleString()}`} />
                    <DashboardCard title="Payables" value={`₹${(data?.payables || 0).toLocaleString()}`} />
                </div>

                {/* Company Stats Cards */}
                <div className="dashboard-grid" style={{ marginTop: '20px' }}>
                    <DashboardCard title="Total Clients" count={data?.totalClients || 0} />
                    <DashboardCard title="Total Opportunities" count={data?.totalOpportunities || 0} />
                    <DashboardCard title="Won Deals" count={data?.wonOpportunities || 0} />
                    <DashboardCard title="Active Pipeline" count={data?.activeOpportunities || 0} />
                    <DashboardCard title="Risk Alerts" count={data?.riskAlerts?.length || 0} />
                </div>

                {/* Monthly Performance Charts */}
                <div className="ops-analytics-grid" style={{ marginTop: '20px' }}>
                    <div className="analytics-card">
                        <div className="analytics-card-header">
                            <h3>Monthly Revenue Trend</h3>
                        </div>
                        <div className="analytics-chart-container">
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={data?.monthlyData || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                                    <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']} />
                                    <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="analytics-card">
                        <div className="analytics-card-header">
                            <h3>Monthly Opportunities</h3>
                        </div>
                        <div className="analytics-chart-container">
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={data?.monthlyData || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="opportunities" name="Created" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="won" name="Won" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Team Performance Table */}
                {data?.teamPerformance && data.teamPerformance.length > 0 && (
                    <div className="dashboard-section" style={{ marginTop: '20px' }}>
                        <h2 className="section-title">Top Performers</h2>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Role</th>
                                        <th style={{ textAlign: 'right' }}>Opportunities</th>
                                        <th style={{ textAlign: 'right' }}>Total Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.teamPerformance.map((member, idx) => (
                                        <tr key={idx}>
                                            <td>{member.name}</td>
                                            <td>{member.role}</td>
                                            <td style={{ textAlign: 'right' }}>{member.totalOpportunities}</td>
                                            <td style={{ textAlign: 'right' }}>₹{(member.totalValue || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Set Target Form */}
                <div className="dashboard-section" style={{ marginTop: '20px' }}>
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

                {data?.aiInsight && <div className="ai-insight"><div className="ai-insight-label">AI Insight</div><div className="ai-insight-text">{data.aiInsight}</div></div>}
            </div>
        );
    }

    // Sales Manager Dashboard
    if (user.role === 'Sales Manager') {
        const handleSmMemberChange = async (memberId) => {
            setSmSelectedMember(memberId);
            try {
                const perfRes = await api.get(`/dashboards/sales-manager/monthly-performance?userId=${memberId}`);
                if (Array.isArray(perfRes?.data)) setSmMonthlyPerf(perfRes.data);
            } catch {
                // ignore
            }
        };

        const handleSmEditTarget = (memberId, currentTarget, period = 'Yearly') => {
            setSmEditingTarget(memberId);
            setSmTargetValue(currentTarget || '');
            setSmTargetPeriod(period);
        };

        const handleSmSaveTarget = async (memberId) => {
            try {
                await api.put(`/dashboards/sales-manager/set-target/${memberId}`, {
                    period: smTargetPeriod,
                    year: new Date().getFullYear(),
                    amount: parseFloat(smTargetValue)
                });
                setSmEditingTarget(null);
                // Refresh team members to get updated targets
                const teamRes = await api.get('/dashboards/sales-manager/team-members');
                if (Array.isArray(teamRes?.data)) setSmTeamMembers(teamRes.data);
            } catch {
                // ignore
            }
        };

        return (
            <div className="dashboard">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Sales Manager Dashboard</h1>
                    <NotificationBell user={user} />
                </div>

                {/* KPI Cards */}
                <div className="dashboard-grid">
                    <DashboardCard title="Total Clients" count={data?.totalClients || 0} />
                    <DashboardCard title="Team Members" count={data?.teamMembersCount || 0} />
                    <DashboardCard title="In Progress" count={data?.inProgressOpportunities || 0} />
                    <DashboardCard title="Completed" count={data?.completedOpportunities || 0} />
                    <DashboardCard title="PO Received" count={data?.poCount || 0} />
                    <DashboardCard title="Invoiced" count={data?.invoiceCount || 0} />
                </div>

                {/* Monthly Performance Charts */}
                <div className="ops-analytics-grid">
                    <div className="analytics-card">
                        <div className="analytics-card-header">
                            <h3>Opportunities by Month</h3>
                            <select
                                value={smSelectedMember}
                                onChange={(e) => handleSmMemberChange(e.target.value)}
                                className="fiscal-year-select"
                            >
                                <option value="all">All Team Members</option>
                                {smTeamMembers.map(m => (
                                    <option key={m._id} value={m._id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="analytics-chart-container">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={smMonthlyPerf}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
                                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                                    <Tooltip />
                                    <Bar dataKey="inProgress" name="In Progress" fill="#fbbf24" stackId="a" />
                                    <Bar dataKey="completed" name="Completed" fill="#10b981" stackId="a" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="analytics-card">
                        <div className="analytics-card-header">
                            <h3>Revenue by Month</h3>
                        </div>
                        <div className="analytics-chart-container">
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={smMonthlyPerf}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
                                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                                    <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']} />
                                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Set Team Targets */}
                <div className="dashboard-section">
                    <h2 className="section-title">Set Team Targets</h2>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Team Member</th>
                                    <th>Period</th>
                                    <th style={{ textAlign: 'right' }}>Target Amount (₹)</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {smTeamMembers.map(member => {
                                    const currentTarget = member.targets?.find(t => t.year === new Date().getFullYear() && t.period === smTargetPeriod)?.amount || 0;
                                    return (
                                        <tr key={member._id}>
                                            <td>{member.name}</td>
                                            <td>
                                                {smEditingTarget === member._id ? (
                                                    <select
                                                        value={smTargetPeriod}
                                                        onChange={(e) => setSmTargetPeriod(e.target.value)}
                                                        className="form-control"
                                                        style={{ width: 'auto', padding: '4px 8px' }}
                                                    >
                                                        <option value="Yearly">Yearly</option>
                                                        <option value="Half-Yearly">Half-Yearly</option>
                                                        <option value="Quarterly">Quarterly</option>
                                                    </select>
                                                ) : (
                                                    <span>{smTargetPeriod}</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {smEditingTarget === member._id ? (
                                                    <input
                                                        type="number"
                                                        value={smTargetValue}
                                                        onChange={(e) => setSmTargetValue(e.target.value)}
                                                        className="form-control"
                                                        style={{ width: '120px', textAlign: 'right', padding: '4px 8px' }}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <strong>₹{currentTarget.toLocaleString()}</strong>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {smEditingTarget === member._id ? (
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button onClick={() => handleSmSaveTarget(member._id)} className="btn-small btn-primary">Save</button>
                                                        <button onClick={() => setSmEditingTarget(null)} className="btn-small">Cancel</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => handleSmEditTarget(member._id, currentTarget, smTargetPeriod)} className="btn-small">Edit</button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pipeline Chart */}
                {data?.pipeline && (
                    <div className="combined-charts-container">
                        <div className="combined-charts-header">
                            <div className="combined-charts-title">Sales Pipeline</div>
                        </div>
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
                    </div>
                )}

                {/* Recent Opportunities */}
                {data?.recentOpportunities && data.recentOpportunities.length > 0 && (
                    <div className="dashboard-section">
                        <h2 className="section-title">Recent Opportunities</h2>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Adhoc ID</th>
                                        <th>Client</th>
                                        <th>Type</th>
                                        <th>Value</th>
                                        <th>Status</th>
                                        <th>Sales Executive</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.recentOpportunities.slice(0, 10).map((opp) => (
                                        <tr key={opp._id}>
                                            <td><a href={`/opportunities/${opp._id}`} className="view-link">{opp.opportunityId}</a></td>
                                            <td>{opp.clientCompanyName || opp.billingClient || 'N/A'}</td>
                                            <td>{opp.opportunityType}</td>
                                            <td>₹{(opp.expectedCommercialValue || opp.tov || 0).toLocaleString()}</td>
                                            <td><span className="status-badge">{opp.opportunityStatus}</span></td>
                                            <td>{opp.salesExecutiveId?.name || 'N/A'}</td>
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

    // DEFAULT: Sales Executive
    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <NotificationBell user={user} />
            </div>

            {user?.role === 'Sales Executive' && (
                <div className="dashboard-section se-overview">
                    <div className="page-header se-overview-header" style={{ marginBottom: '10px' }}>
                        <h2 className="section-title" style={{ margin: 0 }}>Sales Executive Overview</h2>
                        <div className="se-currency-toggle" style={{ display: 'flex', gap: '8px' }}>
                            <button
                                type="button"
                                className={currency === 'INR' ? 'btn-small btn-primary' : 'btn-small'}
                                onClick={() => setCurrency('INR')}
                            >
                                INR
                            </button>
                            <button
                                type="button"
                                className={currency === 'USD' ? 'btn-small btn-primary' : 'btn-small'}
                                onClick={() => setCurrency('USD')}
                            >
                                USD
                            </button>
                        </div>
                    </div>

                    <div className="dashboard-grid">
                        <DashboardCard title="Clients" value={`${(clientHealth.active || 0) + (clientHealth.mid || 0) + (clientHealth.inactive || 0)}`} />
                        <DashboardCard title="Active" count={clientHealth.active || 0} />
                        <DashboardCard title="Mid" count={clientHealth.mid || 0} />
                        <DashboardCard title="Inactive" count={clientHealth.inactive || 0} />
                    </div>

                    <div className="form-card" style={{ marginTop: '10px' }}>
                        <div className="page-header se-panel-header" style={{ marginBottom: '10px' }}>
                            <h2 style={{ margin: 0 }}>Revenue Target Progress (Yearly)</h2>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <div style={{ fontSize: '12px', opacity: 0.8 }}>Target</div>
                                <div style={{ fontSize: '18px', fontWeight: 800 }}>{formatMoney(performanceTarget)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', opacity: 0.8 }}>Achieved</div>
                                <div style={{ fontSize: '18px', fontWeight: 800 }}>{formatMoney(performanceAchieved)}</div>
                            </div>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                            <div style={{ height: '10px', background: 'rgba(15,23,42,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                                <div
                                    style={{
                                        height: '10px',
                                        width: `${Math.min(100, Math.max(0, performancePct))}%`,
                                        background: performancePct >= 100 ? 'var(--color-success)' : 'var(--color-primary)'
                                    }}
                                />
                            </div>
                            <div style={{ marginTop: '6px', fontSize: '12px', textAlign: 'right', opacity: 0.9 }}>
                                {performanceTarget > 0
                                    ? (performanceDiff >= 0
                                        ? `Exceeded by ${formatMoney(performanceDiff)}`
                                        : `Lagging by ${formatMoney(Math.abs(performanceDiff))}`)
                                    : 'No target set'}
                            </div>
                        </div>
                    </div>

                    {Array.isArray(docTracking) && docTracking.length > 0 && (
                        <div className="dashboard-section" style={{ marginTop: '10px' }}>
                            <h2 className="section-title">Document Status Tracking</h2>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Adhoc ID</th>
                                            <th>Client</th>
                                            <th style={{ textAlign: 'center' }}>Proposal</th>
                                            <th style={{ textAlign: 'center' }}>PO</th>
                                            <th style={{ textAlign: 'center' }}>Invoice</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {docTracking.map((row) => (
                                            <tr key={row._id}>
                                                <td><strong>{row.opportunityId}</strong></td>
                                                <td>{row.clientName}</td>
                                                <td className={row.proposalPresent ? 'se-doc-ok' : 'se-doc-miss'} style={{ textAlign: 'center' }}>{row.proposalPresent ? '✓' : '—'}</td>
                                                <td className={row.poPresent ? 'se-doc-ok' : 'se-doc-miss'} style={{ textAlign: 'center' }}>{row.poPresent ? '✓' : '—'}</td>
                                                <td className={row.invoicePresent ? 'se-doc-ok' : 'se-doc-miss'} style={{ textAlign: 'center' }}>{row.invoicePresent ? '✓' : '—'}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn-small btn-primary"
                                                        onClick={() => window.location.href = `/opportunities/${row._id}?tab=documents`}
                                                    >
                                                        Open
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="dashboard-charts-grid se-analytics-grid" style={{ marginTop: '10px' }}>
                        <div className="form-card" style={{ margin: 0 }}>
                            <div className="page-header se-panel-header" style={{ marginBottom: '10px' }}>
                                <h2 style={{ margin: 0 }}>Monthly Trends</h2>
                                <div style={{ fontSize: '12px', opacity: 0.75 }}>Opportunities + Revenue</div>
                            </div>
                            <div style={{ width: '100%', height: 260 }}>
                                <ResponsiveContainer>
                                    <AreaChart data={Array.isArray(monthlyTrends) ? monthlyTrends : []} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                                        <CartesianGrid stroke="rgba(15,23,42,0.08)" strokeDasharray="3 3" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} width={42} />
                                        <Tooltip formatter={(v, n) => {
                                            if (n === 'revenue') return [formatMoney(v), 'Revenue'];
                                            return [v, 'Opportunities'];
                                        }} />
                                        <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" fill="rgba(99, 91, 255, 0.18)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="opportunities" stroke="rgba(14,165,233,0.95)" fill="rgba(14,165,233,0.14)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="form-card" style={{ margin: 0 }}>
                            <div className="page-header se-panel-header" style={{ marginBottom: '10px' }}>
                                <h2 style={{ margin: 0 }}>GP Report</h2>
                                <button type="button" className="btn-small btn-primary" onClick={exportGpCsv} disabled={gpLoading || !gpReport?.clientData?.length}>
                                    Export CSV
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button type="button" className={gpFilterType === 'month' ? 'btn-small btn-primary' : 'btn-small'} onClick={() => { setGpFilterType('month'); fetchGPReport({ type: 'month' }); }}>Month</button>
                                    <button type="button" className={gpFilterType === 'quarter' ? 'btn-small btn-primary' : 'btn-small'} onClick={() => { setGpFilterType('quarter'); fetchGPReport({ type: 'quarter' }); }}>Quarter</button>
                                    <button type="button" className={gpFilterType === 'fiscal_year' ? 'btn-small btn-primary' : 'btn-small'} onClick={() => { setGpFilterType('fiscal_year'); fetchGPReport({ type: 'fiscal_year' }); }}>Year</button>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                    {gpFilterType === 'month' && (
                                        <select className="form-control" value={gpMonth} onChange={(e) => { const v = Number(e.target.value); setGpMonth(v); fetchGPReport({ type: 'month', month: v }); }}>
                                            {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    )}
                                    {gpFilterType === 'quarter' && (
                                        <select className="form-control" value={gpQuarter} onChange={(e) => { const v = e.target.value; setGpQuarter(v); fetchGPReport({ type: 'quarter', quarter: v }); }}>
                                            {['Q1','Q2','Q3','Q4'].map((q) => (
                                                <option key={q} value={q}>{q}</option>
                                            ))}
                                        </select>
                                    )}
                                    <input className="form-control" type="number" value={gpYear} onChange={(e) => { const v = Number(e.target.value); setGpYear(v); fetchGPReport({ year: v }); }} style={{ width: 120 }} />
                                </div>
                            </div>

                            {gpReport?.summary && (
                                <div className="dashboard-grid" style={{ marginBottom: '10px' }}>
                                    <DashboardCard title="Revenue" value={formatMoney(gpReport.summary.totalRevenue || 0)} />
                                    <DashboardCard title="Expenses" value={formatMoney(gpReport.summary.totalExpenses || 0)} />
                                    <DashboardCard title="Gross Profit" value={formatMoney(gpReport.summary.grossProfit || 0)} />
                                    <DashboardCard title="GP %" value={`${Number(gpReport.summary.gpPercent || 0).toFixed(2)}%`} />
                                </div>
                            )}

                            <div className="table-container" style={{ marginBottom: 0 }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>S.No</th>
                                            <th>Client</th>
                                            <th>Revenue</th>
                                            <th>Expenses</th>
                                            <th>GP %</th>
                                            <th>Opp Count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(gpReport?.clientData || []).slice(0, 10).map((c) => (
                                            <tr key={`${c.sno}-${c.clientName}`}>
                                                <td>{c.sno}</td>
                                                <td><strong>{c.clientName}</strong></td>
                                                <td>{formatMoney(c.totalRevenue)}</td>
                                                <td>{formatMoney(c.totalExpenses)}</td>
                                                <td>{Number(c.gpPercent || 0).toFixed(2)}%</td>
                                                <td>{c.opportunityCount}</td>
                                            </tr>
                                        ))}
                                        {!gpLoading && (!gpReport?.clientData || gpReport.clientData.length === 0) && (
                                            <tr><td colSpan="6" style={{ textAlign: 'center' }}>No data</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
