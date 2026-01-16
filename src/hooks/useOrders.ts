import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type OrderRow = Tables<'orders'>;
export type OrderInsert = TablesInsert<'orders'>;
export type OrderUpdate = TablesUpdate<'orders'>;
export type OrderItemRow = Tables<'order_items'>;
export type OrderItemInsert = TablesInsert<'order_items'>;

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed';

export interface OrderWithItems extends OrderRow {
  order_items: (OrderItemRow & {
    menu_items: Tables<'menu_items'> | null;
  })[];
}

function generateClientOrderNumber() {
  // We generate on the client to avoid relying on DB triggers (which may not exist in Cloud).
  // Format is still human-friendly, but collision-resistant.
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD

  const rand = (() => {
    // Prefer crypto if available
    const cryptoObj = globalThis.crypto;
    if (cryptoObj?.getRandomValues) {
      const bytes = new Uint8Array(5);
      cryptoObj.getRandomValues(bytes);
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
    }
    return Math.random().toString(16).slice(2, 12).toUpperCase();
  })();

  return `ORD-${dateStr}-${rand}`;
}

export function useOrders() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (
            *,
            menu_items (*)
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OrderWithItems[];
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      order,
      items,
    }: {
      order: Omit<OrderInsert, 'order_number' | 'created_by'>;
      items: Omit<OrderItemInsert, 'order_id'>[];
    }) => {
      const orderNumber = generateClientOrderNumber();

      // Create order (client-generated order_number to prevent UNIQUE collisions like 'TEMP')
      const { data: insertData, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...order,
          order_number: orderNumber,
          created_by: user?.id,
        })
        .select('id, order_number')
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        ...item,
        order_id: insertData.id,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) throw itemsError;

      // Return a minimal order row (callers typically only need number/id)
      return {
        id: insertData.id,
        order_number: insertData.order_number,
        ...order,
        created_by: user?.id ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as OrderRow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Order ${data.order_number} created successfully!`);
    },
    onError: (error) => {
      toast.error('Failed to create order: ' + error.message);
    },
  });
}

// For customer self-ordering (no auth required)
export function useCreateCustomerOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      order,
      items,
    }: {
      order: Omit<OrderInsert, 'order_number' | 'created_by'>;
      items: Omit<OrderItemInsert, 'order_id'>[];
    }) => {
      const clientOrderNumber = generateClientOrderNumber();

      // Insert order; select may be blocked by RLS, but insert still succeeds.
      const { data: insertData, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...order,
          order_number: clientOrderNumber,
          created_by: null,
        })
        .select('id, order_number');

      if (orderError) throw orderError;

      const orderId = insertData?.[0]?.id;
      const orderNumber = insertData?.[0]?.order_number || clientOrderNumber;

      // If we can read the id, create items; otherwise we can't safely attach items due to RLS.
      if (orderId && items.length > 0) {
        const orderItems = items.map((item) => ({
          ...item,
          order_id: orderId,
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

        if (itemsError) {
          console.error('Failed to create order items:', itemsError);
          // Don't throw - order was created, items failed
        }
      }

      return {
        id: orderId || '',
        order_number: orderNumber,
        ...order,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as OrderRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      throw error;
    },
  });
}

export function useCreateOrderItem() {
  return useMutation({
    mutationFn: async (item: OrderItemInsert) => {
      // NOTE: Public customers can INSERT but cannot SELECT order_items (RLS)
      const { error } = await supabase
        .from('order_items')
        .insert(item);

      if (error) throw error;
      return item;
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Order ${data.order_number} marked as ${data.status}`);
    },
    onError: (error) => {
      toast.error('Failed to update order: ' + error.message);
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: OrderUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      toast.error('Failed to update order: ' + error.message);
    },
  });
}
