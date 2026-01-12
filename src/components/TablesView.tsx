import { Users, Clock, DollarSign } from 'lucide-react';
import { tables, sampleOrders, formatCurrency } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function TablesView() {
  const getTableOrder = (tableId: number) => {
    return sampleOrders.find(o => o.tableNumber === tableId && o.status !== 'completed');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'border-success/50 bg-success/5';
      case 'occupied':
        return 'border-primary/50 bg-primary/5';
      case 'reserved':
        return 'border-warning/50 bg-warning/5';
      default:
        return '';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-success/20 text-success';
      case 'occupied':
        return 'bg-primary/20 text-primary';
      case 'reserved':
        return 'bg-warning/20 text-warning';
      default:
        return '';
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Table Management</h1>
          <p className="text-muted-foreground">Monitor and manage restaurant tables</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm">Available ({tables.filter(t => t.status === 'available').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm">Occupied ({tables.filter(t => t.status === 'occupied').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-sm">Reserved ({tables.filter(t => t.status === 'reserved').length})</span>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table, index) => {
          const order = getTableOrder(table.id);
          
          return (
            <Card 
              key={table.id}
              className={cn(
                'animate-fade-in cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2',
                getStatusColor(table.status)
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-display font-bold">{table.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Users className="w-4 h-4" />
                      <span>{table.seats} seats</span>
                    </div>
                  </div>
                  <Badge className={cn('capitalize', getStatusBadge(table.status))}>
                    {table.status}
                  </Badge>
                </div>

                {table.status === 'occupied' && order && (
                  <div className="space-y-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Order: {order.id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">{formatCurrency(order.total)}</span>
                    </div>
                    <Badge className="w-full justify-center capitalize">
                      {order.status}
                    </Badge>
                  </div>
                )}

                {table.status === 'available' && (
                  <Button variant="gradient" className="w-full mt-4">
                    Assign Order
                  </Button>
                )}

                {table.status === 'reserved' && (
                  <div className="mt-4 p-3 rounded-lg bg-warning/10 text-center">
                    <p className="text-sm font-medium text-warning">Reserved for 7:00 PM</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card className="stat-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tables Turned Today</p>
              <p className="text-2xl font-bold">24</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="text-2xl">⏱️</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Table Time</p>
              <p className="text-2xl font-bold">42 mins</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reservations Today</p>
              <p className="text-2xl font-bold">8</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
