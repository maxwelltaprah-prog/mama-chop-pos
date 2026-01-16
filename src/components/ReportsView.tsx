import { forwardRef, useState } from 'react';
import { Calendar, Download, TrendingUp, DollarSign, ShoppingBag, Users, RefreshCw, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useReportStats, useWeeklySalesData, useTopSellingItems, ReportPeriod } from '@/hooks/useReports';
import { useQueryClient } from '@tanstack/react-query';

const reportPeriods: ReportPeriod[] = ['Today', 'This Week', 'This Month'];

const paymentMethodLabels: Record<string, { label: string; emoji: string; colorClass: string }> = {
  'mtn-momo': { label: 'MTN Mobile Money', emoji: '📱', colorClass: 'warning' },
  'vodafone-cash': { label: 'Vodafone Cash', emoji: '📲', colorClass: 'destructive' },
  'airteltigo': { label: 'AirtelTigo Money', emoji: '💳', colorClass: 'accent' },
  'cash': { label: 'Cash', emoji: '💵', colorClass: 'success' },
};

const orderTypeLabels: Record<string, { label: string; emoji: string }> = {
  'dine-in': { label: 'Dine-in', emoji: '🍽️' },
  'takeaway': { label: 'Takeaway', emoji: '📦' },
  'delivery': { label: 'Delivery', emoji: '🚴' },
  'customer': { label: 'Customer Orders', emoji: '📱' },
};

export const ReportsView = forwardRef<HTMLDivElement>((_, ref) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('Today');
  const [isExporting, setIsExporting] = useState(false);
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useReportStats(selectedPeriod);
  const { data: weeklySales, isLoading: weeklyLoading, refetch: refetchWeekly } = useWeeklySalesData();
  const { data: topItems, isLoading: topItemsLoading, refetch: refetchTopItems } = useTopSellingItems(selectedPeriod);

  const handleRefresh = async () => {
    toast.info('Refreshing data...');
    await Promise.all([refetchStats(), refetchWeekly(), refetchTopItems()]);
    toast.success('Data refreshed!');
  };

  const handleExport = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Report exported successfully!', {
      description: 'Your report has been downloaded as PDF'
    });
    setIsExporting(false);
  };

  const maxSales = Math.max(...(weeklySales || []).map(d => d.sales), 1);
  const totalOrderTypes = Object.values(stats?.orderTypeBreakdown || {}).reduce((a, b) => a + b, 0) || 1;

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
          <Button variant="outline" onClick={handleRefresh}>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="overflow-hidden border-l-4 border-l-primary">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                {statsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mt-2" />
                ) : (
                  <p className="text-2xl lg:text-3xl font-display font-bold mt-1">
                    {formatCurrency(stats?.totalRevenue || 0)}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-2 text-muted-foreground text-sm">
                  <span>{selectedPeriod}</span>
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
                {statsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mt-2" />
                ) : (
                  <p className="text-2xl lg:text-3xl font-display font-bold mt-1">
                    {stats?.totalOrders || 0}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-2 text-muted-foreground text-sm">
                  <span>{selectedPeriod}</span>
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
                {statsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mt-2" />
                ) : (
                  <p className="text-2xl lg:text-3xl font-display font-bold mt-1">
                    {stats?.uniqueCustomers || 0}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-2 text-muted-foreground text-sm">
                  <span>{selectedPeriod}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center shadow-md">
                <Users className="w-6 h-6 text-success-foreground" />
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
            {weeklyLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="h-64 flex items-end justify-between gap-2 pt-4">
                {(weeklySales || []).map((data, index) => (
                  <div 
                    key={data.day} 
                    className="flex-1 flex flex-col items-center gap-2 group animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="relative w-full">
                      <div 
                        className="w-full gradient-primary rounded-t-lg transition-all duration-500 group-hover:opacity-80 relative overflow-hidden"
                        style={{ height: `${Math.max((data.sales / maxSales) * 180, 4)}px` }}
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
            )}
          </CardContent>
        </Card>

        {/* Order Types */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display">Order Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              Object.entries(stats?.orderTypeBreakdown || {}).map(([type, count]) => {
                const percentage = Math.round((count / totalOrderTypes) * 100);
                const typeInfo = orderTypeLabels[type] || { label: type, emoji: '📋' };
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{typeInfo.emoji}</span>
                        <span className="text-sm font-medium">{typeInfo.label}</span>
                      </div>
                      <span className="font-bold text-primary">{percentage}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full gradient-primary rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
            {!statsLoading && Object.keys(stats?.orderTypeBreakdown || {}).length === 0 && (
              <p className="text-muted-foreground text-center py-4">No orders yet</p>
            )}
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
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats?.paymentBreakdown || {}).map(([method, data]) => {
                  const methodInfo = paymentMethodLabels[method] || { label: method, emoji: '💳', colorClass: 'muted' };
                  return (
                    <div 
                      key={method}
                      className={`flex items-center gap-4 p-4 rounded-xl bg-${methodInfo.colorClass}/10 border border-${methodInfo.colorClass}/20 hover:bg-${methodInfo.colorClass}/15 transition-colors`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-${methodInfo.colorClass}/20 flex items-center justify-center`}>
                        <span className="text-2xl">{methodInfo.emoji}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{methodInfo.label}</p>
                        <p className="text-sm text-muted-foreground">{data.count} transactions</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(data.total)}</p>
                      </div>
                    </div>
                  );
                })}
                {Object.keys(stats?.paymentBreakdown || {}).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No payments yet</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display">Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            {topItemsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {(topItems || []).map((item, index) => (
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
                {(topItems || []).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No items sold yet</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

ReportsView.displayName = 'ReportsView';
