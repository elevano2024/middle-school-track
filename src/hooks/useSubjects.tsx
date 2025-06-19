
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Subject {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
}

const fetchSubjects = async (): Promise<Subject[]> => {
  console.log('useSubjects: Fetching subjects from database...');
  
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name');

  if (error) {
    console.error('useSubjects: Error fetching subjects:', error);
    throw error;
  }

  console.log('useSubjects: Successfully fetched subjects:', data);
  return data || [];
};

export const useSubjects = () => {
  const query = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
  });

  return {
    subjects: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
