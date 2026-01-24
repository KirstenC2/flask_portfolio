import React from 'react';
import './stat.css';
const StatCard = ({ icon: Icon, label, value, unit, colorStyle = {} }) => (
  <div className="stat-item-card">
    <div className="stat-icon-wrapper" style={colorStyle}>
      <Icon size={20} />
    </div>
    <div className="stat-content">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value.toLocaleString()} <span className="stat-unit">{unit}</span></p>
    </div>
  </div>
);

export const StatRow = ({ items }) => (
  <div className="stat-row">
    {items.map((item, idx) => <StatCard key={idx} {...item} />)}
  </div>
);