import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AppRole = 'admin' | 'cashier' | 'kitchen';

export interface Employee {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: AppRole;
  created_at: string;
}

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Get profiles for these users
      const userIds = roles.map(r => r.user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const employees: Employee[] = roles.map(role => {
        const profile = profiles?.find(p => p.user_id === role.user_id);
        return {
          id: role.id,
          user_id: role.user_id,
          email: '', // We'll need to get this from the edge function
          full_name: profile?.full_name || null,
          phone: profile?.phone || null,
          role: role.role as AppRole,
          created_at: role.created_at,
        };
      });

      return employees;
    },
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      fullName, 
      role 
    }: { 
      email: string; 
      password: string; 
      fullName: string; 
      role: AppRole;
    }) => {
      // Call edge function to create user
      const { data, error } = await supabase.functions.invoke('create-employee', {
        body: { email, password, fullName, role },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create employee');
    },
  });
}

export function useUpdateEmployeeRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee role updated!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update role');
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Call edge function to delete user
      const { data, error } = await supabase.functions.invoke('delete-employee', {
        body: { userId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee removed successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove employee');
    },
  });
}
