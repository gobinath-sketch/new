import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import './SalesPipelineChart.css';

const SalesPipelineChart = ({ pipelineData }) => {


  // Calculate pipeline stages and percentages
  const total = pipelineData.total || 0;
  const qualified = pipelineData.qualified || 0;
  const sentToDelivery = pipelineData.sentToDelivery || 0;
  const converted = pipelineData.converted || 0;

  // Calculate percentages relative to total
  const calculatePercentage = (value, base) => {
    if (base === 0) return 0;
    return parseFloat(((value / base) * 100).toFixed(0));
  };

  // Prepare data for recharts
  const chartData = [
    {
      stage: 'All',
      percentage: total > 0 ? 100 : 0,
      value: total,
      label: 'ALL OPPORTUNITIES'
    },
    {
      stage: 'Qualified',
      percentage: calculatePercentage(qualified, total),
      value: qualified,
      label: 'QUALIFIED'
    },
    {
      stage: 'Sent to Delivery',
      percentage: calculatePercentage(sentToDelivery, total),
      value: sentToDelivery,
      label: 'SENT TO DELIVERY'
    },
    {
      stage: 'Converted',
      percentage: calculatePercentage(converted, total),
      value: converted,
      label: 'CONVERTED'
    }
  ];

  // Custom dot component for data points
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="var(--color-background)"
          stroke="var(--color-primary)"
          strokeWidth={2}
          className="recharts-dot"
          style={{ filter: 'drop-shadow(0 10px 18px rgba(99, 91, 255, 0.18))' }}
        />
        {/* Percentage label above point */}
        <text
          x={cx}
          y={cy - 20}
          textAnchor="middle"
          fill="var(--color-text-primary)"
          fontSize={14}
          fontWeight={700}
          className="data-label"
        >
          {payload.percentage}%
        </text>
        {/* Value label below point */}
        <text
          x={cx}
          y={cy + 20}
          textAnchor="middle"
          fill="var(--color-text-muted)"
          fontSize={11}
          fontWeight={500}
          className="value-label"
        >
          {payload.value}
        </text>
      </g>
    );
  };

  // Custom label for X-axis
  const CustomLabel = ({ x, y, payload }) => {
    if (!payload) return null;
    const label = (payload.label || payload.stage || payload.value || '').toUpperCase();
    return (
      <text
        x={x}
        y={y + 18}
        textAnchor="middle"
        fill="var(--color-text-secondary)"
        fontSize={11}
        fontWeight={600}
        className="axis-label-x"
      >
        {label}
      </text>
    );
  };

  // Custom Y-axis tick
  const CustomYAxisTick = ({ x, y, payload }) => {
    return (
      <text
        x={x}
        y={y}
        textAnchor="end"
        fill="var(--color-text-muted)"
        fontSize={11}
        fontWeight={500}
        className="axis-label-y"
      >
        {payload.value}%
      </text>
    );
  };

  return (
    <div className="sales-pipeline-chart-container">
      <div className="chart-header">
        <div className="chart-title-bar">CLOSURES CONVERSION FUNNEL</div>
        <div className="chart-subtitle">Real-Time Performance Metrics & Conversion Rates</div>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart
            data={chartData}
            margin={{
              top: 18,
              right: 18,
              bottom: 18,
              left: 18
            }}
            className="pipeline-line-chart"
          >
            <defs>
              <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.20} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity={1} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(15, 23, 42, 0.08)"
              horizontal={true}
              vertical={false}
              className="chart-grid"
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              stroke="rgba(15, 23, 42, 0.18)"
              tick={<CustomLabel />}
              height={44}
              interval={0}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              axisLine={false}
              tickLine={false}
              stroke="rgba(15, 23, 42, 0.18)"
              tick={<CustomYAxisTick />}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-text-primary)',
                padding: '12px 16px',
                boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)'
              }}
              labelStyle={{
                color: 'var(--color-primary)',
                fontWeight: 600,
                marginBottom: '8px',
                textTransform: 'uppercase',
                fontSize: '12px',
                letterSpacing: '1px'
              }}
              itemStyle={{
                color: 'var(--color-text-primary)',
                fontSize: '14px',
                fontWeight: 500
              }}
              match={false}
              cursor={{ stroke: 'rgba(99, 91, 255, 0.22)', strokeWidth: 1, strokeDasharray: '5 5' }}
              formatter={(value, name) => {
                if (name === 'percentage') {
                  return [`${value}%`, 'Conversion Rate'];
                }
                return [value, 'Count'];
              }}
            />
            <Area
              type="monotone"
              dataKey="percentage"
              stroke="url(#strokeGradient)"
              strokeWidth={3}
              fill="url(#colorPnL)"
              fillOpacity={1}
              dot={<CustomDot />}
              activeDot={{ r: 8, fill: 'var(--color-primary)', stroke: 'var(--color-background)', strokeWidth: 2 }}
              className="pipeline-line"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend/Stats below chart */}
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-label">Total Opportunities:</span>
          <span className="legend-value">{total}</span>
        </div>
        <div className="legend-item">
          <span className="legend-label">Qualified:</span>
          <span className="legend-value">{qualified} ({calculatePercentage(qualified, total)}%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-label">Sent to Delivery:</span>
          <span className="legend-value">{sentToDelivery} ({calculatePercentage(sentToDelivery, total)}%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-label">Converted/Closures:</span>
          <span className="legend-value highlight">{converted} ({calculatePercentage(converted, total)}%)</span>
        </div>
      </div>
    </div>
  );
};

export default SalesPipelineChart;
