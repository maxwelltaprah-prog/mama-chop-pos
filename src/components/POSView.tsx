import { useState } from 'react';
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, X, User, MapPin } from 'lucide-react';
import { menuItems, categories, formatCurrency, type MenuItem, type OrderType } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');

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
    setTableNumber(null);
    setCustomerName('');
  };

  const subtotal = cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0);
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + tax;

  return (
    <div className="h-full flex animate-fade-in">
      {/* Left Side - Menu */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-display font-bold mb-4">Point of Sale</h1>
          
          {/* Order Type */}
          <div className="flex gap-2">
            {(['dine-in', 'takeaway', 'delivery'] as OrderType[]).map((type) => (
              <Button
                key={type}
                variant={orderType === type ? 'default' : 'outline'}
                onClick={() => setOrderType(type)}
                className="capitalize"
              >
                {type === 'dine-in' ? '🍽️' : type === 'takeaway' ? '📦' : '🚴'} {type}
              </Button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="p-4 border-b border-border">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'menu-category-active' : 'menu-category'}
                onClick={() => setSelectedCategory(cat.id)}
                className="shrink-0"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-sm">{cat.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                disabled={!item.available}
                className={cn(
                  'menu-card text-left p-4 bg-card border border-border',
                  !item.available && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="aspect-square rounded-xl bg-muted mb-3 flex items-center justify-center text-4xl">
                  {item.category === 'main' ? '🍛' : 
                   item.category === 'soups' ? '🍲' :
                   item.category === 'grills' ? '🍗' :
                   item.category === 'drinks' ? '🥤' :
                   item.category === 'snacks' ? '🥟' : '🍨'}
                </div>
                <h3 className="font-semibold text-sm line-clamp-2 mb-1">{item.name}</h3>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-primary">{formatCurrency(item.price)}</p>
                  {!item.available && (
                    <Badge variant="destructive" className="text-xs">Out</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Cart */}
      <div className="w-80 lg:w-96 border-l border-border bg-card flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold">Current Order</h2>
            </div>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                <X className="w-4 h-4 mr-1" /> Clear
              </Button>
            )}
          </div>

          {/* Order Details */}
          {orderType === 'dine-in' && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Table #"
                value={tableNumber || ''}
                onChange={(e) => setTableNumber(Number(e.target.value))}
                className="w-full h-9"
              />
            </div>
          )}
          {orderType !== 'dine-in' && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full h-9"
              />
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-medium">Cart is empty</p>
              <p className="text-sm">Tap items to add them</p>
            </div>
          ) : (
            cart.map((cartItem) => (
              <div 
                key={cartItem.item.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{cartItem.item.name}</p>
                  <p className="text-primary font-semibold">
                    {formatCurrency(cartItem.item.price * cartItem.quantity)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(cartItem.item.id, -1)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold">{cartItem.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(cartItem.item.id, 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
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
          <div className="p-4 border-t border-border space-y-4">
            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (5%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-gradient">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Payment Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="pos" className="h-14">
                <Banknote className="w-5 h-5 mr-2" />
                Cash
              </Button>
              <Button variant="pos-primary" className="h-14">
                <CreditCard className="w-5 h-5 mr-2" />
                MoMo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
