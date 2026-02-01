// Notification.jsx - Toast notification component
import React from 'react';
import { useTeam } from '../context/TeamContext';

const Notification = () => {
  const { notification, clearNotification } = useTeam();

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`notification ${notification.type}`} onClick={clearNotification}>
      <span className="notification-icon">{getIcon()}</span>
      <span className="notification-message">{notification.message}</span>
    </div>
  );
};

export default Notification;
