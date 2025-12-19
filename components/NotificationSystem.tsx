
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Notification } from '../types';
import { X, CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react';

interface NotificationContextType {
  notify: (type: Notification['type'], title: string, message?: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = (type: Notification['type'], title: string, message?: string, duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, title, message, duration }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {createPortal(
        <div className="fixed top-20 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
          {notifications.map(n => (
            <NotificationItem key={n.id} notification={n} onClose={() => removeNotification(n.id)} />
          ))}
        </div>,
        document.body
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};

const NotificationItem: React.FC<{ notification: Notification, onClose: () => void }> = ({ notification, onClose }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (notification.duration) {
      const timer = setTimeout(() => {
        handleClose();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(onClose, 300); // Match animation duration
  };

  const getStyle = (type: Notification['type']) => {
    switch (type) {
      case 'success': return { border: 'border-l-green-500', icon: <CheckCircle className="text-green-500" size={20} />, bg: 'bg-green-500/5' };
      case 'warning': return { border: 'border-l-yellow-500', icon: <AlertTriangle className="text-yellow-500" size={20} />, bg: 'bg-yellow-500/5' };
      case 'error': return { border: 'border-l-red-500', icon: <XCircle className="text-red-500" size={20} />, bg: 'bg-red-500/5' };
      default: return { border: 'border-l-blue-500', icon: <Info className="text-blue-500" size={20} />, bg: 'bg-blue-500/5' };
    }
  };

  const style = getStyle(notification.type);

  return (
    <div 
        className={`
            pointer-events-auto relative w-80 bg-ark-panel border border-ark-border border-l-4 ${style.border} ${style.bg}
            shadow-[0_4px_20px_rgba(0,0,0,0.2)] backdrop-blur-md overflow-hidden
            ${exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
        `}
    >
        <div className="p-4 pr-8 flex items-start gap-3">
            <div className="shrink-0 pt-0.5">{style.icon}</div>
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-ark-text text-sm uppercase tracking-wider">{notification.title}</h4>
                {notification.message && <p className="text-xs text-ark-subtext font-mono mt-1 leading-relaxed">{notification.message}</p>}
            </div>
        </div>
        
        {/* Progress Bar for duration */}
        {notification.duration && (
            <div 
                className="absolute bottom-0 left-0 h-[2px] bg-current opacity-30" 
                style={{ 
                    width: '100%', 
                    animation: `shrink ${notification.duration}ms linear forwards`,
                    color: 'inherit'
                }} 
            />
        )}
        <style>{`
            @keyframes shrink { from { width: 100%; } to { width: 0%; } }
        `}</style>

        <button 
            onClick={handleClose}
            className="absolute top-2 right-2 text-ark-subtext hover:text-ark-text transition-colors p-1"
        >
            <X size={14} />
        </button>
    </div>
  );
};
