import { ReactNode, useState, useEffect } from 'react';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import {
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  ChefHat,
  LogOut,
  Menu,
  X,
  Bell,
  BellRing,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface AppLayoutProps {
  children: ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'cashier', 'kitchen'] },
  { id: 'pos', label: 'POS', icon: ShoppingCart, roles: ['admin', 'cashier'] },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed, roles: ['admin'] },
  { id: 'orders', label: 'Orders', icon: ChefHat, roles: ['admin', 'cashier', 'kitchen'] },
  { id: 'tables', label: 'Tables', icon: Users, roles: ['admin', 'cashier'] },
  { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['admin'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

export function AppLayout({ children, activeView, onViewChange }: AppLayoutProps) {
  const { user, profile, role, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Listen for customer order notifications
  const { unreadCount, clearNotifications, notificationPermission, requestPermission } = useOrderNotifications();

  // Listen for navigate-to-orders event
  useEffect(() => {
    const handleNavigateToOrders = () => {
      onViewChange('orders');
      clearNotifications();
    };
    window.addEventListener('navigate-to-orders', handleNavigateToOrders);
    return () => window.removeEventListener('navigate-to-orders', handleNavigateToOrders);
  }, [onViewChange, clearNotifications]);

  // Clear notifications when viewing orders
  useEffect(() => {
    if (activeView === 'orders') {
      clearNotifications();
    }
  }, [activeView, clearNotifications]);

  // Handle enabling push notifications
  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      // Show a toast to confirm
      import('sonner').then(({ toast }) => {
        toast.success('Push notifications enabled!', {
          description: 'You will now receive alerts for new orders even when this tab is in the background.'
        });
      });
    }
  };

  const filteredNav = navigationItems.filter(item => 
    !role || item.roles.includes(role)
  );

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'admin': return 'bg-destructive/20 text-destructive';
      case 'cashier': return 'bg-primary/20 text-primary';
      case 'kitchen': return 'bg-success/20 text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:relative inset-y-0 left-0 z-50 w-72 lg:w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-md">
              <span className="text-xl">🍲</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-lg">Eidikos Kouzina</h1>
              <p className="text-xs text-muted-foreground">POS System</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left',
                  isActive
                    ? 'gradient-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">
                    {profile?.full_name || user?.email}
                  </p>
                  <Badge className={cn('text-xs capitalize mt-1', getRoleBadgeColor())}>
                    {role || 'Staff'}
                  </Badge>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTheme}>
                {isDark ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden sm:block">
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-GB', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Push notification enable button */}
            {notificationPermission === 'default' && (
              <Button 
                variant="outline" 
                size="sm"
                className="hidden sm:flex items-center gap-2 text-xs"
                onClick={handleEnableNotifications}
              >
                <BellRing className="w-4 h-4" />
                Enable Alerts
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => {
                onViewChange('orders');
                clearNotifications();
              }}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
