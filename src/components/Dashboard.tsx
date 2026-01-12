import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Users,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { todayStats, sampleOrders, formatCurrency, getStatusColor } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const statCards = [
  {
    title: "Today's Sales",
    value: formatCurrency(todayStats.totalSales),
    change: '+12.5%',
    changeType: 'positive' as const,
    icon: DollarSign,
    color: 'gradient-primary',
  },
  {
    title: 'Total Orders',
    value: todayStats.totalOrders.toString(),
    change: '+8.2%',
    changeType: 'positive' as const,
    icon: ShoppingBag,
    color: 'bg-accent',
  },
  {
    title: 'Avg Order Value',
    value: formatCurrency(todayStats.averageOrderValue),
    change: '-2.1%',
    changeType: 'negative' as const,
    icon: TrendingUp,
    color: 'bg-success',
  },
  {
    title: 'Active Tables',
    value: '3/8',
    change: 'Occupied',
    changeType: 'neutral' as const,
    icon: Users,
    color: 'bg-secondary',
  },
];

export function Dashboard() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
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
                    <p className="text-2xl lg:text-3xl font-display font-bold">{stat.value}</p>
                    <div className="flex items-center gap-1 text-sm">
                      {stat.changeType === 'positive' && (
                        <ArrowUpRight className="w-4 h-4 text-success" />
                      )}
                      {stat.changeType === 'negative' && (
                        <ArrowDownRight className="w-4 h-4 text-destructive" />
                      )}
                      <span className={
                        stat.changeType === 'positive' 
                          ? 'text-success' 
                          : stat.changeType === 'negative' 
                          ? 'text-destructive' 
                          : 'text-muted-foreground'
                      }>
                        {stat.change}
                      </span>
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
              <span>Recent Orders</span>
              <Badge variant="secondary">{sampleOrders.length} active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sampleOrders.map((order) => (
              <div 
                key={order.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-lg">
                      {order.type === 'dine-in' ? '🍽️' : order.type === 'takeaway' ? '📦' : '🚴'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.type === 'dine-in' ? `Table ${order.tableNumber}` : order.customerName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(order.total)}</p>
                  <Badge className={getStatusColor(order.status)} variant="secondary">
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
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
            {todayStats.topSellingItems.map((item, index) => (
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
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Payment Breakdown */}
      <Card className="animate-fade-in" style={{ animationDelay: '600ms' }}>
        <CardHeader>
          <CardTitle>Payment Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                <span className="text-2xl">💵</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cash</p>
                <p className="text-xl font-bold">{formatCurrency(todayStats.cashPayments)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mobile Money</p>
                <p className="text-xl font-bold">{formatCurrency(todayStats.momoPayments)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl gradient-card border border-primary/20">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold text-gradient">{formatCurrency(todayStats.totalSales)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
