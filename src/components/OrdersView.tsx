import { useState, forwardRef } from 'react';
import { Clock, Check, ChefHat, UtensilsCrossed, Package, Search, Printer, Loader2, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { formatCurrency, getStatusColor, getPaymentIcon } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useOrders, useUpdateOrderStatus, useUpdateOrder, OrderStatus, OrderWithItems } from '@/hooks/useOrders';
import { printReceipt } from '@/lib/printReceipt';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

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

const paymentMethods = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'momo', label: 'Mobile Money', icon: Smartphone },
  { id: 'card', label: 'Card', icon: CreditCard },
];

export const OrdersView = forwardRef<HTMLDivElement>((_, ref) => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');

  const { data: orders = [], isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const updateOrder = useUpdateOrder();

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'all' || order.status === activeTab;
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} mins ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  const getNextStatus = (current: string): OrderStatus | null => {
    const currentIndex = statusSteps.findIndex(s => s.status === current);
    if (currentIndex < statusSteps.length - 1) {
      return statusSteps[currentIndex + 1].status;
    }
    return null;
  };

  const handlePrint = (order: OrderWithItems) => {
    printReceipt({ order });
  };

  const openPaymentDialog = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setAmountReceived(order.total.toString());
    setSelectedPaymentMethod('cash');
    setPaymentDialogOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedOrder) return;
    
    const amount = parseFloat(amountReceived);
    if (isNaN(amount) || amount < Number(selectedOrder.total)) {
      toast.error('Amount received must be at least the order total');
      return;
    }

    try {
      await updateOrder.mutateAsync({
        id: selectedOrder.id,
        payment_status: 'paid',
        payment_method: selectedPaymentMethod,
      });
      toast.success(`Payment of ${formatCurrency(amount)} recorded for ${selectedOrder.order_number}`);
      setPaymentDialogOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={ref} className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage and track all orders</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Badge variant="secondary" className="w-fit text-base px-4 py-2 self-start">
            {orders.filter(o => o.status !== 'completed' && o.status !== 'served').length} Active Orders
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
            className="animate-fade-in overflow-hidden hover:shadow-lg transition-shadow"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardHeader className="pb-3 bg-muted/30">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-display">{order.order_number}</CardTitle>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span>{order.order_type === 'dine-in' ? '🍽️' : order.order_type === 'takeaway' ? '📦' : '🚴'}</span>
                    <span className="capitalize">{order.order_type}</span>
                    {order.customer_name && <span>• {order.customer_name}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={cn('capitalize font-semibold', getStatusColor(order.status as any))}>
                    {order.status}
                  </Badge>
                  <Badge 
                    variant={order.payment_status === 'paid' ? 'default' : 'destructive'}
                    className={cn(
                      'text-xs',
                      order.payment_status === 'paid' 
                        ? 'bg-success/20 text-success border-success/30' 
                        : 'bg-destructive/20 text-destructive border-destructive/30'
                    )}
                  >
                    {order.payment_status === 'paid' ? '💰 Paid' : '⏳ Unpaid'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Order Items */}
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {order.order_items.map((orderItem, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {orderItem.quantity}x {orderItem.menu_items?.name || 'Unknown Item'}
                      {orderItem.size && ` (${orderItem.size})`}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(Number(orderItem.total_price))}
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
                  {getTimeAgo(order.created_at)}
                </div>
                <div className="flex items-center gap-2">
                  {order.payment_method && (
                    <span className="text-lg">{getPaymentIcon(order.payment_method as any)}</span>
                  )}
                  <span className="font-bold text-lg">{formatCurrency(Number(order.total))}</span>
                </div>
              </div>

              {/* Status Progress */}
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-2">
                {statusSteps.map((step, i) => {
                  const currentIndex = statusSteps.findIndex(s => s.status === order.status);
                  const isCompleted = i <= currentIndex;
                  const isCurrent = i === currentIndex;
                  
                  return (
                    <div key={step.status} className="flex-1 flex items-center">
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300',
                        isCompleted ? 'gradient-primary shadow-sm' : 'bg-muted border border-border',
                        isCurrent && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      )}>
                        {isCompleted ? (
                          <Check className="w-3.5 h-3.5 text-primary-foreground" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                        )}
                      </div>
                      {i < statusSteps.length - 1 && (
                        <div className={cn(
                          'flex-1 h-0.5 mx-1 transition-colors duration-300',
                          i < currentIndex ? 'bg-primary' : 'bg-border'
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrint(order)}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                
                {/* Record Payment Button - Only show for unpaid orders */}
                {order.payment_status !== 'paid' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-success text-success hover:bg-success/10"
                    onClick={() => openPaymentDialog(order)}
                  >
                    <Banknote className="w-4 h-4 mr-2" />
                    Record Payment
                  </Button>
                )}
                
                {getNextStatus(order.status) && (
                  <Button 
                    variant="gradient" 
                    size="sm"
                    className="flex-1"
                    onClick={() => updateStatus.mutate({ id: order.id, status: getNextStatus(order.status)! })}
                    disabled={updateStatus.isPending}
                  >
                    {updateStatus.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        {statusSteps.find(s => s.status === getNextStatus(order.status))?.label}
                      </>
                    )}
                  </Button>
                )}
                {!getNextStatus(order.status) && order.status === 'served' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 text-success border-success hover:bg-success/10"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Complete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <ChefHat className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <p className="font-medium text-muted-foreground">No orders found</p>
          <p className="text-sm text-muted-foreground/70">Orders will appear here when placed</p>
        </div>
      )}

      {/* Payment Recording Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Record Payment</DialogTitle>
            <DialogDescription>
              Record payment for order {selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-4">
              {/* Order Summary */}
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order Number</span>
                  <span className="font-mono font-medium">{selectedOrder.order_number}</span>
                </div>
                {selectedOrder.customer_name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Customer</span>
                    <span>{selectedOrder.customer_name}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order Type</span>
                  <span className="capitalize">{selectedOrder.order_type}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <span>Total Due</span>
                  <span className="text-primary">{formatCurrency(Number(selectedOrder.total))}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.map((method) => {
                    const IconComponent = method.icon;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedPaymentMethod(method.id)}
                        className={cn(
                          'p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1',
                          selectedPaymentMethod === method.id 
                            ? 'border-primary bg-primary/10' 
                            : 'border-muted hover:border-primary/50'
                        )}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="text-xs font-medium">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Received */}
              <div className="space-y-2">
                <Label htmlFor="amountReceived">Amount Received</Label>
                <Input
                  id="amountReceived"
                  type="number"
                  step="0.01"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="text-lg font-mono"
                />
                {parseFloat(amountReceived) > Number(selectedOrder.total) && (
                  <p className="text-sm text-success">
                    Change: {formatCurrency(parseFloat(amountReceived) - Number(selectedOrder.total))}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="gradient" 
              onClick={handleRecordPayment}
              disabled={updateOrder.isPending}
            >
              {updateOrder.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

OrdersView.displayName = 'OrdersView';
