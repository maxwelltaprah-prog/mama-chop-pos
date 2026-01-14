import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export type TableRow = Tables<'restaurant_tables'>;
export type TableInsert = TablesInsert<'restaurant_tables'>;
export type TableUpdate = TablesUpdate<'restaurant_tables'>;

export function useTables() {
  return useQuery({
    queryKey: ['restaurant-tables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .order('table_number', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (table: TableInsert) => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .insert(table)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      toast.success('Table created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create table: ' + error.message);
    },
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: TableUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      toast.success('Table updated');
    },
    onError: (error) => {
      toast.error('Failed to update table: ' + error.message);
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('restaurant_tables')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      toast.success('Table deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete table: ' + error.message);
    },
  });
}
