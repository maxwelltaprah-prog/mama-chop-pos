import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Package, ChefHat, UtensilsCrossed, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/data';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface StoredOrder {
  orderNumber: string;
  orderType: 'dine-in' | 'takeaway';
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  createdAt: string;
}

const ORDER_HISTORY_KEY = 'mama_chop_order_history';

export const getStoredOrders = (): StoredOrder[] => {
  try {
    const stored = localStorage.getItem(ORDER_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveOrderToHistory = (order: StoredOrder) => {
  try {
    const orders = getStoredOrders();
    // Add new order at the beginning, limit to 20 orders
    const updatedOrders = [order, ...orders].slice(0, 20);
    localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(updatedOrders));
  } catch (error) {
    console.error('Failed to save order to history:', error);
  }
};

export const clearOrderHistory = () => {
  localStorage.removeItem(ORDER_HISTORY_KEY);
};

export default function OrderHistory() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);

  useEffect(() => {
    setOrders(getStoredOrders());
  }, []);

  const handleClearHistory = () => {
    clearOrderHistory();
    setOrders([]);
  };

  const getTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'momo': return '📱 Mobile Money';
      case 'card': return '💳 Card';
      case 'online': return '💳 Card';
      case 'cash': return '💵 Cash';
      default: return method;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/order">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-display font-bold">Order History</h1>
                <p className="text-xs text-muted-foreground">Your recent orders on this device</p>
              </div>
            </div>

            {orders.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear History
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Order History?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all order history from this device. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearHistory} className="bg-destructive text-destructive-foreground">
                      Clear History
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <p className="font-medium text-muted-foreground">No order history</p>
            <p className="text-sm text-muted-foreground/70 mb-6">Your orders will appear here after you place them</p>
            <Link to="/order">
              <Button variant="gradient">
                Browse Menu
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Showing {orders.length} order{orders.length > 1 ? 's' : ''} stored on this device
            </p>

            {orders.map((order, index) => (
              <Card 
                key={`${order.orderNumber}-${index}`}
                className="animate-fade-in overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="pb-3 bg-muted/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-display font-mono">{order.orderNumber}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>{order.orderType === 'dine-in' ? '🍽️' : '📦'}</span>
                        <span className="capitalize">{order.orderType}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{getTimeAgo(order.createdAt)}</span>
                      </div>
                    </div>
                    <Badge 
                      variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}
                      className={cn(
                        order.paymentStatus === 'paid' 
                          ? 'bg-success/20 text-success border-success/30' 
                          : 'bg-warning/20 text-warning border-warning/30'
                      )}
                    >
                      {order.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Pending'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {/* Order Items */}
                  <div className="space-y-1">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-medium">{formatCurrency(item.price)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-3 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </div>
                    <div className="font-bold text-lg">{formatCurrency(order.total)}</div>
                  </div>

                  <Link to="/track" className="block pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      Track Order Status
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
