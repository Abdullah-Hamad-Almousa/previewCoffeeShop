import { useState, useEffect, useCallback } from 'react';

import {
  getQueues,
  getQueueItems,
  startQueue,
  saveQueueItems,
  type Queue,
  type QueueItem,
} from '@/services/queue';

export function useQueue() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [queueItems, setQueueItems] = useState<Record<number, QueueItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const allQueues = await getQueues();
      setQueues(allQueues);

      // Load items for all 4 queues
      const itemsMap: Record<number, QueueItem[]> = {};
      for (const q of allQueues) {
        itemsMap[q.id] = await getQueueItems(q.id);
      }
      setQueueItems(itemsMap);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const start = useCallback(
    async (queueId: number) => {
      await startQueue(queueId);
      await refresh();
    },
    [refresh]
  );

  const saveItems = useCallback(
    async (queueId: number, productIds: string[]) => {
      await saveQueueItems(queueId, productIds);
      await refresh();
    },
    [refresh]
  );

  return {
    queues,
    queueItems,
    loading,
    error,
    refresh,
    start,
    saveItems,
  };
}