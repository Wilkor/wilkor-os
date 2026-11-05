import { useState, useCallback } from 'react';
import { ToastType } from '../components/Toast';

export const useToasts = () => {
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: ToastType }[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    notifications,
    addToast,
    removeToast
  };
};
