import { forwardRef } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { formatCurrency, getStatusColor, OrderStatus } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useDashboardStats, 
  useTopSellingItems, 
  useRecentOrders,
  useActiveTablesCount 
} from '@/hooks/useDashboardStats';

export const Dashboard = forwardRef<HTMLDivElement>((_, ref) => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: topItems, isLoading: topItemsLoading } = useTopSellingItems();
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders();
  const { totalTables, occupiedTables } = useActiveTablesCount();

  // Helper to format percentage change
  const formatChange = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return { text: 'No data', type: 'neutral' as const };
    const rounded = Math.round(value * 10) / 10;
    if (rounded > 0) return { text: `+${rounded}%`, type: 'positive' as const };
    if (rounded < 0) return { text: `${rounded}%`, type: 'negative' as const };
    return { text: '0%', type: 'neutral' as const };
  };

  const salesChange = formatChange(stats?.salesChange);
  const ordersChange = formatChange(stats?.ordersChange);
  const avgOrderChange = formatChange(stats?.avgOrderChange);

  const statCards = [
    {
      title: "Today's Sales",
      value: stats ? formatCurrency(stats.totalSales) : '---',
      change: salesChange.text,
      changeType: salesChange.type,
      subtitle: stats?.yesterdaySales ? `vs ${formatCurrency(stats.yesterdaySales)} yesterday` : 'vs yesterday',
      icon: DollarSign,
      color: 'gradient-primary',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders?.toString() || '0',
      change: ordersChange.text,
      changeType: ordersChange.type,
      subtitle: stats?.yesterdayOrders !== undefined ? `vs ${stats.yesterdayOrders} yesterday` : 'vs yesterday',
      icon: ShoppingBag,
      color: 'bg-accent',
    },
    {
      title: 'Avg Order Value',
      value: stats ? formatCurrency(stats.averageOrderValue) : '---',
      change: avgOrderChange.text,
      changeType: avgOrderChange.type,
      subtitle: stats?.yesterdayAvgOrderValue ? `vs ${formatCurrency(stats.yesterdayAvgOrderValue)}` : 'vs yesterday',
      icon: TrendingUp,
      color: 'bg-success',
    },
    {
      title: 'Active Tables',
      value: `${occupiedTables}/${totalTables}`,
      change: occupiedTables > 0 ? 'Occupied' : 'All free',
      changeType: occupiedTables > 0 ? 'positive' : 'neutral' as const,
      subtitle: 'Current status',
      icon: Users,
      color: 'bg-secondary',
    },
  ];

  return (
    <div ref={ref} className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your restaurant overview.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Today:</span>
          <span className="font-semibold">{new Date().toLocaleDateString('en-GB', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.title} 
              className="stat-card overflow-hidden animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <p className="text-2xl lg:text-3xl font-display font-bold">{stat.value}</p>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        {stat.changeType === 'positive' && (
                          <ArrowUpRight className="w-4 h-4 text-success" />
                        )}
                        {stat.changeType === 'negative' && (
                          <ArrowDownRight className="w-4 h-4 text-destructive" />
                        )}
                        <span className={
                          stat.changeType === 'positive' 
                            ? 'text-success font-medium' 
                            : stat.changeType === 'negative' 
                            ? 'text-destructive font-medium' 
                            : 'text-muted-foreground'
                        }>
                          {stat.change}
                        </span>
                      </div>
                      {stat.subtitle && (
                        <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center shadow-md`}>
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <span>Active Orders</span>
              <Badge variant="secondary">
                {ordersLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : `${recentOrders?.length || 0} active`}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ordersLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            ) : recentOrders && recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div 
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-lg">
                        {order.order_type === 'dine-in' ? '🍽️' : order.order_type === 'takeaway' ? '📦' : '🚚'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customer_name || 'Walk-in'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(order.total)}</p>
                    <Badge className={getStatusColor(order.status as OrderStatus)} variant="secondary">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No active orders</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Items */}
        <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <span>Top Selling Items</span>
              <Badge variant="secondary">Today</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topItemsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))
            ) : topItems && topItems.length > 0 ? (
              topItems.map((item, index) => (
                <div 
                  key={item.name}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'gradient-gold text-primary-foreground' : 
                    index === 1 ? 'bg-muted text-foreground' : 
                    index === 2 ? 'bg-accent/20 text-accent' : 
                    'bg-muted/50 text-muted-foreground'
                  }`}>
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{item.count}</p>
                    <p className="text-xs text-muted-foreground">sold</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No sales data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Breakdown */}
      <Card className="animate-fade-in" style={{ animationDelay: '600ms' }}>
        <CardHeader>
          <CardTitle>Payment Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                <span className="text-2xl">💵</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cash</p>
                {statsLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <p className="text-xl font-bold">{formatCurrency(stats?.cashPayments || 0)}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mobile Money</p>
                {statsLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <p className="text-xl font-bold">{formatCurrency(stats?.momoPayments || 0)}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-2xl">💳</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Card</p>
                {statsLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <p className="text-xl font-bold">{formatCurrency(stats?.cardPayments || 0)}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl gradient-card border border-primary/20">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                {statsLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <p className="text-xl font-bold text-gradient">{formatCurrency(stats?.totalSales || 0)}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';