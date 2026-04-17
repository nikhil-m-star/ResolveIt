import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/auth';

export const useIssue = (id) => {
  return useQuery({
    queryKey: ['issue', id],
    queryFn: async () => {
      const { data } = await api.get(`/issues/${id}`);
      return data;
    },
    enabled: !!id,
    retry: (failureCount, error) => {
      const status = error?.response?.status;
      if (status === 401) return failureCount < 3;
      return failureCount < 2;
    },
    retryDelay: (attempt) => Math.min(750 * attempt, 2000),
  });
};
