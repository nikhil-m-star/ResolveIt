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
  });
};
