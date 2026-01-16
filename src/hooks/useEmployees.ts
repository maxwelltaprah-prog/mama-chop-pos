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
  last_sign_in_at: string | null;
  account_created_at: string | null;
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

      const userIds = roles.map(r => r.user_id);

      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Fetch employee details from edge function (email, last sign in, etc.)
      const { data: usersData } = await supabase.functions.invoke('get-employee-emails', {
        body: { userIds },
      });

      const usersMap: Record<string, { email: string; last_sign_in_at: string | null; created_at: string | null }> = usersData?.users || {};

      // Combine the data
      const employees: Employee[] = roles.map(role => {
        const profile = profiles?.find(p => p.user_id === role.user_id);
        const userInfo = usersMap[role.user_id];
        return {
          id: role.id,
          user_id: role.user_id,
          email: userInfo?.email || '',
          full_name: profile?.full_name || null,
          phone: profile?.phone || null,
          role: role.role as AppRole,
          created_at: role.created_at,
          last_sign_in_at: userInfo?.last_sign_in_at || null,
          account_created_at: userInfo?.created_at || null,
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
