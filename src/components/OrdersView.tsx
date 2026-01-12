import { useState } from 'react';
import { Clock, Check, ChefHat, UtensilsCrossed, Package } from 'lucide-react';
import { sampleOrders, formatCurrency, getStatusColor, getPaymentIcon, type OrderStatus } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusSteps: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: 'pending', label: 'Pending', icon: Clock },
  { status: 'preparing', label: 'Preparing', icon: ChefHat },
  { status: 'ready', label: 'Ready', icon: Package },
  { status: 'served', label: 'Served', icon: UtensilsCrossed },
];

const filterTabs: { id: string; label: string; status?: OrderStatus }[] = [
  { id: 'all', label: 'All Orders' },
  { id: 'pending', label: 'Pending', status: 'pending' },
  { id: 'preparing', label: 'Preparing', status: 'preparing' },
  { id: 'ready', label: 'Ready', status: 'ready' },
  { id: 'served', label: 'Served', status: 'served' },
];

export function OrdersView() {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState(sampleOrders);

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(o => o.status === activeTab);

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    ));
  };

  const getTimeAgo = (date: Date): string => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} mins ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    const currentIndex = statusSteps.findIndex(s => s.status === current);
    if (currentIndex < statusSteps.length - 1) {
      return statusSteps[currentIndex + 1].status;
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage and track all orders</p>
        </div>
        <Badge variant="secondary" className="w-fit text-base px-4 py-2">
          {orders.filter(o => o.status !== 'completed').length} Active Orders
        </Badge>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filterTabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab.id)}
            className="shrink-0"
          >
            {tab.label}
            {tab.status && (
              <Badge variant="secondary" className="ml-2 bg-background/20">
                {orders.filter(o => o.status === tab.status).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredOrders.map((order, index) => (
          <Card 
            key={order.id} 
            className="animate-fade-in overflow-hidden"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{order.id}</CardTitle>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span>{order.type === 'dine-in' ? '🍽️' : order.type === 'takeaway' ? '📦' : '🚴'}</span>
                    <span className="capitalize">{order.type}</span>
                    {order.tableNumber && <span>• Table {order.tableNumber}</span>}
                    {order.customerName && <span>• {order.customerName}</span>}
                  </div>
                </div>
                <Badge className={cn('capitalize', getStatusColor(order.status))}>
                  {order.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Items */}
              <div className="space-y-2">
                {order.items.map((orderItem, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {orderItem.quantity}x {orderItem.item.name}
                      {orderItem.size && ` (${orderItem.size})`}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(orderItem.item.price * orderItem.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Order Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {getTimeAgo(order.createdAt)}
                </div>
                <div className="flex items-center gap-2">
                  {order.paymentMethod && (
                    <span className="text-lg">{getPaymentIcon(order.paymentMethod)}</span>
                  )}
                  <span className="font-bold">{formatCurrency(order.total)}</span>
                </div>
              </div>

              {/* Status Progress */}
              <div className="flex items-center gap-1">
                {statusSteps.map((step, i) => {
                  const currentIndex = statusSteps.findIndex(s => s.status === order.status);
                  const isCompleted = i <= currentIndex;
                  const isCurrent = i === currentIndex;
                  
                  return (
                    <div key={step.status} className="flex-1 flex items-center">
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center transition-colors',
                        isCompleted ? 'gradient-primary' : 'bg-muted',
                        isCurrent && 'ring-2 ring-primary ring-offset-2'
                      )}>
                        {isCompleted ? (
                          <Check className="w-3 h-3 text-primary-foreground" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                        )}
                      </div>
                      {i < statusSteps.length - 1 && (
                        <div className={cn(
                          'flex-1 h-0.5 mx-1',
                          i < currentIndex ? 'bg-primary' : 'bg-muted'
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Button */}
              {getNextStatus(order.status) && (
                <Button 
                  variant="gradient" 
                  className="w-full"
                  onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                >
                  Mark as {statusSteps.find(s => s.status === getNextStatus(order.status))?.label}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ChefHat className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-muted-foreground">No orders found</p>
          <p className="text-sm text-muted-foreground/70">Orders will appear here when placed</p>
        </div>
      )}
    </div>
  );
}
