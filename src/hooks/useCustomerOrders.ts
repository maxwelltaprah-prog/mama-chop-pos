import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

export interface CustomerOrder {
  id: string;
  order_number: string;
  order_type: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  customer_name: string | null;
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    size: string | null;
    menu_items: {
      name: string;
      image_url: string | null;
    } | null;
  }[];
}

export function useCustomerOrders() {
  const { user, isAuthenticated } = useCustomerAuth();

  return useQuery({
    queryKey: ['customer-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          order_type,
          status,
          payment_status,
          payment_method,
          subtotal,
          tax,
          total,
          created_at,
          customer_name,
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            size,
            menu_items (
              name,
              image_url
            )
          )
        `)
        .eq('customer_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as CustomerOrder[];
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30000, // 30 seconds
  });
}
