'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface OfflineContextType {
  isOffline: boolean;
  syncQueue: any[];
  addToSyncQueue: (item: any) => void;
  removeFromSyncQueue: (id: string) => void;
  processSyncQueue: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<any[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToSyncQueue = (item: any) => {
    setSyncQueue(prev => [...prev, { ...item, id: Date.now().toString() }]);
  };

  const removeFromSyncQueue = (id: string) => {
    setSyncQueue(prev => prev.filter(item => item.id !== id));
  };

  const processSyncQueue = async () => {
    console.log('Processing sync queue:', syncQueue);
  };

  return (
    <OfflineContext.Provider value={{
      isOffline,
      syncQueue,
      addToSyncQueue,
      removeFromSyncQueue,
      processSyncQueue,
    }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
};