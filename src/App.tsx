import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { LoginPage } from './components/auth/LoginPage';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { IncomingView } from './components/inventory/IncomingView';
import { OutgoingView } from './components/inventory/OutgoingView';
import { ReturnsView } from './components/inventory/ReturnsView';
import { StockView } from './components/inventory/StockView';
import { BookkeepingView } from './components/reports/BookkeepingView';
import { UsersView } from './components/users/UsersView';

const MainLayout: React.FC = () => {
  const { currentUser, activeMenu } = useInventory();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!currentUser) {
    return <LoginPage />;
  }

  const renderActiveView = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <DashboardView />;
      case 'masuk':
        return <IncomingView />;
      case 'keluar':
        return <OutgoingView />;
      case 'retur':
        return <ReturnsView />;
      case 'stok':
        return <StockView />;
      case 'pembukuan':
        return <BookkeepingView />;
      case 'pengguna':
        return <UsersView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E9] text-[#302923] flex font-sans">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-72 min-w-0">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {renderActiveView()}
        </main>

        {/* System Footer */}
        <footer className="px-6 py-4 text-center text-xs text-[#8A796D] border-t border-[#D8C7B3]/40 bg-white/50 no-print">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>
              <strong>KOPI MBEKAYU</strong> &bull; Sistem Monitoring Stok Produksi Kopi
            </span>
            <span className="text-[11px]">
              Otorisasi Aktif: <strong>{currentUser.role}</strong> ({currentUser.name})
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <MainLayout />
    </InventoryProvider>
  );
}
