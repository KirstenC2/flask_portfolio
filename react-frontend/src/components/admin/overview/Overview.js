import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

const Overview = ({ unreadMessages }) => {
  return (
    <div className="dashboard-overview">
      <h2>Welcome to your Admin Dashboard</h2>
      <p>From here, you can manage all the content of your portfolio website.</p>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FontAwesomeIcon icon={faEnvelope} />
          </div>
          <div className="stat-content">
            <h3>Messages</h3>
            <p>{unreadMessages} unread</p>
          </div>
        </div>
        {/* 未來可以在這裡加更多的統計卡片 */}
      </div>
    </div>
  );
};

export default Overview;