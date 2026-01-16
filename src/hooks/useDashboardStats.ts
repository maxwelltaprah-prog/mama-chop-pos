import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTables } from './useTables';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  cashPayments: number;
  momoPayments: number;
  cardPayments: number;
  pendingPayments: number;
  // Yesterday's stats for comparison
  yesterdaySales: number;
  yesterdayOrders: number;
  yesterdayAvgOrderValue: number;
  // Percentage changes
  salesChange: number;
  ordersChange: number;
  avgOrderChange: number;
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

function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function useDashboardStats() {
  const today = new Date();
  const yesterday = subDays(today, 1);
  
  const startOfToday = startOfDay(today).toISOString();
  const endOfToday = endOfDay(today).toISOString();
  const startOfYesterday = startOfDay(yesterday).toISOString();
  const endOfYesterday = endOfDay(yesterday).toISOString();

  return useQuery({
    queryKey: ['dashboard-stats', startOfToday],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch today's orders
      const { data: todayOrders, error: todayError } = await supabase
        .from('orders')
        .select('total, payment_method, payment_status')
        .gte('created_at', startOfToday)
        .lte('created_at', endOfToday);

      if (todayError) throw todayError;

      // Fetch yesterday's orders
      const { data: yesterdayOrders, error: yesterdayError } = await supabase
        .from('orders')
        .select('total, payment_method, payment_status')
        .gte('created_at', startOfYesterday)
        .lte('created_at', endOfYesterday);

      if (yesterdayError) throw yesterdayError;

      // Calculate today's stats
      const todayData = todayOrders || [];
      const totalSales = todayData.reduce((sum, order) => sum + Number(order.total), 0);
      const totalOrders = todayData.length;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      const cashPayments = todayData
        .filter(o => o.payment_method === 'cash' && o.payment_status === 'paid')
        .reduce((sum, o) => sum + Number(o.total), 0);

      const momoPayments = todayData
        .filter(o => o.payment_method === 'momo' && o.payment_status === 'paid')
        .reduce((sum, o) => sum + Number(o.total), 0);

      const cardPayments = todayData
        .filter(o => o.payment_method === 'card' && o.payment_status === 'paid')
        .reduce((sum, o) => sum + Number(o.total), 0);

      const pendingPayments = todayData
        .filter(o => o.payment_status === 'pending')
        .reduce((sum, o) => sum + Number(o.total), 0);

      // Calculate yesterday's stats
      const yesterdayData = yesterdayOrders || [];
      const yesterdaySales = yesterdayData.reduce((sum, order) => sum + Number(order.total), 0);
      const yesterdayOrderCount = yesterdayData.length;
      const yesterdayAvgOrderValue = yesterdayOrderCount > 0 ? yesterdaySales / yesterdayOrderCount : 0;

      // Calculate percentage changes
      const salesChange = calculatePercentChange(totalSales, yesterdaySales);
      const ordersChange = calculatePercentChange(totalOrders, yesterdayOrderCount);
      const avgOrderChange = calculatePercentChange(averageOrderValue, yesterdayAvgOrderValue);

      return {
        totalSales,
        totalOrders,
        averageOrderValue,
        cashPayments,
        momoPayments,
        cardPayments,
        pendingPayments,
        yesterdaySales,
        yesterdayOrders: yesterdayOrderCount,
        yesterdayAvgOrderValue,
        salesChange,
        ordersChange,
        avgOrderChange,
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