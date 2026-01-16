import { forwardRef, useState } from 'react';
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Clock, RefreshCw } from 'lucide-react';
import { todayStats, formatCurrency } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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

export const ReportsView = forwardRef<HTMLDivElement>((_, ref) => {
  const [selectedPeriod, setSelectedPeriod] = useState('Today');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Report exported successfully!', {
      description: 'Your report has been downloaded as PDF'
    });
    setIsExporting(false);
  };

  return (
    <div ref={ref} className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Track your restaurant performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => toast.info('Date picker coming soon!')}>
            <Calendar className="w-4 h-4 mr-2" />
            Select Date
          </Button>
          <Button variant="outline" onClick={() => {
            toast.success('Data refreshed!');
          }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="gradient" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Exporting...
              </span>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {reportPeriods.map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod(period)}
            className="shrink-0"
          >
            {period}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                <p className="text-2xl lg:text-3xl font-display font-bold mt-1">{formatCurrency(16650)}</p>
                <div className="flex items-center gap-1 mt-2 text-success text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  <span>+15.3% vs last week</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                <DollarSign className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-accent">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Orders</p>
                <p className="text-2xl lg:text-3xl font-display font-bold mt-1">338</p>
                <div className="flex items-center gap-1 mt-2 text-success text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  <span>+8.7% vs last week</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shadow-md">
                <ShoppingBag className="w-6 h-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-success">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Customers Served</p>
                <p className="text-2xl lg:text-3xl font-display font-bold mt-1">412</p>
                <div className="flex items-center gap-1 mt-2 text-destructive text-sm font-medium">
                  <TrendingDown className="w-4 h-4" />
                  <span>-2.1% vs last week</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center shadow-md">
                <Users className="w-6 h-6 text-success-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-warning">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Avg Service Time</p>
                <p className="text-2xl lg:text-3xl font-display font-bold mt-1">18 min</p>
                <div className="flex items-center gap-1 mt-2 text-success text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  <span>-3 min faster</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning flex items-center justify-center shadow-md">
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
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="font-display">Weekly Sales</span>
              <Badge variant="secondary">This Week</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2 pt-4">
              {dailyData.map((data, index) => (
                <div 
                  key={data.day} 
                  className="flex-1 flex flex-col items-center gap-2 group animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative w-full">
                    <div 
                      className="w-full gradient-primary rounded-t-lg transition-all duration-500 group-hover:opacity-80 relative overflow-hidden"
                      style={{ height: `${(data.sales / maxSales) * 180}px` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
                    </div>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-card shadow-lg rounded-lg px-2 py-1 text-xs font-semibold whitespace-nowrap border">
                      {formatCurrency(data.sales)}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{data.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Types */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display">Order Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍽️</span>
                  <span className="text-sm font-medium">Dine-in</span>
                </div>
                <span className="font-bold text-primary">60%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-[60%] gradient-primary rounded-full transition-all duration-500" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  <span className="text-sm font-medium">Takeaway</span>
                </div>
                <span className="font-bold text-accent">32%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-[32%] bg-accent rounded-full transition-all duration-500" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚴</span>
                  <span className="text-sm font-medium">Delivery</span>
                </div>
                <span className="font-bold text-success">8%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-[8%] bg-success rounded-full transition-all duration-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Breakdown & Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-warning/10 border border-warning/20 hover:bg-warning/15 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                  <span className="text-2xl">📱</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">MTN Mobile Money</p>
                  <p className="text-sm text-muted-foreground">156 transactions</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(8450)}</p>
                  <Badge variant="secondary" className="text-success bg-success/10">+12%</Badge>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-success/10 border border-success/20 hover:bg-success/15 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <span className="text-2xl">💵</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Cash</p>
                  <p className="text-sm text-muted-foreground">124 transactions</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(5890)}</p>
                  <Badge variant="secondary" className="text-destructive bg-destructive/10">-5%</Badge>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 hover:bg-destructive/15 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                  <span className="text-2xl">📲</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Vodafone Cash</p>
                  <p className="text-sm text-muted-foreground">58 transactions</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(2310)}</p>
                  <Badge variant="secondary" className="text-success bg-success/10">+8%</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display">Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {todayStats.topSellingItems.map((item, index) => (
                <div 
                  key={item.name}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'gradient-gold text-primary-foreground shadow-md' : 
                    index === 1 ? 'bg-muted-foreground/20 text-foreground' : 
                    index === 2 ? 'bg-accent/20 text-accent' : 
                    'bg-muted text-muted-foreground'
                  }`}>
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{item.count}</p>
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
});

ReportsView.displayName = 'ReportsView';
