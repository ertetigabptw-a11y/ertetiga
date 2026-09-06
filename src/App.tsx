import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './components/LoginPage';
import { MobileFrame } from './components/MobileFrame';
import { SuperAdminModule } from './modules/SuperAdminModule';
import { KetuaRTModule } from './modules/KetuaRTModule';
import { KeamananModule } from './modules/KeamananModule';
import { BendaharaModule } from './modules/BendaharaModule';
import { WargaModule } from './modules/WargaModule';

const MainAppContent: React.FC = () => {
  const { currentUser, currentRole } = useApp();

  // Get default tab for a role
  const getDefaultTabForRole = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'settings';
      case 'ketua_rt':
        return 'warga';
      case 'keamanan':
        return 'presensi';
      case 'bendahara':
        return 'tagihan';
      case 'warga':
        return 'home';
      default:
        return 'home';
    }
  };

  const [activeTab, setActiveTab] = useState<string>(() => getDefaultTabForRole(currentRole));

  // Reset tab whenever currentRole changes
  useEffect(() => {
    setActiveTab(getDefaultTabForRole(currentRole));
  }, [currentRole]);

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <MobileFrame activeTab={activeTab} onTabChange={setActiveTab}>
      {currentRole === 'superadmin' && <SuperAdminModule activeTab={activeTab} />}
      {currentRole === 'ketua_rt' && <KetuaRTModule activeTab={activeTab} />}
      {currentRole === 'keamanan' && <KeamananModule activeTab={activeTab} />}
      {currentRole === 'bendahara' && <BendaharaModule activeTab={activeTab} />}
      {currentRole === 'warga' && <WargaModule activeTab={activeTab} />}
    </MobileFrame>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
