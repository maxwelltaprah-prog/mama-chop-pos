import { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Send, ChefHat, Search, MapPin, Loader2, CreditCard } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMenuItems, MenuItemRow, MenuItemSize, MenuItemAddon } from '@/hooks/useMenuItems';
import { useCreateCustomerOrder, useCreateOrderItem } from '@/hooks/useOrders';
import { formatCurrency, categories } from '@/lib/data';
import { PromoBanner } from '@/components/PromoBanner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface CartItem {
  menuItem: MenuItemRow;
  quantity: number;
  selectedSize?: MenuItemSize;
  selectedAddons: MenuItemAddon[];
  notes?: string;
}

export default function Order() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItemRow | null>(null);
  const [selectedSize, setSelectedSize] = useState<MenuItemSize | undefined>();
  const [selectedAddons, setSelectedAddons] = useState<MenuItemAddon[]>([]);
  const [itemNotes, setItemNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>('takeaway');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryArea, setDeliveryArea] = useState('');
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'momo' | 'cash_on_delivery'>('cash_on_delivery');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');

  const [searchParams] = useSearchParams();

  const { data: menuItems = [], isLoading } = useMenuItems();
  const createOrder = useCreateCustomerOrder();
  const createOrderItem = useCreateOrderItem();

  // Check for payment success from Paystack redirect
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const reference = searchParams.get('reference');
    
    if (paymentStatus === 'success' && reference) {
      // Verify the payment
      verifyPaystackPayment(reference);
    }
  }, [searchParams]);

  const verifyPaystackPayment = async (reference: string) => {
    try {
      setIsProcessingPayment(true);
      toast.loading('Verifying payment...', { id: 'verify-payment' });
      
      const { data, error } = await supabase.functions.invoke('paystack-verify', {
        body: { reference }
      });

      toast.dismiss('verify-payment');

      if (error) throw error;

      if (data.verified) {
        setOrderNumber(data.transaction.order_number);
        setOrderPlaced(true);
        toast.success('Payment successful! Your order is confirmed.');
        
        // Clear URL params
        window.history.replaceState({}, '', '/order');
      } else {
        toast.error('Payment could not be verified. Please contact support.');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.dismiss('verify-payment');
      toast.error('Failed to verify payment. Please contact support if you were charged.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const availableItems = useMemo(() => 
    menuItems.filter(item => item.available),
    [menuItems]
  );

  const filteredItems = useMemo(() => 
    availableItems.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      return matchesCategory && matchesSearch;
    }),
    [availableItems, selectedCategory, searchQuery]
  );

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const basePrice = item.selectedSize?.price ?? Number(item.menuItem.price);
      const addonsPrice = item.selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
      return total + (basePrice + addonsPrice) * item.quantity;
    }, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => 
    cart.reduce((count, item) => count + item.quantity, 0),
    [cart]
  );

  const getCategoryIcon = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.icon || '🍽️';
  };

  const openItemDialog = (item: MenuItemRow) => {
    setSelectedItem(item);
    const sizes = item.sizes as unknown as MenuItemSize[] | null;
    setSelectedSize(sizes?.[0]);
    setSelectedAddons([]);
    setItemNotes('');
    setItemDialogOpen(true);
  };

  const addToCart = () => {
    if (!selectedItem) return;

    const existingIndex = cart.findIndex(
      ci => ci.menuItem.id === selectedItem.id && 
           ci.selectedSize?.name === selectedSize?.name &&
           JSON.stringify(ci.selectedAddons) === JSON.stringify(selectedAddons)
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      if (itemNotes) newCart[existingIndex].notes = itemNotes;
      setCart(newCart);
    } else {
      setCart([...cart, {
        menuItem: selectedItem,
        quantity: 1,
        selectedSize,
        selectedAddons,
        notes: itemNotes || undefined,
      }]);
    }

    setItemDialogOpen(false);
    toast.success(`${selectedItem.name} added to cart`);
  };

  const updateCartItemQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity += delta;
    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  };

  const removeCartItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Validate delivery requirements
    if (orderType === 'delivery') {
      if (!deliveryAddress.trim()) {
        toast.error('Please enter a delivery address');
        return;
      }
      if (!customerName.trim()) {
        toast.error('Please enter your name for delivery');
        return;
      }
      if (!customerPhone.trim()) {
        toast.error('Please enter your phone number for delivery');
        return;
      }
    }

    // Validate email for online payments
    if ((paymentMethod === 'online' || paymentMethod === 'momo') && !customerEmail.trim()) {
      toast.error('Please enter your email for online payment');
      return;
    }

    try {
      setIsProcessingPayment(true);
      
      const TAX_RATE = 0.15; // 15% VAT
      const subtotal = cartTotal;
      const tax = subtotal * TAX_RATE;
      const total = subtotal + tax;

      // Build notes with delivery address if applicable
      let fullNotes = orderNotes || '';
      if (orderType === 'delivery' && deliveryAddress) {
        const deliveryInfo = `📍 Delivery Address: ${deliveryAddress}${deliveryArea ? ` (${deliveryArea})` : ''}`;
        fullNotes = fullNotes ? `${deliveryInfo}\n\n${fullNotes}` : deliveryInfo;
      }

      // For online/momo payments, set status to pending until payment is verified
      const initialPaymentStatus = (paymentMethod === 'online' || paymentMethod === 'momo') ? 'pending' : 'pending';

      const order = await createOrder.mutateAsync({
        order_type: orderType,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        notes: fullNotes || null,
        subtotal,
        tax,
        total,
        status: 'pending',
        payment_status: initialPaymentStatus,
        payment_method: paymentMethod === 'online' ? 'card' : paymentMethod === 'momo' ? 'momo' : 'cash',
      });

      // Create order items
      for (const item of cart) {
        const basePrice = item.selectedSize?.price ?? Number(item.menuItem.price);
        const addonsPrice = item.selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
        const unitPrice = basePrice + addonsPrice;

        await createOrderItem.mutateAsync({
          order_id: order.id,
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: unitPrice * item.quantity,
          size: item.selectedSize?.name || null,
          addons: item.selectedAddons.length > 0 
            ? JSON.parse(JSON.stringify(item.selectedAddons))
            : null,
          notes: item.notes || null,
        });
      }

      // For cash payments, complete the order flow
      if (paymentMethod === 'cash_on_delivery') {
        setOrderNumber(order.order_number);
        setOrderPlaced(true);
        resetCheckoutState();
      } else {
        // For online/momo payments, redirect to Paystack
        toast.loading('Redirecting to payment...', { id: 'payment-redirect' });
        
        const { data, error } = await supabase.functions.invoke('paystack-initialize', {
          body: {
            email: customerEmail,
            amount: total,
            orderNumber: order.order_number,
            customerName: customerName || undefined,
            customerPhone: customerPhone || undefined,
            paymentChannel: paymentMethod === 'momo' ? 'mobile_money' : 'card',
          }
        });

        toast.dismiss('payment-redirect');

        if (error) throw error;

        if (data.success && data.authorization_url) {
          // Store cart info in sessionStorage in case user comes back
          sessionStorage.setItem('pendingOrderNumber', order.order_number);
          
          // Clear local state
          setCart([]);
          setCheckoutDialogOpen(false);
          setCartOpen(false);
          
          // Redirect to Paystack
          window.location.href = data.authorization_url;
        } else {
          throw new Error(data.error || 'Failed to initialize payment');
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const resetCheckoutState = () => {
    setCart([]);
    setCheckoutDialogOpen(false);
    setCartOpen(false);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setOrderNotes('');
    setDeliveryAddress('');
    setDeliveryArea('');
    setOrderType('takeaway');
    setPaymentMethod('cash_on_delivery');
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
            <ChefHat className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">Order Placed!</h1>
          <p className="text-muted-foreground mb-4">
            Your order has been received and is being prepared.
          </p>
          <div className="bg-muted rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="text-2xl font-bold font-mono">{orderNumber}</p>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {paymentMethod === 'cash_on_delivery' ? (
              <>Please keep this number for reference. Pay the cashier or delivery rider when you receive your order.</>
            ) : paymentMethod === 'momo' ? (
              <>Mobile Money payment received! Your order is being prepared.</>
            ) : (
              <>Payment received! Your order is being prepared.</>
            )}
          </p>
          <div className="space-y-3">
            <Link to="/track" className="block">
              <Button variant="outline" size="lg" className="w-full">
                <MapPin className="w-4 h-4 mr-2" />
                Track Order
              </Button>
            </Link>
            <Button 
              variant="gradient" 
              size="lg" 
              className="w-full"
              onClick={() => setOrderPlaced(false)}
            >
              Place Another Order
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center shadow-lg">
            <span className="text-3xl">🍲</span>
          </div>
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Promo Banner */}
      <div className="pt-4">
        <PromoBanner />
      </div>

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
                <p className="text-xs text-muted-foreground">Order Online</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/track">
                <Button variant="ghost" size="sm">
                  <MapPin className="w-4 h-4 mr-1" />
                  Track Order
                </Button>
              </Link>
            
              <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="lg" className="relative">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Cart
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center">
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col">
                <SheetHeader>
                  <SheetTitle className="font-display">Your Cart</SheetTitle>
                  <SheetDescription>
                    {cart.length === 0 ? 'Your cart is empty' : `${cartItemCount} item${cartItemCount > 1 ? 's' : ''} in cart`}
                  </SheetDescription>
                </SheetHeader>

                {cart.length > 0 ? (
                  <>
                    <ScrollArea className="flex-1 -mx-6 px-6">
                      <div className="space-y-3 py-4">
                        {cart.map((item, index) => {
                          const basePrice = item.selectedSize?.price ?? Number(item.menuItem.price);
                          const addonsPrice = item.selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
                          const itemTotal = (basePrice + addonsPrice) * item.quantity;

                          return (
                            <Card key={index} className="overflow-hidden">
                              <CardContent className="p-3">
                                <div className="flex gap-3">
                                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                                    {item.menuItem.image_url ? (
                                      <img 
                                        src={item.menuItem.image_url} 
                                        alt={item.menuItem.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-2xl">{getCategoryIcon(item.menuItem.category)}</span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium truncate">{item.menuItem.name}</h4>
                                    {item.selectedSize && (
                                      <p className="text-xs text-muted-foreground">{item.selectedSize.name}</p>
                                    )}
                                    {item.selectedAddons.length > 0 && (
                                      <p className="text-xs text-muted-foreground">
                                        +{item.selectedAddons.map(a => a.name).join(', ')}
                                      </p>
                                    )}
                                    <p className="font-semibold text-primary mt-1">{formatCurrency(itemTotal)}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive"
                                      onClick={() => removeCartItem(index)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => updateCartItemQuantity(index, -1)}
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => updateCartItemQuantity(index, 1)}
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </ScrollArea>

                    <div className="border-t pt-4 space-y-4">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Subtotal</span>
                        <span>{formatCurrency(cartTotal)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Taxes calculated at checkout</p>
                      <Button 
                        variant="gradient" 
                        size="lg" 
                        className="w-full"
                        onClick={() => setCheckoutDialogOpen(true)}
                      >
                        <Send className="w-5 h-5 mr-2" />
                        Proceed to Checkout
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <span className="text-6xl mb-4">🛒</span>
                    <p className="font-medium text-muted-foreground">Your cart is empty</p>
                    <p className="text-sm text-muted-foreground/70">Add some delicious items!</p>
                  </div>
                )}
              </SheetContent>
            </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative max-w-md mx-auto mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            className="shrink-0"
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat.id)}
              className="shrink-0"
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item, index) => (
            <Card 
              key={item.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => openItemDialog(item)}
            >
              <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl">{getCategoryIcon(item.category)}</span>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-primary">{formatCurrency(Number(item.price))}</p>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-6xl mb-4">🔍</span>
            <p className="font-medium text-muted-foreground">No items found</p>
            <p className="text-sm text-muted-foreground/70">Try a different search or category</p>
          </div>
        )}
      </main>

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          {selectedItem && (
            <>
              <div className="aspect-video -mx-6 -mt-6 mb-4 bg-muted overflow-hidden rounded-t-lg">
                {selectedItem.image_url ? (
                  <img 
                    src={selectedItem.image_url} 
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-7xl">{getCategoryIcon(selectedItem.category)}</span>
                  </div>
                )}
              </div>

              <DialogHeader>
                <DialogTitle className="font-display text-xl">{selectedItem.name}</DialogTitle>
                <DialogDescription>{selectedItem.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Sizes */}
                {selectedItem.sizes && Array.isArray(selectedItem.sizes) && (selectedItem.sizes as unknown as MenuItemSize[]).length > 0 && (
                  <div className="space-y-2">
                    <Label>Size</Label>
                    <div className="flex flex-wrap gap-2">
                      {(selectedItem.sizes as unknown as MenuItemSize[]).map((size) => (
                        <Button
                          key={size.name}
                          variant={selectedSize?.name === size.name ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedSize(size)}
                        >
                          {size.name} - {formatCurrency(size.price)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add-ons */}
                {selectedItem.addons && Array.isArray(selectedItem.addons) && (selectedItem.addons as unknown as MenuItemAddon[]).length > 0 && (
                  <div className="space-y-2">
                    <Label>Add-ons</Label>
                    <div className="flex flex-wrap gap-2">
                      {(selectedItem.addons as unknown as MenuItemAddon[]).map((addon) => {
                        const isSelected = selectedAddons.some(a => a.name === addon.name);
                        return (
                          <Button
                            key={addon.name}
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name));
                              } else {
                                setSelectedAddons([...selectedAddons, addon]);
                              }
                            }}
                          >
                            +{addon.name} ({formatCurrency(addon.price)})
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Special Instructions</Label>
                  <Textarea
                    id="notes"
                    placeholder="e.g., No onions, extra spicy..."
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="gradient" onClick={addToCart}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Cart - {formatCurrency(
                    (selectedSize?.price ?? Number(selectedItem.price)) +
                    selectedAddons.reduce((sum, a) => sum + a.price, 0)
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Complete Your Order</DialogTitle>
            <DialogDescription>
              Enter your details to place the order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Order Type Selection */}
            <div className="space-y-2">
              <Label>Order Type</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('dine-in')}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                    orderType === 'dine-in' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <span className="text-xl">🍽️</span>
                  <span className="text-sm font-medium">Dine-in</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('takeaway')}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                    orderType === 'takeaway' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <span className="text-xl">📦</span>
                  <span className="text-sm font-medium">Takeaway</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('delivery')}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                    orderType === 'delivery' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <span className="text-xl">🚴</span>
                  <span className="text-sm font-medium">Delivery</span>
                </button>
              </div>
            </div>

            {/* Delivery Address Fields */}
            {orderType === 'delivery' && (
              <div className="space-y-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 text-primary">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">Delivery Details</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                  <Textarea
                    id="deliveryAddress"
                    placeholder="Enter your full delivery address..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryArea">Area/Landmark (Optional)</Label>
                  <Input
                    id="deliveryArea"
                    placeholder="e.g., Near XYZ Mall, Osu"
                    value={deliveryArea}
                    onChange={(e) => setDeliveryArea(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="customerName">{orderType === 'delivery' ? 'Name *' : 'Name (Optional)'}</Label>
              <Input
                id="customerName"
                placeholder="Your name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">{orderType === 'delivery' ? 'Phone Number *' : 'Phone Number (Optional)'}</Label>
              <Input
                id="customerPhone"
                type="tel"
                placeholder="Your phone number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            {/* Email for online payments */}
            {(paymentMethod === 'online' || paymentMethod === 'momo') && (orderType === 'takeaway' || orderType === 'delivery') && (
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email Address *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="your.email@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Required for payment receipt</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="orderNotes">Order Notes (Optional)</Label>
              <Textarea
                id="orderNotes"
                placeholder="Any special requests..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Payment Method Selection */}
            {(orderType === 'takeaway' || orderType === 'delivery') && (
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('momo')}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      paymentMethod === 'momo' 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <span className="text-xl">📱</span>
                    <span className="text-sm font-medium">Mobile Money</span>
                    <span className="text-xs text-muted-foreground">MTN, Voda, AT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online')}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      paymentMethod === 'online' 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <span className="text-xl">💳</span>
                    <span className="text-sm font-medium">Card</span>
                    <span className="text-xs text-muted-foreground">Pay online</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash_on_delivery')}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      paymentMethod === 'cash_on_delivery' 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <span className="text-xl">💵</span>
                    <span className="text-sm font-medium">Cash</span>
                    <span className="text-xs text-muted-foreground">{orderType === 'delivery' ? 'On delivery' : 'On pickup'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>VAT (15%)</span>
                <span>{formatCurrency(cartTotal * 0.15)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(cartTotal * 1.15)}</span>
              </div>
              {(paymentMethod === 'online' || paymentMethod === 'momo') && (orderType === 'takeaway' || orderType === 'delivery') && (
                <p className="text-xs text-success flex items-center gap-1 pt-1">
                  <span>✓</span> Payment will be recorded automatically
                </p>
              )}
              {paymentMethod === 'cash_on_delivery' && (orderType === 'takeaway' || orderType === 'delivery') && (
                <p className="text-xs text-muted-foreground pt-1">
                  💡 Pay to the cashier or delivery rider
                </p>
              )}
              {paymentMethod === 'momo' && (orderType === 'takeaway' || orderType === 'delivery') && (
                <p className="text-xs text-muted-foreground pt-1">
                  📲 You'll receive a prompt on your phone to complete payment
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutDialogOpen(false)} disabled={isProcessingPayment}>
              Cancel
            </Button>
            <Button 
              variant="gradient" 
              onClick={handleCheckout}
              disabled={createOrder.isPending || isProcessingPayment}
            >
              {(createOrder.isPending || isProcessingPayment) ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isProcessingPayment ? 'Processing...' : 'Placing Order...'}
                </span>
              ) : (
                <>
                  {(paymentMethod === 'momo' || paymentMethod === 'online') && (orderType !== 'dine-in') ? (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay {formatCurrency(cartTotal * 1.15)}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Place Order
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Cart Button (Mobile) */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:hidden z-50">
          <Button 
            variant="gradient" 
            size="lg" 
            className="w-full shadow-xl"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            View Cart ({cartItemCount}) - {formatCurrency(cartTotal)}
          </Button>
        </div>
      )}
    </div>
  );
}
