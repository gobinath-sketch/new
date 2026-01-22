import React from 'react';

const DashboardCard = ({ title, count, value }) => (
  <div className="dashboard-card">
    <div className="dashboard-card-title">{title}</div>
    <div className="dashboard-card-value">{value || count}</div>
  </div>
);

export default DashboardCard;
