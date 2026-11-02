import { useState, useEffect, useCallback } from 'react';
import { checkBackendHealth } from '../services/health.service.js';

export function useHealthCheck() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await checkBackendHealth();
      setData(response.data);
    } catch (err) {
      setError(err.message || 'Unable to connect to backend server');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return { data, loading, error, refetch: fetchHealth };
}
