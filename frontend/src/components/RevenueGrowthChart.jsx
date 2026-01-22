import React, { useState, useEffect } from 'react';
import {
    ComposedChart,
    Area,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import api from '../services/api';
import './SalesPipelineChart.css'; // Inheriting base styles

const RevenueGrowthChart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const currentYear = new Date().getFullYear();

            // Parallel fetch using verified api service
            const [dealsApp, targetsApp] = await Promise.allSettled([
                api.get('/deals'),
                api.get(`/revenue-targets?year=${currentYear}`)
            ]);

            const deals = dealsApp.status === 'fulfilled' ? dealsApp.value.data : [];
            const targets = targetsApp.status === 'fulfilled' ? targetsApp.value.data : [];

            const monthlyData = processRevenueData(deals, targets);
            setData(monthlyData);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setLoading(false);
        }
    };

    const processRevenueData = (deals, targets) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();
        const currentMonthIndex = new Date().getMonth();

        const rawMonthly = months.map(month => ({ name: month, actual: 0, target: 0 }));

        deals.forEach(deal => {
            if (!deal.createdAt) return;
            const date = new Date(deal.createdAt);
            if (date.getFullYear() === currentYear) {
                const value = Number(deal.totalOrderValue) || 0;
                rawMonthly[date.getMonth()].actual += value;
            }
        });

        targets.forEach(t => {
            if (t.year === currentYear) {
                if (t.period === 'Quarterly') {
                    const startMonth = (t.quarter - 1) * 3;
                    const monthlyAmount = t.amount / 3;
                    for (let i = 0; i < 3; i++) {
                        if (rawMonthly[startMonth + i]) {
                            rawMonthly[startMonth + i].target += monthlyAmount;
                        }
                    }
                } else if (t.period === 'Yearly') {
                    const monthlyAmount = t.amount / 12;
                    rawMonthly.forEach(d => d.target += monthlyAmount);
                }
            }
        });

        let runningActual = 0;
        let runningTarget = 0;

        return rawMonthly.map((m, index) => {
            runningActual += m.actual;
            runningTarget += m.target;
            const isFuture = index > currentMonthIndex;

            return {
                name: m.name,
                // Right Axis: Monthly "Volume"
                monthlyActual: isFuture ? null : m.actual,
                // Left Axis: Cumulative "Price"
                cumulativeActual: isFuture ? null : runningActual,
                cumulativeTarget: runningTarget
            };
        });
    };

    if (loading) return <div className="p-4 text-center text-slate-400">Loading Market Data...</div>;

    const validPoints = data.filter(d => d.cumulativeActual !== null);
    const currentActual = validPoints.length > 0 ? validPoints[validPoints.length - 1].cumulativeActual : 0;
    const totalTarget = data.length > 0 ? data[data.length - 1].cumulativeTarget : 0;
    const gapPercent = totalTarget > 0 ? (currentActual / totalTarget) * 100 : 0;

    return (
        <div className="revenue-growth-chart-container" style={{
            background: 'linear-gradient(180deg, #0b1121 0%, #162445 100%)', // Deep Navy/Blue
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 0 40px rgba(0, 0, 0, 0.6) inset, 0 5px 15px rgba(0,0,0,0.5)',
            border: '1px solid rgba(56, 189, 248, 0.1)', // Subtle Cyan Border
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{ marginBottom: '20px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                <h3 style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    color: '#38bdf8', // Light Cyan
                    margin: '0 0 6px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }}></span>
                    REVENUE ANALYTICS ({new Date().getFullYear()})
                </h3>
                <div style={{ fontSize: '11px', color: '#94a3b8', paddingLeft: '16px' }}>
                    MARKET PERFORMANCE & VOLUME INDICATORS
                </div>
            </div>

            <div style={{ flex: 1, minHeight: '450px', width: '100%' }}>
                <ResponsiveContainer width="100%" height={450}>
                    <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <defs>
                            {/* Cyan Area Gradient */}
                            <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} /> {/* Cyan-500 */}
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                            </linearGradient>
                            {/* Volume Bar Gradient */}
                            <linearGradient id="volumeBar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} /> {/* Blue-500 */}
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid stroke="rgba(255, 255, 255, 0.08)" vertical={true} horizontal={true} />

                        <XAxis
                            dataKey="name"
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                            dy={10}
                        />

                        {/* LEFT AXIS: CUMULATIVE (Growth) */}
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#38bdf8', fontSize: 10 }} // Cyan text for Left
                            tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                        />

                        {/* RIGHT AXIS: MONTHLY (Volume) */}
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6366f1', fontSize: 10 }} // Indigo text for Right
                            tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                        />

                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                            itemStyle={{ fontSize: '12px' }}
                            formatter={(value, name) => {
                                if (name === 'Cumulative Growth') return [`₹${(value / 100000).toFixed(2)}L`, name];
                                if (name === 'Monthly Volume') return [`₹${(value / 100000).toFixed(2)}L`, name];
                                return [value, name];
                            }}
                        />

                        <Legend verticalAlign="top" height={36} iconType="circle" />

                        {/* 1. VOLUME BARS (Right Axis) - Background Layout */}
                        <Bar
                            yAxisId="right"
                            dataKey="monthlyActual"
                            name="Monthly Volume"
                            barSize={30}
                            fill="url(#volumeBar)"
                            radius={[2, 2, 0, 0]}
                            isAnimationActive={false}
                        />

                        {/* 2. TARGET LINE (Left Axis) - The Benchmark */}
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="cumulativeTarget"
                            name="Target Trend"
                            stroke="#475569" // Slate-600
                            strokeWidth={1}
                            strokeDasharray="4 4"
                            dot={false}
                            activeDot={false}
                            isAnimationActive={false}
                        />

                        {/* 3. GROWTH AREA (Left Axis) - The Main Event */}
                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="cumulativeActual"
                            name="Cumulative Growth"
                            stroke="#06b6d4" // Cyan-500
                            strokeWidth={3}
                            fill="url(#cyanArea)"
                            dot={false} // NO DOTS
                            activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff' }}
                            style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))' }} // Strong Glow
                            isAnimationActive={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>

                {/* Tech Stats Footer */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '20px',
                    marginTop: '20px',
                    paddingTop: '20px',
                    borderTop: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div>
                        <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>Target (Y)</div>
                        <div style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: '600' }}>₹{(totalTarget / 100000).toFixed(1)}L</div>
                    </div>
                    <div>
                        <div style={{ color: '#38bdf8', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>Current (YTD)</div>
                        <div style={{ color: '#38bdf8', fontSize: '18px', fontWeight: '700', textShadow: '0 0 10px rgba(56, 189, 248, 0.4)' }}>
                            ₹{(currentActual / 100000).toFixed(1)}L
                        </div>
                    </div>
                    <div>
                        <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>Gap</div>
                        <div style={{ color: currentActual >= totalTarget ? '#22c55e' : '#ef4444', fontSize: '18px', fontWeight: '600' }}>
                            {gapPercent.toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevenueGrowthChart;
