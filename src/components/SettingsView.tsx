import { Building2, MapPin, Phone, Mail, Clock, Users, Printer, Bell, Shield, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function SettingsView() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your restaurant configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Restaurant Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Restaurant Information
            </CardTitle>
            <CardDescription>Basic details about your restaurant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Restaurant Name</Label>
              <Input id="name" defaultValue="ChopBar Accra" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Location
              </Label>
              <Input id="location" defaultValue="15 Oxford Street, Osu, Accra" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone
                </Label>
                <Input id="phone" defaultValue="+233 24 123 4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </Label>
                <Input id="email" defaultValue="info@chopbar.gh" />
              </div>
            </div>
            <Button variant="gradient" className="w-full">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Operating Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Operating Hours
            </CardTitle>
            <CardDescription>Set your restaurant opening times</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {['Monday - Friday', 'Saturday', 'Sunday'].map((day) => (
                <div key={day} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="font-medium">{day}</span>
                  <div className="flex items-center gap-2">
                    <Input className="w-24 text-center" defaultValue="8:00 AM" />
                    <span className="text-muted-foreground">to</span>
                    <Input className="w-24 text-center" defaultValue="10:00 PM" />
                  </div>
                </div>
              ))}
            </div>
            <Button variant="gradient" className="w-full">Update Hours</Button>
          </CardContent>
        </Card>

        {/* Table Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Table Configuration
            </CardTitle>
            <CardDescription>Manage your table setup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-3xl font-bold">8</p>
                <p className="text-sm text-muted-foreground">Total Tables</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-3xl font-bold">38</p>
                <p className="text-sm text-muted-foreground">Total Seats</p>
              </div>
            </div>
            <Button variant="outline" className="w-full">Manage Tables</Button>
          </CardContent>
        </Card>

        {/* Receipt Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-primary" />
              Receipt Settings
            </CardTitle>
            <CardDescription>Configure receipt printing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-print receipts</p>
                <p className="text-sm text-muted-foreground">Print after each order</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Include tax breakdown</p>
                <p className="text-sm text-muted-foreground">Show itemized taxes</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">QR code on receipt</p>
                <p className="text-sm text-muted-foreground">For feedback collection</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Manage alert preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New order alerts</p>
                <p className="text-sm text-muted-foreground">Sound notification</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Low stock warnings</p>
                <p className="text-sm text-muted-foreground">When items run low</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Daily summary email</p>
                <p className="text-sm text-muted-foreground">End of day report</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Staff Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Staff & Access
            </CardTitle>
            <CardDescription>Manage staff roles and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { name: 'Kwame Adu', role: 'Cashier', active: true },
                { name: 'Ama Serwaa', role: 'Kitchen', active: true },
                { name: 'Kofi Mensah', role: 'Admin', active: true },
              ].map((staff) => (
                <div key={staff.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="font-semibold text-primary">
                        {staff.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{staff.name}</p>
                      <p className="text-sm text-muted-foreground">{staff.role}</p>
                    </div>
                  </div>
                  <Switch defaultChecked={staff.active} />
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full">Add Staff Member</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
