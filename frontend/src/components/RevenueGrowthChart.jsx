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
        <div className="revenue-growth-chart-container">
            <div className="chart-header">
                <div className="chart-title-bar">REVENUE ANALYTICS ({new Date().getFullYear()})</div>
                <div className="chart-subtitle">Market performance & volume indicators</div>
            </div>

            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={data} margin={{ top: 10, right: 12, bottom: 10, left: 12 }}>
                        <defs>
                            {/* Cyan Area Gradient */}
                            <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                            </linearGradient>
                            {/* Volume Bar Gradient */}
                            <linearGradient id="volumeBar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity={0.50} />
                                <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity={0.12} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid stroke="rgba(15, 23, 42, 0.08)" vertical={true} horizontal={true} />

                        <XAxis
                            dataKey="name"
                            axisLine={{ stroke: 'rgba(15, 23, 42, 0.12)' }}
                            tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 700 }}
                            dy={10}
                        />

                        {/* LEFT AXIS: CUMULATIVE (Growth) */}
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--color-primary)', fontSize: 10, fontWeight: 700 }}
                            tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                        />

                        {/* RIGHT AXIS: MONTHLY (Volume) */}
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--color-secondary)', fontSize: 10, fontWeight: 700 }}
                            tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                        />

                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
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
                            stroke="rgba(15, 23, 42, 0.35)"
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
                            stroke="var(--color-primary)"
                            strokeWidth={3}
                            fill="url(#cyanArea)"
                            dot={false} // NO DOTS
                            activeDot={{ r: 6, fill: 'var(--color-primary)', stroke: 'var(--color-background)' }}
                            style={{ filter: 'drop-shadow(0 14px 26px rgba(99, 91, 255, 0.22))' }}
                            isAnimationActive={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>

                <div className="chart-legend">
                    <div className="legend-item">
                        <span className="legend-label">Target (Y)</span>
                        <span className="legend-value">₹{(totalTarget / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-label">Current (YTD)</span>
                        <span className="legend-value highlight">₹{(currentActual / 100000).toFixed(1)}L</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-label">Gap</span>
                        <span className="legend-value">{gapPercent.toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevenueGrowthChart;
