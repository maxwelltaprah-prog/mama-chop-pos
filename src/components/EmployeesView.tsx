import { useState } from 'react';
import { Plus, UserCog, Trash2, Shield, ShoppingCart, ChefHat, Search, Mail, Phone, User, Eye } from 'lucide-react';
import { useEmployees, useCreateEmployee, useUpdateEmployeeRole, useDeleteEmployee, AppRole, Employee } from '@/hooks/useEmployees';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { EmployeeDetailsDrawer } from './EmployeeDetailsDrawer';

const roleConfig: Record<AppRole, { label: string; icon: typeof Shield; color: string; description: string }> = {
  admin: {
    label: 'Administrator',
    icon: Shield,
    color: 'bg-destructive/20 text-destructive border-destructive/30',
    description: 'Full access to all features including settings and reports',
  },
  cashier: {
    label: 'Cashier',
    icon: ShoppingCart,
    color: 'bg-primary/20 text-primary border-primary/30',
    description: 'Access to POS, orders, and tables management',
  },
  kitchen: {
    label: 'Kitchen Staff',
    icon: ChefHat,
    color: 'bg-success/20 text-success border-success/30',
    description: 'View and manage order preparation status',
  },
};

export function EmployeesView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [detailsEmployee, setDetailsEmployee] = useState<Employee | null>(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'cashier' as AppRole,
  });

  const { data: employees = [], isLoading } = useEmployees();
  const createEmployee = useCreateEmployee();
  const updateRole = useUpdateEmployeeRole();
  const deleteEmployee = useDeleteEmployee();

  const filteredEmployees = employees.filter(emp =>
    emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateEmployee = async () => {
    if (!newEmployee.email || !newEmployee.password || !newEmployee.fullName) {
      return;
    }

    await createEmployee.mutateAsync(newEmployee);
    setAddDialogOpen(false);
    setNewEmployee({ email: '', password: '', fullName: '', role: 'cashier' });
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    await deleteEmployee.mutateAsync(selectedEmployee);
    setDeleteDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    await updateRole.mutateAsync({ userId, role: newRole });
  };

  const handleViewDetails = (employee: Employee) => {
    setDetailsEmployee(employee);
    setDetailsDrawerOpen(true);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold">Employees</h2>
          <p className="text-muted-foreground">Manage staff accounts and access roles</p>
        </div>
        <Button variant="gradient" onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Role Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(roleConfig).map(([role, config]) => {
          const Icon = config.icon;
          return (
            <div key={role} className="flex items-center gap-2">
              <Badge variant="outline" className={cn('gap-1', config.color)}>
                <Icon className="w-3 h-3" />
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {config.description}
              </span>
            </div>
          );
        })}
      </div>

      {/* Employees Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-6 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-1/3 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-10 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <Card className="p-12 text-center">
          <UserCog className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No employees found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'Try a different search term' : 'Add your first employee to get started'}
          </p>
          {!searchQuery && (
            <Button variant="gradient" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => {
            const config = roleConfig[employee.role];
            const Icon = config.icon;

            return (
              <Card key={employee.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {employee.full_name || 'Unnamed'}
                        </CardTitle>
                        <Badge variant="outline" className={cn('gap-1 mt-1', config.color)}>
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleViewDetails(employee)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setSelectedEmployee(employee.user_id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      {employee.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{employee.email || 'No email'}</span>
                  </div>
                  
                  {/* Role Selector */}
                  <div className="pt-2 border-t">
                    <Label className="text-xs text-muted-foreground mb-2 block">Change Role</Label>
                    <Select
                      value={employee.role}
                      onValueChange={(value: AppRole) => handleRoleChange(employee.user_id, value)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleConfig).map(([role, config]) => {
                          const RoleIcon = config.icon;
                          return (
                            <SelectItem key={role} value={role}>
                              <div className="flex items-center gap-2">
                                <RoleIcon className="w-4 h-4" />
                                {config.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Employee Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add New Employee</DialogTitle>
            <DialogDescription>
              Create an account for a new staff member
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={newEmployee.fullName}
                onChange={(e) => setNewEmployee({ ...newEmployee, fullName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={newEmployee.password}
                onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(roleConfig).map(([role, config]) => {
                  const Icon = config.icon;
                  const isSelected = newEmployee.role === role;

                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setNewEmployee({ ...newEmployee, role: role as AppRole })}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-muted hover:border-primary/50'
                      )}
                    >
                      <div className={cn('p-2 rounded-lg', config.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{config.label}</p>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleCreateEmployee}
              disabled={createEmployee.isPending || !newEmployee.email || !newEmployee.password || !newEmployee.fullName}
            >
              {createEmployee.isPending ? 'Creating...' : 'Create Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this employee's account and revoke their access.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEmployee}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEmployee.isPending ? 'Removing...' : 'Remove Employee'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Employee Details Drawer */}
      <EmployeeDetailsDrawer
        employee={detailsEmployee}
        open={detailsDrawerOpen}
        onOpenChange={setDetailsDrawerOpen}
      />
    </div>
  );
}
