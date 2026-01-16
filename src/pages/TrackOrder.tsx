import { useState } from 'react';
import { Search, Package, ChefHat, Clock, CheckCircle, Truck, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/data';
import { Link } from 'react-router-dom';

interface OrderData {
  id: string;
  order_number: string;
  status: string;
  order_type: string;
  customer_name: string | null;
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    size: string | null;
    menu_items: {
      name: string;
      image_url: string | null;
    } | null;
  }[];
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string; description: string }> = {
  pending: { 
    label: 'Order Received', 
    icon: Clock, 
    color: 'bg-warning/20 text-warning',
    description: 'Your order has been received and is waiting to be prepared.'
  },
  preparing: { 
    label: 'Preparing', 
    icon: ChefHat, 
    color: 'bg-primary/20 text-primary',
    description: 'Our kitchen is preparing your delicious meal!'
  },
  ready: { 
    label: 'Ready', 
    icon: Package, 
    color: 'bg-success/20 text-success',
    description: 'Your order is ready for pickup or delivery.'
  },
  served: { 
    label: 'Served', 
    icon: CheckCircle, 
    color: 'bg-success/20 text-success',
    description: 'Your order has been served. Enjoy your meal!'
  },
  completed: { 
    label: 'Completed', 
    icon: CheckCircle, 
    color: 'bg-muted text-muted-foreground',
    description: 'Order completed. Thank you for dining with us!'
  },
};

const orderTypeLabels: Record<string, { label: string; icon: string }> = {
  'dine-in': { label: 'Dine-in', icon: '🍽️' },
  'takeaway': { label: 'Takeaway', icon: '📦' },
  'delivery': { label: 'Delivery', icon: '🚴' },
};

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!orderNumber.trim()) {
      toast.error('Please enter an order number');
      return;
    }

    setIsLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          order_type,
          customer_name,
          subtotal,
          tax,
          total,
          created_at,
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            size,
            menu_items (
              name,
              image_url
            )
          )
        `)
        .eq('order_number', orderNumber.toUpperCase().trim())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setOrder(data as unknown as OrderData);
      } else {
        setOrder(null);
        toast.error('Order not found. Please check the order number.');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to fetch order. Please try again.');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusSteps = () => {
    const steps = ['pending', 'preparing', 'ready', order?.order_type === 'dine-in' ? 'served' : 'completed'];
    const currentIndex = steps.indexOf(order?.status || 'pending');
    return steps.map((step, index) => ({
      ...statusConfig[step],
      step,
      isActive: index <= currentIndex,
      isCurrent: step === order?.status,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center shadow-lg">
                <span className="text-2xl">🍲</span>
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-gradient">Eidikos Kouzina</h1>
                <p className="text-xs text-muted-foreground">Track Your Order</p>
              </div>
            </div>
            <Link to="/order">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Order More
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Search Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Track Your Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter order number (e.g., ORD-260116-001)"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button variant="gradient" onClick={handleSearch} disabled={isLoading}>
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        {order && (
          <div className="space-y-6 animate-fade-in">
            {/* Order Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Number</p>
                    <p className="text-2xl font-bold font-mono">{order.order_number}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{orderTypeLabels[order.order_type]?.icon || '📋'}</span>
                    <Badge variant="outline" className="text-sm">
                      {orderTypeLabels[order.order_type]?.label || order.order_type}
                    </Badge>
                  </div>
                </div>

                {/* Status Progress */}
                <div className="relative">
                  <div className="flex justify-between mb-2">
                    {getStatusSteps().map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div 
                          key={step.step} 
                          className={`flex flex-col items-center ${step.isCurrent ? 'scale-110' : ''} transition-transform`}
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                            step.isActive ? step.color : 'bg-muted text-muted-foreground'
                          }`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className={`text-xs text-center font-medium ${
                            step.isCurrent ? 'text-primary' : 'text-muted-foreground'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Progress line */}
                  <div className="absolute top-6 left-6 right-6 h-0.5 bg-muted -z-10">
                    <div 
                      className="h-full bg-primary transition-all duration-500"
                      style={{ 
                        width: `${(getStatusSteps().findIndex(s => s.isCurrent) / (getStatusSteps().length - 1)) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Current Status Message */}
                <div className="mt-6 p-4 rounded-lg bg-muted/50 text-center">
                  <p className="font-medium">{statusConfig[order.status]?.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Order Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {item.menu_items?.image_url ? (
                        <img 
                          src={item.menu_items.image_url} 
                          alt={item.menu_items?.name || 'Item'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">🍽️</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.menu_items?.name || 'Menu Item'}</p>
                      {item.size && <p className="text-xs text-muted-foreground">{item.size}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(item.total_price)}</p>
                      <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div className="border-t pt-3 mt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>VAT (15%)</span>
                    <span>{formatCurrency(order.tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Order Date</p>
                    <p className="font-medium">
                      {new Date(order.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {order.customer_name && (
                    <div>
                      <p className="text-muted-foreground">Customer</p>
                      <p className="font-medium">{order.customer_name}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No Order Found */}
        {searched && !order && !isLoading && (
          <Card className="text-center p-8">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't find an order with that number. Please check and try again.
            </p>
            <Link to="/order">
              <Button variant="gradient">Place New Order</Button>
            </Link>
          </Card>
        )}

        {/* Initial State */}
        {!searched && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-semibold mb-2">Enter Your Order Number</h3>
            <p className="text-muted-foreground">
              You'll find it on your receipt or confirmation screen
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
