import { useState } from 'react';
import { Users, Clock, DollarSign, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { cn } from '@/lib/utils';
import { useTables, useCreateTable, useUpdateTable, useDeleteTable } from '@/hooks/useTables';
import { useOrders } from '@/hooks/useOrders';
import { toast } from 'sonner';

export function TablesView() {
  const { data: tables = [], isLoading } = useTables();
  const { data: orders = [] } = useOrders();
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<typeof tables[0] | null>(null);
  const [formData, setFormData] = useState({
    table_number: '',
    name: '',
    seats: '4',
    status: 'available' as 'available' | 'occupied' | 'reserved',
  });

  const getTableOrder = (tableId: string) => {
    return orders.find(o => o.table_id === tableId && o.status !== 'completed');
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

  const handleAddTable = async () => {
    if (!formData.name || !formData.table_number) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createTable.mutateAsync({
        table_number: parseInt(formData.table_number),
        name: formData.name,
        seats: parseInt(formData.seats),
        status: formData.status,
      });
      setAddDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleEditTable = async () => {
    if (!selectedTable) return;

    try {
      await updateTable.mutateAsync({
        id: selectedTable.id,
        name: formData.name,
        seats: parseInt(formData.seats),
        status: formData.status,
      });
      setEditDialogOpen(false);
      setSelectedTable(null);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (confirm('Are you sure you want to delete this table?')) {
      await deleteTable.mutateAsync(id);
    }
  };

  const handleAssignOrder = (tableId: string, tableName: string) => {
    // Update table status to occupied
    updateTable.mutate({
      id: tableId,
      status: 'occupied',
    });
    toast.success(`${tableName} is now occupied`);
  };

  const openEditDialog = (table: typeof tables[0]) => {
    setSelectedTable(table);
    setFormData({
      table_number: table.table_number.toString(),
      name: table.name,
      seats: table.seats.toString(),
      status: table.status as 'available' | 'occupied' | 'reserved',
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      table_number: '',
      name: '',
      seats: '4',
      status: 'available',
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Table Management</h1>
          <p className="text-muted-foreground">Monitor and manage restaurant tables</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
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
          <Button variant="gradient" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Table
          </Button>
        </div>
      </div>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-6xl mb-4">🪑</span>
          <p className="font-medium text-muted-foreground">No tables configured</p>
          <p className="text-sm text-muted-foreground/70 mb-4">Add your first table to get started</p>
          <Button variant="gradient" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Table
          </Button>
        </div>
      ) : (
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
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(table);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Badge className={cn('capitalize', getStatusBadge(table.status))}>
                        {table.status}
                      </Badge>
                    </div>
                  </div>

                  {table.status === 'occupied' && order && (
                    <div className="space-y-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Order: {order.order_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">{formatCurrency(Number(order.total))}</span>
                      </div>
                      <Badge className="w-full justify-center capitalize">
                        {order.status}
                      </Badge>
                    </div>
                  )}

                  {table.status === 'available' && (
                    <Button 
                      variant="gradient" 
                      className="w-full mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssignOrder(table.id, table.name);
                      }}
                    >
                      Assign Order
                    </Button>
                  )}

                  {table.status === 'reserved' && (
                    <div className="mt-4 p-3 rounded-lg bg-warning/10 text-center">
                      <p className="text-sm font-medium text-warning">Reserved</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateTable.mutate({ id: table.id, status: 'available' });
                        }}
                      >
                        Clear Reservation
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card className="stat-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available Tables</p>
              <p className="text-2xl font-bold">{tables.filter(t => t.status === 'available').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="text-2xl">🍽️</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Occupied Tables</p>
              <p className="text-2xl font-bold">{tables.filter(t => t.status === 'occupied').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Seats</p>
              <p className="text-2xl font-bold">{tables.reduce((sum, t) => sum + t.seats, 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Table Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
            <DialogDescription>Create a new table for your restaurant</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Table Number</Label>
                <Input
                  type="number"
                  placeholder="1"
                  value={formData.table_number}
                  onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Seats</Label>
                <Input
                  type="number"
                  placeholder="4"
                  value={formData.seats}
                  onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Table Name</Label>
              <Input
                placeholder="Table 1"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button variant="gradient" onClick={handleAddTable} disabled={createTable.isPending}>
              {createTable.isPending ? 'Adding...' : 'Add Table'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
            <DialogDescription>Update table details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Table Name</Label>
              <Input
                placeholder="Table 1"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Seats</Label>
              <Input
                type="number"
                placeholder="4"
                value={formData.seats}
                onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="destructive" 
              onClick={() => selectedTable && handleDeleteTable(selectedTable.id)}
              disabled={deleteTable.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button variant="gradient" onClick={handleEditTable} disabled={updateTable.isPending}>
              {updateTable.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
