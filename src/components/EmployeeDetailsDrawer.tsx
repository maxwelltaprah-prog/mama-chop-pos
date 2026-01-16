import { format, formatDistanceToNow } from 'date-fns';
import { Mail, Phone, User, Calendar, Clock, Shield, ShoppingCart, ChefHat, X } from 'lucide-react';
import { Employee, AppRole } from '@/hooks/useEmployees';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface EmployeeDetailsDrawerProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleConfig: Record<AppRole, { label: string; icon: typeof Shield; color: string }> = {
  admin: {
    label: 'Administrator',
    icon: Shield,
    color: 'bg-destructive/20 text-destructive border-destructive/30',
  },
  cashier: {
    label: 'Cashier',
    icon: ShoppingCart,
    color: 'bg-primary/20 text-primary border-primary/30',
  },
  kitchen: {
    label: 'Kitchen Staff',
    icon: ChefHat,
    color: 'bg-success/20 text-success border-success/30',
  },
};

export function EmployeeDetailsDrawer({ employee, open, onOpenChange }: EmployeeDetailsDrawerProps) {
  if (!employee) return null;

  const config = roleConfig[employee.role];
  const RoleIcon = config.icon;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return format(new Date(dateString), 'PPP p');
    } catch {
      return 'Invalid date';
    }
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display">Employee Details</SheetTitle>
          <SheetDescription>
            View full profile information
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">
                {employee.full_name || 'Unnamed Employee'}
              </h3>
              <Badge variant="outline" className={cn('gap-1 mt-1', config.color)}>
                <RoleIcon className="w-3 h-3" />
                {config.label}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Contact Information
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{employee.email || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{employee.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Activity Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Activity
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Login</p>
                  <p className="font-medium">
                    {employee.last_sign_in_at ? (
                      <>
                        {formatRelativeTime(employee.last_sign_in_at)}
                        <span className="text-xs text-muted-foreground block">
                          {formatDate(employee.last_sign_in_at)}
                        </span>
                      </>
                    ) : (
                      'Never logged in'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Created</p>
                  <p className="font-medium">
                    {employee.account_created_at ? (
                      <>
                        {formatRelativeTime(employee.account_created_at)}
                        <span className="text-xs text-muted-foreground block">
                          {formatDate(employee.account_created_at)}
                        </span>
                      </>
                    ) : (
                      'Unknown'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Role Assigned */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Role Assignment
            </h4>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role Assigned</p>
                <p className="font-medium">
                  {formatRelativeTime(employee.created_at)}
                  <span className="text-xs text-muted-foreground block">
                    {formatDate(employee.created_at)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
