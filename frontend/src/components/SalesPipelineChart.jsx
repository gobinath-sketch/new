import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot
} from 'recharts';
import './SalesPipelineChart.css';

const SalesPipelineChart = ({ pipelineData }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  
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
      percentage: 100, 
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
          fill="#ffffff"
          stroke="#ffffff"
          strokeWidth={2}
          className="recharts-dot"
          style={{ filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.5))' }}
        />
        {/* Percentage label above point */}
        <text
          x={cx}
          y={cy - 20}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={14}
          fontWeight={700}
          className="data-label"
        >
          {payload.percentage}%
        </text>
        {/* Value label below point */}
        <text
          x={cx}
          y={cy + 30}
          textAnchor="middle"
          fill="rgba(255, 255, 255, 0.7)"
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
        y={y + 35}
        textAnchor="middle"
        fill="rgba(255, 255, 255, 0.9)"
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
        fill="rgba(255, 255, 255, 0.8)"
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
        <button 
          className="chart-toggle-btn"
          onClick={() => setIsMinimized(!isMinimized)}
          title={isMinimized ? "Maximize Chart" : "Minimize Chart"}
          aria-label={isMinimized ? "Maximize Chart" : "Minimize Chart"}
        >
          {isMinimized ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          )}
        </button>
      </div>
      
      {!isMinimized && (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={450}>
            <LineChart
              data={chartData}
              margin={{
                top: 40,
                right: 40,
                bottom: 60,
                left: 40
              }}
              className="pipeline-line-chart"
            >
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="0" 
                stroke="rgba(255, 255, 255, 0.15)"
                horizontal={true}
                vertical={false}
                className="chart-grid"
              />
              <XAxis 
                dataKey="label"
                axisLine={true}
                tickLine={false}
                stroke="rgba(255, 255, 255, 0.6)"
                tick={<CustomLabel />}
                height={80}
                interval={0}
              />
              <YAxis 
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                axisLine={true}
                tickLine={false}
                stroke="rgba(255, 255, 255, 0.6)"
                tick={<CustomYAxisTick />}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  padding: '12px 16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
                }}
                labelStyle={{
                  color: '#ffffff',
                  fontWeight: 600,
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  fontSize: '12px'
                }}
                itemStyle={{
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 500
                }}
                formatter={(value, name) => {
                  if (name === 'percentage') {
                    return [`${value}%`, 'Conversion Rate'];
                  }
                  return [value, 'Count'];
                }}
              />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="url(#lineGradient)"
                strokeWidth={3}
                dot={<CustomDot />}
                activeDot={{ r: 8, fill: '#ffffff' }}
                className="pipeline-line"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* Legend/Stats below chart */}
      {!isMinimized && (
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
      )}
    </div>
  );
};

export default SalesPipelineChart;
