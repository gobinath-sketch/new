import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import './Table.css';

const Dashboard = ({ user }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalValue: 0,
        oppCount: 0,
        winRate: 0,
        avgDealSize: 0
    });
    const [statusData, setStatusData] = useState([]);
    const [recentOpps, setRecentOpps] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await api.get('/opportunities');
            const data = res.data;
            processData(data);
        } catch (error) {
            console.error("Dashboard Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const processData = (data) => {
        if (!data || data.length === 0) {
            setStats({ totalValue: 0, oppCount: 0, winRate: 0, avgDealSize: 0 });
            return;
        }

        // 1. KPIs
        const totalValue = data.reduce((sum, item) => sum + (item.expectedCommercialValue || 0), 0);
        const oppCount = data.length;
        const wonCount = data.filter(item => item.opportunityStatus === 'Converted to Deal' || item.opportunityStatus === 'Approved').length;
        const winRate = oppCount ? ((wonCount / oppCount) * 100).toFixed(1) : 0;
        const avgDealSize = oppCount ? (totalValue / oppCount) : 0;

        setStats({
            totalValue,
            oppCount,
            winRate,
            avgDealSize
        });

        // 2. Chart Data: Status Distribution
        const statusMap = {};
        data.forEach(item => {
            const status = item.opportunityStatus || 'New';
            statusMap[status] = (statusMap[status] || 0) + 1;
        });

        const chartData = Object.keys(statusMap).map(key => ({
            name: key,
            count: statusMap[key]
        }));
        setStatusData(chartData);

        // 3. Recent Activity (Top 5)
        const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
        setRecentOpps(sorted);
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const KPICard = ({ title, value, subtext, color }) => (
        <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            borderLeft: `5px solid ${color}`,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <span style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {title}
            </span>
            <span style={{ fontSize: '2rem', fontWeight: '700', color: '#111827', marginTop: '8px' }}>
                {value}
            </span>
            {subtext && <span style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '4px' }}>{subtext}</span>}
        </div>
    );

    if (loading) return <div className="p-8 text-center">Loading Dashboard...</div>;

    return (
        <div className="dashboard-container" style={{ padding: '0 0 40px 0' }}>
            <div className="header-section" style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
                    Sales Overview
                </h1>
                <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Welcome back, {user?.name || 'Executive'}</p>
            </div>

            {/* KPI Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '24px',
                marginBottom: '40px'
            }}>
                <KPICard
                    title="Total Pipeline Value"
                    value={formatCurrency(stats.totalValue)}
                    subtext={`${stats.oppCount} Active Opportunities`}
                    color="#4f46e5"
                />
                <KPICard
                    title="Avg. Deal Size"
                    value={formatCurrency(stats.avgDealSize)}
                    color="#059669"
                />
                <KPICard
                    title="Win Rate"
                    value={`${stats.winRate}%`}
                    color="#d97706"
                />
                <KPICard
                    title="Total Opportunities"
                    value={stats.oppCount}
                    color="#dc2626"
                />
            </div>

            {/* Charts Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                gap: '24px',
                marginBottom: '40px'
            }}>
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '24px', color: '#374151' }}>Pipeline by Stage</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer>
                            <BarChart data={statusData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '24px', color: '#374151' }}>Quick Actions</h3>
                    <div style={{ display: 'grid', gap: '16px' }}>
                        <button
                            onClick={() => navigate('/opportunity-creation')}
                            style={{ padding: '16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            <span style={{ display: 'block', color: '#1e40af', fontWeight: '600', marginBottom: '4px' }}>+ New Opportunity</span>
                            <span style={{ fontSize: '0.875rem', color: '#3b82f6' }}>Create a new sales opportunity</span>
                        </button>
                        <button
                            onClick={() => navigate('/client-creation')}
                            style={{ padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            <span style={{ display: 'block', color: '#166534', fontWeight: '600', marginBottom: '4px' }}>+ Add New Client</span>
                            <span style={{ fontSize: '0.875rem', color: '#22c55e' }}>Register a new client company</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Activity Table */}
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#374151' }}>Recent Opportunities</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f9fafb' }}>
                            <tr>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Client</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Opportunity</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Value</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOpps.map((opp) => (
                                <tr key={opp._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '16px 24px', color: '#111827', fontWeight: '500' }}>{opp.clientName}</td>
                                    <td style={{ padding: '16px 24px', color: '#6b7280' }}>{opp.trainingOpportunity || opp.courseName || '-'}</td>
                                    <td style={{ padding: '16px 24px', color: '#111827', fontFamily: 'monospace' }}>{formatCurrency(opp.expectedCommercialValue)}</td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            background: opp.opportunityStatus === 'Converted to Deal' ? '#dcfce7' : '#eff6ff',
                                            color: opp.opportunityStatus === 'Converted to Deal' ? '#166534' : '#1e40af'
                                        }}>
                                            {opp.opportunityStatus}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px', color: '#6b7280' }}>
                                        {new Date(opp.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {recentOpps.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>No recent activity found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
