import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  ChefHat
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pos', label: 'POS', icon: ShoppingCart },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'orders', label: 'Orders', icon: ChefHat },
  { id: 'tables', label: 'Tables', icon: Users },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="w-20 lg:w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-md">
            <span className="text-xl">🍲</span>
          </div>
          <div className="hidden lg:block">
            <h1 className="font-display font-bold text-lg text-sidebar-foreground">ChopBar</h1>
            <p className="text-xs text-muted-foreground">POS System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 lg:px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                'w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'gradient-primary text-primary-foreground shadow-md'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="hidden lg:block font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center justify-center lg:justify-start gap-3 p-2">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">KA</span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-sidebar-foreground">Kwame Adu</p>
            <p className="text-xs text-muted-foreground">Cashier</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
