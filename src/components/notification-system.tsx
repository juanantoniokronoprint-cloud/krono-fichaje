'use client';

import React, { useState, useEffect, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number; // milliseconds, undefined means no auto-dismiss
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationSystemProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration, notification.id]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300); // Animation duration
  };

  const getNotificationStyles = (type: NotificationType) => {
    const baseStyles = 'relative flex items-start gap-3 p-4 rounded-lg shadow-lg border backdrop-blur-sm transition-all duration-300';
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-200 text-green-900`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-200 text-red-900`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-900`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-50 border-blue-200 text-blue-900`;
    }
  };

  const getIcon = (type: NotificationType) => {
    const iconClass = 'w-5 h-5 flex-shrink-0 mt-0.5';
    
    switch (type) {
      case 'success':
        return (
          <svg className={`${iconClass} text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className={`${iconClass} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={`${iconClass} text-yellow-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className={`${iconClass} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`${getNotificationStyles(notification.type)} ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
      role="alert"
      aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
    >
      {getIcon(notification.type)}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{notification.message}</p>
        {notification.action && (
          <button
            onClick={notification.action.onClick}
            className="mt-2 text-sm font-semibold underline hover:no-underline"
          >
            {notification.action.label}
          </button>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
        aria-label="Cerrar notificación"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export const NotificationSystem: React.FC<NotificationSystemProps> = ({ notifications, onDismiss }) => {
  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full pointer-events-none"
      aria-live="polite"
      aria-label="Notificaciones"
    >
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationItem notification={notification} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
};

/**
 * Hook for managing notifications
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((
    type: NotificationType,
    message: string,
    options?: {
      duration?: number;
      action?: {
        label: string;
        onClick: () => void;
      };
    }
  ) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notification: Notification = {
      id,
      type,
      message,
      duration: options?.duration ?? (type === 'error' ? 5000 : 3000),
      action: options?.action,
    };

    setNotifications((prev) => [...prev, notification]);
    return id;
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const showSuccess = useCallback(
    (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
      return showNotification('success', message, options);
    },
    [showNotification]
  );

  const showError = useCallback(
    (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
      return showNotification('error', message, { ...options, duration: options?.duration ?? 5000 });
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
      return showNotification('warning', message, options);
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => {
      return showNotification('info', message, options);
    },
    [showNotification]
  );

  return {
    notifications,
    showNotification,
    dismissNotification,
    dismissAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}

