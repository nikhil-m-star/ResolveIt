import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/auth';

export const useIssues = (filters = {}) => {
  return useQuery({
    queryKey: ['issues', filters],
    queryFn: async () => {
      const { data } = await api.get('/issues', { params: filters });
      return data;
    },
    staleTime: 30000, // Keep data fresh for 30 seconds
    retry: (failureCount, error) => {
      const status = error?.response?.status;
      if (status === 401) return failureCount < 3;
      return failureCount < 2;
    },
    retryDelay: (attempt) => Math.min(750 * attempt, 2000),
  });
};
