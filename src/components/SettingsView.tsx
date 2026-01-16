import { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Mail, Clock, Users, Printer, Bell, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettings, useUpdateSettings, SettingsMap } from '@/hooks/useSettings';
import { useTables } from '@/hooks/useTables';
import { OrderQRCode } from '@/components/OrderQRCode';
import { toast } from 'sonner';

export function SettingsView() {
  const { data: settings, isLoading } = useSettings();
  const { data: tables } = useTables();
  const updateSettings = useUpdateSettings();
  
  // Local state for form inputs
  const [restaurantInfo, setRestaurantInfo] = useState({
    restaurant_name: '',
    location: '',
    phone: '',
    email: '',
  });
  
  const [operatingHours, setOperatingHours] = useState({
    hours_weekday_open: '',
    hours_weekday_close: '',
    hours_saturday_open: '',
    hours_saturday_close: '',
    hours_sunday_open: '',
    hours_sunday_close: '',
  });
  
  const [toggleSettings, setToggleSettings] = useState({
    auto_print_receipts: false,
    include_tax_breakdown: false,
    qr_code_on_receipt: false,
    new_order_alerts: false,
    low_stock_warnings: false,
    daily_summary_email: false,
  });

  // Initialize from settings
  useEffect(() => {
    if (settings) {
      setRestaurantInfo({
        restaurant_name: settings.restaurant_name || '',
        location: settings.location || '',
        phone: settings.phone || '',
        email: settings.email || '',
      });
      setOperatingHours({
        hours_weekday_open: settings.hours_weekday_open || '8:00 AM',
        hours_weekday_close: settings.hours_weekday_close || '10:00 PM',
        hours_saturday_open: settings.hours_saturday_open || '8:00 AM',
        hours_saturday_close: settings.hours_saturday_close || '10:00 PM',
        hours_sunday_open: settings.hours_sunday_open || '10:00 AM',
        hours_sunday_close: settings.hours_sunday_close || '8:00 PM',
      });
      setToggleSettings({
        auto_print_receipts: settings.auto_print_receipts === 'true',
        include_tax_breakdown: settings.include_tax_breakdown === 'true',
        qr_code_on_receipt: settings.qr_code_on_receipt === 'true',
        new_order_alerts: settings.new_order_alerts === 'true',
        low_stock_warnings: settings.low_stock_warnings === 'true',
        daily_summary_email: settings.daily_summary_email === 'true',
      });
    }
  }, [settings]);

  const handleSaveRestaurantInfo = () => {
    updateSettings.mutate(restaurantInfo);
  };

  const handleSaveHours = () => {
    updateSettings.mutate(operatingHours);
  };

  const handleToggleChange = (key: keyof typeof toggleSettings, value: boolean) => {
    setToggleSettings(prev => ({ ...prev, [key]: value }));
    updateSettings.mutate({ [key]: value ? 'true' : 'false' });
  };

  const totalTables = tables?.length || 0;
  const totalSeats = tables?.reduce((sum, t) => sum + t.seats, 0) || 0;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
              <Input 
                id="name" 
                value={restaurantInfo.restaurant_name}
                onChange={(e) => setRestaurantInfo(prev => ({ ...prev, restaurant_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Location
              </Label>
              <Input 
                id="location" 
                value={restaurantInfo.location}
                onChange={(e) => setRestaurantInfo(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone
                </Label>
                <Input 
                  id="phone" 
                  value={restaurantInfo.phone}
                  onChange={(e) => setRestaurantInfo(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </Label>
                <Input 
                  id="email" 
                  value={restaurantInfo.email}
                  onChange={(e) => setRestaurantInfo(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
            <Button 
              variant="gradient" 
              className="w-full"
              onClick={handleSaveRestaurantInfo}
              disabled={updateSettings.isPending}
            >
              {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
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
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="font-medium">Monday - Friday</span>
                <div className="flex items-center gap-2">
                  <Input 
                    className="w-24 text-center" 
                    value={operatingHours.hours_weekday_open}
                    onChange={(e) => setOperatingHours(prev => ({ ...prev, hours_weekday_open: e.target.value }))}
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input 
                    className="w-24 text-center" 
                    value={operatingHours.hours_weekday_close}
                    onChange={(e) => setOperatingHours(prev => ({ ...prev, hours_weekday_close: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="font-medium">Saturday</span>
                <div className="flex items-center gap-2">
                  <Input 
                    className="w-24 text-center" 
                    value={operatingHours.hours_saturday_open}
                    onChange={(e) => setOperatingHours(prev => ({ ...prev, hours_saturday_open: e.target.value }))}
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input 
                    className="w-24 text-center" 
                    value={operatingHours.hours_saturday_close}
                    onChange={(e) => setOperatingHours(prev => ({ ...prev, hours_saturday_close: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="font-medium">Sunday</span>
                <div className="flex items-center gap-2">
                  <Input 
                    className="w-24 text-center" 
                    value={operatingHours.hours_sunday_open}
                    onChange={(e) => setOperatingHours(prev => ({ ...prev, hours_sunday_open: e.target.value }))}
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input 
                    className="w-24 text-center" 
                    value={operatingHours.hours_sunday_close}
                    onChange={(e) => setOperatingHours(prev => ({ ...prev, hours_sunday_close: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <Button 
              variant="gradient" 
              className="w-full"
              onClick={handleSaveHours}
              disabled={updateSettings.isPending}
            >
              {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Hours
            </Button>
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
                <p className="text-3xl font-bold">{totalTables}</p>
                <p className="text-sm text-muted-foreground">Total Tables</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-3xl font-bold">{totalSeats}</p>
                <p className="text-sm text-muted-foreground">Total Seats</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => toast.info('Navigate to Tables module to manage tables')}>
              Manage Tables
            </Button>
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
              <Switch 
                checked={toggleSettings.auto_print_receipts}
                onCheckedChange={(checked) => handleToggleChange('auto_print_receipts', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Include tax breakdown</p>
                <p className="text-sm text-muted-foreground">Show itemized taxes</p>
              </div>
              <Switch 
                checked={toggleSettings.include_tax_breakdown}
                onCheckedChange={(checked) => handleToggleChange('include_tax_breakdown', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">QR code on receipt</p>
                <p className="text-sm text-muted-foreground">For feedback collection</p>
              </div>
              <Switch 
                checked={toggleSettings.qr_code_on_receipt}
                onCheckedChange={(checked) => handleToggleChange('qr_code_on_receipt', checked)}
              />
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
              <Switch 
                checked={toggleSettings.new_order_alerts}
                onCheckedChange={(checked) => handleToggleChange('new_order_alerts', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Low stock warnings</p>
                <p className="text-sm text-muted-foreground">When items run low</p>
              </div>
              <Switch 
                checked={toggleSettings.low_stock_warnings}
                onCheckedChange={(checked) => handleToggleChange('low_stock_warnings', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Daily summary email</p>
                <p className="text-sm text-muted-foreground">End of day report</p>
              </div>
              <Switch 
                checked={toggleSettings.daily_summary_email}
                onCheckedChange={(checked) => handleToggleChange('daily_summary_email', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* QR Code for Customer Orders */}
        <OrderQRCode />

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
                { name: 'Admin User', role: 'Admin', active: true },
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
            <Button variant="outline" className="w-full" onClick={() => toast.info('Staff management coming soon!')}>
              Add Staff Member
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
