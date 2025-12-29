'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { NotificationSystem, useNotifications, NotificationType } from './notification-system';

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => string;
  dismissNotification: (id: string) => void;
  dismissAll: () => void;
  showSuccess: (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => string;
  showError: (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => string;
  showWarning: (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => string;
  showInfo: (message: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const notifications = useNotifications();

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
      <NotificationSystem
        notifications={notifications.notifications}
        onDismiss={notifications.dismissNotification}
      />
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}

