import { useState } from 'react';
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, X, User, MapPin, Check, Phone } from 'lucide-react';
import { menuItems, categories, formatCurrency, type MenuItem, type OrderType, type PaymentMethod } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CartItem {
  item: MenuItem;
  quantity: number;
  size?: string;
  notes?: string;
}

export function POSView() {
  const [selectedCategory, setSelectedCategory] = useState('main');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredItems = menuItems.filter(item => item.category === selectedCategory);

  const addToCart = (item: MenuItem) => {
    if (!item.available) return;
    
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => 
          c.item.id === item.id 
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
    
    toast.success(`Added ${item.name} to cart`);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.item.id === itemId) {
          const newQty = c.quantity + delta;
          return newQty > 0 ? { ...c, quantity: newQty } : c;
        }
        return c;
      }).filter(c => c.quantity > 0);
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setTableNumber('');
    setCustomerName('');
    setCustomerPhone('');
    setSelectedPayment(null);
  };

  const subtotal = cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const handlePayment = (method: PaymentMethod) => {
    setSelectedPayment(method);
    setPaymentDialogOpen(true);
  };

  const confirmPayment = async () => {
    if (!selectedPayment) return;
    
    // Validate order details
    if (orderType === 'dine-in' && !tableNumber) {
      toast.error('Please enter a table number');
      return;
    }
    if (orderType !== 'dine-in' && !customerName) {
      toast.error('Please enter customer name');
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Order placed successfully!', {
      description: `Order total: ${formatCurrency(total)}`,
    });
    
    clearCart();
    setPaymentDialogOpen(false);
    setIsProcessing(false);
  };

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'main': return '🍛';
      case 'soups': return '🍲';
      case 'grills': return '🍗';
      case 'drinks': return '🥤';
      case 'snacks': return '🥟';
      case 'desserts': return '🍨';
      default: return '🍽️';
    }
  };

  return (
    <div className="h-full flex animate-fade-in">
      {/* Left Side - Menu */}
      <div className="flex-1 flex flex-col overflow-hidden bg-muted/30">
        {/* Header */}
        <div className="p-4 lg:p-6 bg-card border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-display font-bold">Point of Sale</h1>
              <p className="text-sm text-muted-foreground">Select items to add to order</p>
            </div>
            
            {/* Order Type Selection */}
            <div className="flex gap-2">
              {(['dine-in', 'takeaway', 'delivery'] as OrderType[]).map((type) => (
                <Button
                  key={type}
                  variant={orderType === type ? 'default' : 'outline'}
                  onClick={() => setOrderType(type)}
                  className="capitalize"
                  size="lg"
                >
                  {type === 'dine-in' ? '🍽️' : type === 'takeaway' ? '📦' : '🚴'}
                  <span className="hidden sm:inline ml-2">{type}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="p-4 lg:px-6 border-b border-border bg-card">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat.id)}
                className="shrink-0 h-12 px-4"
              >
                <span className="text-xl mr-2">{cat.icon}</span>
                <span className="font-medium">{cat.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                disabled={!item.available}
                className={cn(
                  'group text-left rounded-2xl overflow-hidden bg-card border-2 border-border transition-all duration-300',
                  item.available 
                    ? 'hover:border-primary hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]' 
                    : 'opacity-50 cursor-not-allowed'
                )}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-5xl relative">
                  <span className="group-hover:scale-110 transition-transform duration-300">
                    {getCategoryIcon(item.category)}
                  </span>
                  {!item.available && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Badge variant="destructive" className="text-sm px-3 py-1">
                        Out of Stock
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-2">{item.name}</h3>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-primary text-lg">{formatCurrency(item.price)}</p>
                    {item.available && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Cart */}
      <div className="w-80 lg:w-96 border-l border-border bg-card flex flex-col">
        {/* Cart Header */}
        <div className="p-4 lg:p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display font-bold">Current Order</h2>
                <p className="text-xs text-muted-foreground capitalize">{orderType}</p>
              </div>
            </div>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive">
                <X className="w-4 h-4 mr-1" /> Clear
              </Button>
            )}
          </div>

          {/* Order Details Form */}
          <div className="space-y-3">
            {orderType === 'dine-in' ? (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Table Number
                </Label>
                <Select value={tableNumber} onValueChange={setTableNumber}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        Table {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-2">
                    <User className="w-3 h-3" /> Customer Name
                  </Label>
                  <Input
                    placeholder="Enter name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-2">
                    <Phone className="w-3 h-3" /> Phone Number
                  </Label>
                  <Input
                    placeholder="0244 XXX XXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <ShoppingCart className="w-10 h-10 opacity-30" />
              </div>
              <p className="font-medium">Cart is empty</p>
              <p className="text-sm">Tap items to add them</p>
            </div>
          ) : (
            cart.map((cartItem, index) => (
              <div 
                key={cartItem.item.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center text-2xl shrink-0">
                  {getCategoryIcon(cartItem.item.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{cartItem.item.name}</p>
                  <p className="text-primary font-bold">
                    {formatCurrency(cartItem.item.price * cartItem.quantity)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(cartItem.item.id, -1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center font-semibold text-sm">{cartItem.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(cartItem.item.id, 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive ml-1"
                    onClick={() => removeFromCart(cartItem.item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        {cart.length > 0 && (
          <div className="p-4 lg:p-6 border-t border-border bg-gradient-to-t from-muted/30 to-transparent">
            {/* Totals */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (5%)</span>
                <span className="font-medium">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-3 border-t border-border">
                <span>Total</span>
                <span className="text-gradient">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Payment Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-14 text-base font-semibold"
                onClick={() => handlePayment('cash')}
              >
                <Banknote className="w-5 h-5 mr-2" />
                Cash
              </Button>
              <Button 
                variant="gradient" 
                className="h-14 text-base font-semibold"
                onClick={() => handlePayment('mtn-momo')}
              >
                <CreditCard className="w-5 h-5 mr-2" />
                MoMo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Confirmation Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">Confirm Payment</DialogTitle>
            <DialogDescription>
              Review order details before completing the transaction
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Order Summary */}
            <div className="p-4 rounded-xl bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order Type</span>
                <span className="font-medium capitalize">{orderType}</span>
              </div>
              {orderType === 'dine-in' && tableNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Table</span>
                  <span className="font-medium">Table {tableNumber}</span>
                </div>
              )}
              {orderType !== 'dine-in' && customerName && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{customerName}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="font-medium">{cart.reduce((sum, c) => sum + c.quantity, 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium capitalize">
                  {selectedPayment === 'mtn-momo' ? 'MTN MoMo' : selectedPayment}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center p-4 rounded-xl bg-primary/10 border border-primary/20">
              <span className="font-semibold">Total Amount</span>
              <span className="text-2xl font-bold text-gradient">{formatCurrency(total)}</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={confirmPayment} disabled={isProcessing}>
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
