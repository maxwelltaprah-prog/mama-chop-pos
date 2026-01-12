import { useState } from 'react';
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Clock } from 'lucide-react';
import { todayStats, formatCurrency } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const reportPeriods = ['Today', 'This Week', 'This Month', 'Custom'];

const dailyData = [
  { day: 'Mon', sales: 1850, orders: 38 },
  { day: 'Tue', sales: 2100, orders: 42 },
  { day: 'Wed', sales: 1950, orders: 40 },
  { day: 'Thu', sales: 2300, orders: 48 },
  { day: 'Fri', sales: 2800, orders: 58 },
  { day: 'Sat', sales: 3200, orders: 65 },
  { day: 'Sun', sales: 2450, orders: 47 },
];

const maxSales = Math.max(...dailyData.map(d => d.sales));

export function ReportsView() {
  const [selectedPeriod, setSelectedPeriod] = useState('Today');

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Track your restaurant performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Select Date
          </Button>
          <Button variant="gradient">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {reportPeriods.map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod(period)}
          >
            {period}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-card overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-display font-bold mt-1">{formatCurrency(16650)}</p>
                <div className="flex items-center gap-1 mt-2 text-success text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>+15.3% vs last week</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-3xl font-display font-bold mt-1">338</p>
                <div className="flex items-center gap-1 mt-2 text-success text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>+8.7% vs last week</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Customers Served</p>
                <p className="text-3xl font-display font-bold mt-1">412</p>
                <div className="flex items-center gap-1 mt-2 text-destructive text-sm">
                  <TrendingDown className="w-4 h-4" />
                  <span>-2.1% vs last week</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center">
                <Users className="w-6 h-6 text-success-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Service Time</p>
                <p className="text-3xl font-display font-bold mt-1">18 min</p>
                <div className="flex items-center gap-1 mt-2 text-success text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>-3 min faster</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Weekly Sales</span>
              <Badge variant="secondary">This Week</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {dailyData.map((data, index) => (
                <div 
                  key={data.day} 
                  className="flex-1 flex flex-col items-center gap-2 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div 
                    className="w-full gradient-primary rounded-t-lg transition-all duration-500 hover:opacity-80"
                    style={{ height: `${(data.sales / maxSales) * 200}px` }}
                  />
                  <span className="text-xs text-muted-foreground font-medium">{data.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Types */}
        <Card>
          <CardHeader>
            <CardTitle>Order Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍽️</span>
                  <span className="text-sm">Dine-in</span>
                </div>
                <span className="font-semibold">60%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-[60%] gradient-primary rounded-full" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  <span className="text-sm">Takeaway</span>
                </div>
                <span className="font-semibold">32%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-[32%] bg-accent rounded-full" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚴</span>
                  <span className="text-sm">Delivery</span>
                </div>
                <span className="font-semibold">8%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-[8%] bg-success rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Breakdown & Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-warning/10">
                <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                  <span className="text-2xl">📱</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">MTN Mobile Money</p>
                  <p className="text-sm text-muted-foreground">156 transactions</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(8450)}</p>
                  <p className="text-sm text-success">+12%</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-success/10">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <span className="text-2xl">💵</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Cash</p>
                  <p className="text-sm text-muted-foreground">124 transactions</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(5890)}</p>
                  <p className="text-sm text-destructive">-5%</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-destructive/10">
                <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                  <span className="text-2xl">📲</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Vodafone Cash</p>
                  <p className="text-sm text-muted-foreground">58 transactions</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(2310)}</p>
                  <p className="text-sm text-success">+8%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayStats.topSellingItems.map((item, index) => (
                <div 
                  key={item.name}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
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
                    <p className="font-bold">{item.count}</p>
                    <p className="text-xs text-muted-foreground">orders</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
