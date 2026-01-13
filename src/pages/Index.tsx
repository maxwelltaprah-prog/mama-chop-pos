import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/components/Dashboard';
import { POSView } from '@/components/POSView';
import { OrdersView } from '@/components/OrdersView';
import { TablesView } from '@/components/TablesView';
import { MenuManagement } from '@/components/MenuManagement';
import { ReportsView } from '@/components/ReportsView';
import { SettingsView } from '@/components/SettingsView';

const Index = () => {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <POSView />;
      case 'orders':
        return <OrdersView />;
      case 'tables':
        return <TablesView />;
      case 'menu':
        return <MenuManagement />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppLayout activeView={activeView} onViewChange={setActiveView}>
      {renderView()}
    </AppLayout>
  );
};

export default Index;
