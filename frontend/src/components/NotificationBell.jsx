import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import NotificationPopup from './NotificationPopup';
import bellIcon from '../assets/bell.png';
import './NotificationBell.css';

const NotificationBell = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Real-time updates every 5 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setShowPopup(false);
      }
    };

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup]);

  const handleBellClick = () => {
    setShowPopup(!showPopup);
    if (!showPopup && unreadCount > 0) {
      // Mark all as read when opening
      markAllAsRead();
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await api.put(`/notifications/${notification._id}/read`);
        fetchNotifications();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate to the entity
    if (notification.entityType === 'Opportunity') {
      window.location.href = `/opportunities/${notification.entityId}`;
    } else if (notification.entityType === 'Program') {
      window.location.href = `/programs/${notification.entityId}`;
    }

    setShowPopup(false);
  };

  return (
    <div className="notification-bell-container" ref={bellRef}>
      <div
        className={`notification-bell ${unreadCount > 0 ? 'has-notifications' : ''}`}
        onClick={handleBellClick}
        title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'No notifications'}
      >
        <img
          src={bellIcon}
          alt="Notifications"
          className="bell-icon"
        />
        {unreadCount > 0 && (
          <div className="notification-dot">
            <span className="dot-pulse"></span>
          </div>
        )}
      </div>

      {showPopup && (
        <NotificationPopup
          notifications={notifications}
          unreadCount={unreadCount}
          onNotificationClick={handleNotificationClick}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
