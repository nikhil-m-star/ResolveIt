import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/auth';

export const useIssues = (filters = {}) => {
  return useQuery({
    queryKey: ['issues', filters],
    queryFn: async () => {
      const { data } = await api.get('/issues', { params: filters });
      return data;
    },
  });
};
