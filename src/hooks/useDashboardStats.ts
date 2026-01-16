import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTables } from './useTables';
import { startOfDay, endOfDay } from 'date-fns';

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  cashPayments: number;
  momoPayments: number;
  cardPayments: number;
  pendingPayments: number;
}

export interface TopSellingItem {
  name: string;
  count: number;
}

export interface RecentOrder {
  id: string;
  order_number: string;
  order_type: string;
  status: string;
  total: number;
  customer_name: string | null;
  table_id: string | null;
  created_at: string;
}

export function useDashboardStats() {
  const today = new Date();
  const startOfToday = startOfDay(today).toISOString();
  const endOfToday = endOfDay(today).toISOString();

  return useQuery({
    queryKey: ['dashboard-stats', startOfToday],
    queryFn: async (): Promise<DashboardStats> => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total, payment_method, payment_status')
        .gte('created_at', startOfToday)
        .lte('created_at', endOfToday);

      if (error) throw error;

      const completedOrders = orders || [];
      
      const totalSales = completedOrders.reduce((sum, order) => sum + Number(order.total), 0);
      const totalOrders = completedOrders.length;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      const cashPayments = completedOrders
        .filter(o => o.payment_method === 'cash' && o.payment_status === 'paid')
        .reduce((sum, o) => sum + Number(o.total), 0);

      const momoPayments = completedOrders
        .filter(o => o.payment_method === 'momo' && o.payment_status === 'paid')
        .reduce((sum, o) => sum + Number(o.total), 0);

      const cardPayments = completedOrders
        .filter(o => o.payment_method === 'card' && o.payment_status === 'paid')
        .reduce((sum, o) => sum + Number(o.total), 0);

      const pendingPayments = completedOrders
        .filter(o => o.payment_status === 'pending')
        .reduce((sum, o) => sum + Number(o.total), 0);

      return {
        totalSales,
        totalOrders,
        averageOrderValue,
        cashPayments,
        momoPayments,
        cardPayments,
        pendingPayments,
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useTopSellingItems() {
  const today = new Date();
  const startOfToday = startOfDay(today).toISOString();
  const endOfToday = endOfDay(today).toISOString();

  return useQuery({
    queryKey: ['top-selling-items-dashboard', startOfToday],
    queryFn: async (): Promise<TopSellingItem[]> => {
      // Get order items from today with their menu item details
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          menu_items (name),
          orders!inner (created_at)
        `)
        .gte('orders.created_at', startOfToday)
        .lte('orders.created_at', endOfToday);

      if (error) throw error;

      // Aggregate by item name
      const itemCounts: Record<string, number> = {};
      (orderItems || []).forEach((item: any) => {
        const name = item.menu_items?.name;
        if (name) {
          itemCounts[name] = (itemCounts[name] || 0) + item.quantity;
        }
      });

      // Sort by count and return top 5
      return Object.entries(itemCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
    refetchInterval: 30000,
  });
}

export function useRecentOrders() {
  return useQuery({
    queryKey: ['recent-orders-dashboard'],
    queryFn: async (): Promise<RecentOrder[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, order_type, status, total, customer_name, table_id, created_at')
        .in('status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000, // Refetch every 10 seconds for active orders
  });
}

export function useActiveTablesCount() {
  const { data: tables } = useTables();
  
  const totalTables = tables?.length || 0;
  const occupiedTables = tables?.filter(t => t.status === 'occupied').length || 0;
  
  return { totalTables, occupiedTables };
}