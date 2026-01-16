import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

export type ReportPeriod = 'Today' | 'This Week' | 'This Month' | 'Custom';

export interface CustomDateRange {
  start: Date;
  end: Date;
}

export const getDateRange = (period: ReportPeriod, customRange?: CustomDateRange) => {
  if (period === 'Custom' && customRange) {
    return { start: startOfDay(customRange.start), end: endOfDay(customRange.end) };
  }
  
  const now = new Date();
  switch (period) {
    case 'Today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'This Week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'This Month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
};

export const useReportStats = (period: ReportPeriod, customRange?: CustomDateRange) => {
  const { start, end } = getDateRange(period, customRange);

  return useQuery({
    queryKey: ['report-stats', period, customRange?.start?.toISOString(), customRange?.end?.toISOString()],
    queryFn: async () => {
      // Fetch orders for the period
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, total, subtotal, tax, order_type, payment_method, payment_status, created_at, customer_name')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (error) throw error;

      const paidOrders = orders?.filter(o => o.payment_status === 'paid') || [];
      const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
      const totalOrders = orders?.length || 0;
      const uniqueCustomers = new Set(orders?.map(o => o.customer_name || o.id)).size;

      // Payment method breakdown
      const paymentBreakdown = paidOrders.reduce((acc, order) => {
        const method = order.payment_method || 'cash';
        if (!acc[method]) {
          acc[method] = { count: 0, total: 0 };
        }
        acc[method].count += 1;
        acc[method].total += Number(order.total);
        return acc;
      }, {} as Record<string, { count: number; total: number }>);

      // Order type breakdown
      const orderTypeBreakdown = (orders || []).reduce((acc, order) => {
        const type = order.order_type || 'dine-in';
        if (!acc[type]) acc[type] = 0;
        acc[type] += 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalRevenue,
        totalOrders,
        uniqueCustomers,
        paymentBreakdown,
        orderTypeBreakdown,
        orders: orders || [],
      };
    },
  });
};

export const useWeeklySalesData = () => {
  return useQuery({
    queryKey: ['weekly-sales'],
    queryFn: async () => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

      const { data: orders, error } = await supabase
        .from('orders')
        .select('total, created_at, payment_status')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())
        .eq('payment_status', 'paid');

      if (error) throw error;

      // Group by day of week
      const dailyData: Record<string, { sales: number; orders: number }> = {
        'Mon': { sales: 0, orders: 0 },
        'Tue': { sales: 0, orders: 0 },
        'Wed': { sales: 0, orders: 0 },
        'Thu': { sales: 0, orders: 0 },
        'Fri': { sales: 0, orders: 0 },
        'Sat': { sales: 0, orders: 0 },
        'Sun': { sales: 0, orders: 0 },
      };

      (orders || []).forEach(order => {
        const day = format(new Date(order.created_at), 'EEE');
        if (dailyData[day]) {
          dailyData[day].sales += Number(order.total);
          dailyData[day].orders += 1;
        }
      });

      return Object.entries(dailyData).map(([day, data]) => ({
        day,
        sales: data.sales,
        orders: data.orders,
      }));
    },
  });
};

export const useTopSellingItems = (period: ReportPeriod, customRange?: CustomDateRange) => {
  const { start, end } = getDateRange(period, customRange);

  return useQuery({
    queryKey: ['top-selling-items', period, customRange?.start?.toISOString(), customRange?.end?.toISOString()],
    queryFn: async () => {
      // Get order items with menu item details for the period
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          menu_item_id,
          created_at,
          menu_items!inner(name)
        `)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (error) throw error;

      // Aggregate by menu item
      const itemCounts = (orderItems || []).reduce((acc, item) => {
        const name = (item.menu_items as any)?.name || 'Unknown';
        if (!acc[name]) acc[name] = 0;
        acc[name] += item.quantity;
        return acc;
      }, {} as Record<string, number>);

      // Sort and return top 5
      return Object.entries(itemCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
  });
};
