import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export type HistoryItem = {
  curp: string;
  timestamp: number;
};

const STORAGE_KEY = '@mislineas:history';
const MAX_ITEMS = 5;

export function useCurpHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToHistory = useCallback(async (curp: string) => {
    try {
      const newItem: HistoryItem = {
        curp,
        timestamp: Date.now(),
      };

      setHistory((prev) => {
        const filtered = prev.filter((item) => item.curp !== curp);
        const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }, []);

  const removeFromHistory = useCallback(async (curp: string) => {
    try {
      setHistory((prev) => {
        const updated = prev.filter((item) => item.curp !== curp);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Error removing from history:', error);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, []);

  return {
    history,
    isLoading,
    saveToHistory,
    removeFromHistory,
    clearHistory,
  };
}
