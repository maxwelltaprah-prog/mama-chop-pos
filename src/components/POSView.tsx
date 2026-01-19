import { useState, useMemo } from 'react';
import { Plus, Minus, Trash2, ShoppingCart, Banknote, X, User, MapPin, Check, Phone, Printer, Loader2, Send, Mail, ExternalLink, Copy, Smartphone } from 'lucide-react';
import { formatCurrency } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMenuItems, MenuItemRow } from '@/hooks/useMenuItems';
import { useTables } from '@/hooks/useTables';
import { useCreateOrder } from '@/hooks/useOrders';
import { printReceipt, generateReceiptHTML } from '@/lib/printReceipt';
import { categories } from '@/lib/data';
import { Json } from '@/integrations/supabase/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';

type OrderType = 'dine-in' | 'takeaway' | 'delivery';
type PaymentMethod = 'cash' | 'mtn-momo' | 'vodafone-cash' | 'airteltigo';

interface CartItem {
  item: MenuItemRow;
  quantity: number;
  size?: string;
  notes?: string;
}

export function POSView() {
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState('main');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [tableId, setTableId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  
  // Online payment states
  const [onlinePaymentDialogOpen, setOnlinePaymentDialogOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);

  const { data: menuItems = [], isLoading: menuLoading } = useMenuItems();
  const { data: tables = [] } = useTables();
  const createOrder = useCreateOrder();

  const filteredItems = menuItems.filter(item => item.category === selectedCategory);
  
  const cartItemCount = useMemo(() => 
    cart.reduce((sum, c) => sum + c.quantity, 0),
    [cart]
  );

  const addToCart = (item: MenuItemRow) => {
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
    setTableId('');
    setCustomerName('');
    setCustomerPhone('');
    setSelectedPayment(null);
  };

  const subtotal = cart.reduce((sum, c) => sum + (Number(c.item.price) * c.quantity), 0);
  const TAX_RATE = 0.15; // 15% VAT
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handlePayment = (method: PaymentMethod) => {
    setSelectedPayment(method);
    setPaymentDialogOpen(true);
  };

  const handleOnlinePayment = () => {
    // Validate order details first
    if (orderType === 'dine-in' && !tableId) {
      toast.error('Please select a table');
      return;
    }
    if (orderType !== 'dine-in' && !customerName) {
      toast.error('Please enter customer name');
      return;
    }
    setCustomerEmail('');
    setPaymentUrl('');
    setOnlinePaymentDialogOpen(true);
  };

  const initiateOnlinePayment = async () => {
    if (!customerEmail || !customerEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsInitiatingPayment(true);

    try {
      // Create pending order
      const pendingPayload = {
        order_type: orderType,
        table_id: orderType === 'dine-in' ? tableId : null,
        customer_name: orderType !== 'dine-in' ? customerName : null,
        customer_phone: orderType !== 'dine-in' ? customerPhone : null,
        subtotal,
        tax,
        total,
        items: cart.map(c => ({
          menu_item_id: c.item.id,
          quantity: c.quantity,
          size: c.size || null,
          unit_price: Number(c.item.price),
          total_price: Number(c.item.price) * c.quantity,
          notes: c.notes || null,
          addons: null,
        })),
      };

      const { data: pendingData, error: pendingError } = await supabase.functions.invoke('create-pending-order', {
        body: {
          customerEmail,
          amount: total,
          paymentChannel: 'mobile_money',
          payload: pendingPayload,
        },
      });

      if (pendingError || !pendingData?.pendingOrderId) {
        throw new Error(pendingError?.message || 'Failed to create pending order');
      }

      // Initialize Paystack payment
      const { data: paystackData, error: paystackError } = await supabase.functions.invoke('paystack-initialize', {
        body: {
          email: customerEmail,
          amount: total,
          pendingOrderId: pendingData.pendingOrderId,
          customerName: customerName || 'Customer',
          customerPhone: customerPhone || '',
          paymentChannel: 'mobile_money',
        },
      });

      if (paystackError || !paystackData?.authorization_url) {
        throw new Error(paystackError?.message || 'Failed to initialize payment');
      }

      setPaymentUrl(paystackData.authorization_url);
      toast.success('Payment link generated! Share with customer.');
    } catch (error) {
      console.error('Online payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate payment link');
    } finally {
      setIsInitiatingPayment(false);
    }
  };

  const copyPaymentUrl = () => {
    navigator.clipboard.writeText(paymentUrl);
    toast.success('Payment link copied to clipboard!');
  };

  const confirmPayment = async () => {
    if (!selectedPayment) return;
    
    // Validate order details
    if (orderType === 'dine-in' && !tableId) {
      toast.error('Please select a table');
      return;
    }
    if (orderType !== 'dine-in' && !customerName) {
      toast.error('Please enter customer name');
      return;
    }

    try {
      const orderData = await createOrder.mutateAsync({
        order: {
          order_type: orderType,
          table_id: orderType === 'dine-in' ? tableId : null,
          customer_name: orderType !== 'dine-in' ? customerName : null,
          customer_phone: orderType !== 'dine-in' ? customerPhone : null,
          payment_method: selectedPayment,
          payment_status: selectedPayment === 'cash' ? 'pending' : 'paid',
          subtotal,
          tax,
          total,
          status: 'pending',
        },
        items: cart.map(c => ({
          menu_item_id: c.item.id,
          quantity: c.quantity,
          size: c.size || null,
          unit_price: Number(c.item.price),
          total_price: Number(c.item.price) * c.quantity,
          notes: c.notes || null,
          addons: null,
        })),
      });

      // Create a mock order with items for printing
      const orderWithItems = {
        ...orderData,
        order_items: cart.map(c => ({
          id: crypto.randomUUID(),
          order_id: orderData.id,
          menu_item_id: c.item.id,
          quantity: c.quantity,
          size: c.size || null,
          unit_price: Number(c.item.price),
          total_price: Number(c.item.price) * c.quantity,
          notes: c.notes || null,
          addons: null as Json,
          created_at: new Date().toISOString(),
          menu_items: c.item,
        })),
      };

      // Print receipt
      printReceipt({ order: orderWithItems });
      
      clearCart();
      setPaymentDialogOpen(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.icon || '🍽️';
  };

  if (menuLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Cart content component to avoid duplication
  const CartContent = () => (
    <>
      {/* Cart Header */}
      <div className="p-4 border-b border-border">
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
                <MapPin className="w-3 h-3" /> Table
              </Label>
              <Select value={tableId} onValueChange={setTableId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map(table => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.name} ({table.seats} seats) {table.status !== 'available' ? `[${table.status}]` : ''}
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
      <ScrollArea className="flex-1 p-4">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <ShoppingCart className="w-10 h-10 opacity-30" />
            </div>
            <p className="font-medium">Cart is empty</p>
            <p className="text-sm">Tap items to add them</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((cartItem, index) => (
              <div 
                key={cartItem.item.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                  {cartItem.item.image_url ? (
                    <img src={cartItem.item.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getCategoryIcon(cartItem.item.category)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{cartItem.item.name}</p>
                  <p className="text-primary font-bold">
                    {formatCurrency(Number(cartItem.item.price) * cartItem.quantity)}
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
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Cart Footer */}
      {cart.length > 0 && (
        <div className="p-4 border-t border-border bg-gradient-to-t from-muted/30 to-transparent safe-bottom">
          {/* Totals */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VAT (15%)</span>
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
              onClick={handleOnlinePayment}
            >
              <Smartphone className="w-5 h-5 mr-2" />
              MoMo
            </Button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="h-full flex flex-col lg:flex-row animate-fade-in">
      {/* Menu Section */}
      <div className="flex-1 flex flex-col overflow-hidden bg-muted/30">
        {/* Header */}
        <div className="p-3 sm:p-4 lg:p-6 bg-card border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-display font-bold truncate">Point of Sale</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Select items to add to order</p>
            </div>
            
            {/* Order Type Selection */}
            <div className="flex gap-1.5 sm:gap-2 shrink-0">
              {(['dine-in', 'takeaway', 'delivery'] as OrderType[]).map((type) => (
                <Button
                  key={type}
                  variant={orderType === type ? 'default' : 'outline'}
                  onClick={() => setOrderType(type)}
                  className="capitalize px-2 sm:px-4"
                  size="default"
                >
                  {type === 'dine-in' ? '🍽️' : type === 'takeaway' ? '📦' : '🚴'}
                  <span className="hidden md:inline ml-2">{type}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="p-3 sm:p-4 lg:px-6 border-b border-border bg-card">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat.id)}
                className="shrink-0 h-10 sm:h-12 px-3 sm:px-4"
              >
                <span className="text-lg sm:text-xl mr-1.5 sm:mr-2">{cat.icon}</span>
                <span className="font-medium text-sm sm:text-base">{cat.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto pb-24 lg:pb-6">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <span className="text-5xl sm:text-6xl mb-4">🍽️</span>
              <p className="font-medium">No items in this category</p>
              <p className="text-sm">Add menu items from Menu Management</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
              {filteredItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  disabled={!item.available}
                  className={cn(
                    'group text-left rounded-xl sm:rounded-2xl overflow-hidden bg-card border-2 border-border transition-all duration-200',
                    item.available 
                      ? 'hover:border-primary hover:shadow-lg active:scale-[0.98]' 
                      : 'opacity-50 cursor-not-allowed'
                  )}
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-4xl sm:text-5xl relative overflow-hidden">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <span className="group-hover:scale-105 transition-transform duration-300">
                        {getCategoryIcon(item.category)}
                      </span>
                    )}
                    {!item.available && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Badge variant="destructive" className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1">
                          Out of Stock
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-2 sm:p-4">
                    <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 mb-1 sm:mb-2">{item.name}</h3>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-primary text-sm sm:text-lg">{formatCurrency(Number(item.price))}</p>
                      {item.available && (
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Cart Sidebar */}
      <div className="hidden lg:flex w-80 xl:w-96 border-l border-border bg-card flex-col">
        <CartContent />
      </div>

      {/* Mobile Cart FAB + Sheet */}
      {isMobile && (
        <>
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button
                variant="gradient"
                size="lg"
                className="fixed bottom-4 right-4 z-50 h-14 px-5 rounded-full shadow-lg lg:hidden"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Cart
                {cartItemCount > 0 && (
                  <Badge className="ml-2 bg-background text-primary h-6 min-w-6 rounded-full">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col rounded-t-2xl">
              <SheetHeader className="sr-only">
                <SheetTitle>Shopping Cart</SheetTitle>
              </SheetHeader>
              <CartContent />
            </SheetContent>
          </Sheet>
        </>
      )}

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
              {orderType === 'dine-in' && tableId && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Table</span>
                  <span className="font-medium">{tables.find(t => t.id === tableId)?.name}</span>
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

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setPaymentDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="gradient" 
              onClick={confirmPayment}
              disabled={createOrder.isPending}
              className="flex-1"
            >
              {createOrder.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  <Printer className="w-4 h-4 mr-2" />
                </>
              )}
            {createOrder.isPending ? 'Processing...' : 'Confirm & Print'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      {/* Online Payment Dialog */}
      <Dialog open={onlinePaymentDialogOpen} onOpenChange={setOnlinePaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">Send Payment Link</DialogTitle>
            <DialogDescription>
              Generate a payment link for customer to pay via Mobile Money
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {!paymentUrl ? (
              <>
                {/* Order Summary */}
                <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Order Type</span>
                    <span className="font-medium capitalize">{orderType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items</span>
                    <span className="font-medium">{cart.reduce((sum, c) => sum + c.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Customer Email */}
                <div className="space-y-2">
                  <Label htmlFor="customerEmail" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Customer Email (required for payment)
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="customer@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Payment Link Generated */}
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-success" />
                  </div>
                  <p className="text-lg font-semibold">Payment Link Ready!</p>
                  <p className="text-sm text-muted-foreground">
                    Share this link with the customer or let them scan the QR code
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center p-4 bg-white rounded-xl">
                  <QRCodeSVG value={paymentUrl} size={180} />
                </div>

                {/* Payment Link */}
                <div className="flex gap-2">
                  <Input
                    value={paymentUrl}
                    readOnly
                    className="text-xs font-mono"
                  />
                  <Button variant="outline" size="icon" onClick={copyPaymentUrl}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open(paymentUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Link
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={() => {
                      clearCart();
                      setOnlinePaymentDialogOpen(false);
                      setPaymentUrl('');
                    }}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Done
                  </Button>
                </div>
              </>
            )}
          </div>

          {!paymentUrl && (
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => setOnlinePaymentDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="gradient" 
                onClick={initiateOnlinePayment}
                disabled={isInitiatingPayment || !customerEmail}
                className="flex-1"
              >
                {isInitiatingPayment ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {isInitiatingPayment ? 'Generating...' : 'Generate Link'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
