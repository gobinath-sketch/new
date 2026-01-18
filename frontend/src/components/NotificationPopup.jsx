import React from 'react';
import './NotificationPopup.css';

const NotificationPopup = ({ notifications, unreadCount, onNotificationClick, onClose }) => {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-popup">
      <div className="notification-popup-header">
        <div className="notification-popup-title">
          <h3>Notifications</h3>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
        <button className="notification-close-btn" onClick={onClose} aria-label="Close notifications">
          ×
        </button>
      </div>

      <div className="notification-popup-body">
        {notifications.length === 0 ? (
          <div className="notification-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5.365V3m0 2.365a5.338 5.338 0 0 1 5.133 5.368v1.8c0 2.386 1.867 2.982 1.867 4.175 0 .593 0 1.292-.538 1.292H5.538C5 18 5 17.301 5 16.708c0-1.193 1.867-1.789 1.867-4.175v-1.8A5.338 5.338 0 0 1 12 5.365ZM8.733 18c.094.852.306 1.54.944 2.112a3.48 3.48 0 0 0 4.646 0c.638-.572 1.236-1.26 1.33-2.112h-6.92Z" />
            </svg>
            <p>No notifications</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => onNotificationClick(notification)}
              >
                <div className="notification-item-icon">
                  <div className={`notification-type-icon ${notification.type}`}>
                    {notification.type === 'opportunity_created' && '📋'}
                    {notification.type === 'program_created' && '📦'}
                    {notification.type === 'opportunity_qualified' && '✓'}
                    {notification.type === 'opportunity_sent_to_delivery' && '🚚'}
                    {notification.type === 'opportunity_converted' && '✅'}
                    {notification.type === 'opportunity_lost' && '❌'}
                  </div>
                  {!notification.read && <div className="unread-indicator"></div>}
                </div>
                
                <div className="notification-item-content">
                  <div className="notification-item-header">
                    <h4 className="notification-title">{notification.title}</h4>
                    <span className="notification-time">{formatTime(notification.createdAt)}</span>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <div className="notification-meta">
                    <span className="notification-creator">
                      By: <strong>{notification.createdByName}</strong>
                    </span>
                    <span className="notification-entity">
                      {notification.entityType}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="notification-popup-footer">
          <button className="notification-view-all" onClick={() => {
            window.location.href = '/notifications';
          }}>
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationPopup;
