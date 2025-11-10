import React from 'react';
import { useGameStore } from '../stores/gameStore';

const GameNotifications = () => {
  const notifications = useGameStore((state) => state.notifications);
  const removeNotification = useGameStore((state) => state.removeNotification);

  React.useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      const timer = setTimeout(() => {
        removeNotification(latestNotification.id);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications, removeNotification]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      {notifications.map((notif) => (
        <div key={notif.id} style={{
          padding: '10px 15px',
          borderRadius: '5px',
          color: 'white',
          backgroundColor: notif.type === 'success' ? 'rgba(76, 175, 80, 0.9)' : notif.type === 'error' ? 'rgba(244, 67, 54, 0.9)' : 'rgba(33, 150, 243, 0.9)',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          animation: 'fadeIn 0.5s, fadeOut 0.5s 4.5s'
        }} onClick={() => removeNotification(notif.id)}>
          {notif.message}
        </div>
      ))}
       <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(-20px); }
        }
      `}</style>
    </div>
  );
};

export default GameNotifications;
