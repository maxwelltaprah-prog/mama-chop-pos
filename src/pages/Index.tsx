import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
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
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default Index;
