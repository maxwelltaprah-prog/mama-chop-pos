import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export type MenuItemRow = Tables<'menu_items'>;
export type MenuItemInsert = TablesInsert<'menu_items'>;
export type MenuItemUpdate = TablesUpdate<'menu_items'>;

export interface MenuItemSize {
  name: string;
  price: number;
}

export interface MenuItemAddon {
  name: string;
  price: number;
}

export interface MenuItemAccompaniment {
  name: string;
  price: number;
}

export function useMenuItems() {
  return useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: MenuItemInsert) => {
      const { data, error } = await supabase
        .from('menu_items')
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success('Menu item created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create menu item: ' + error.message);
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: MenuItemUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success('Menu item updated');
    },
    onError: (error) => {
      toast.error('Failed to update menu item: ' + error.message);
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success('Menu item deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete menu item: ' + error.message);
    },
  });
}

export function useUploadMenuImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName);
      
      return data.publicUrl;
    },
    onError: (error) => {
      toast.error('Failed to upload image: ' + error.message);
    },
  });
}
