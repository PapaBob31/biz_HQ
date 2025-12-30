import React, { useState } from 'react';
// import AuthorizeDevice from './renderer/components/AuthorizeDevice';
import LoginScreen from './renderer/components/LoginScreen';
import Dashboard from './renderer/components/Dashboard';
import Inventory from './renderer/components/Inventory';
import SideBar from './renderer/components/SideBar';
// import Sales from './renderer/components/Sales';
import Expenses from './renderer/components/Expenses';
import Settings from './renderer/components/Settings';
import Employees from "./renderer/components/Employees"

import type { User, AuthResponse } from './types';

// Define the possible screens in your app
type Page = 'Authorize' | 'Login' | 'Dashboard' | 'Inventory' | 'Sales' | 'Settings' | 'Employees' | 'Expenses';


const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('Login');
  const [user, setUser] = useState<User | null>(null);

  // This replaces the "navigateTo" placeholder
  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  // Logic for the Authorization Screen
  const handleAuthCompletion = (data: AuthResponse) => {
    
    setUser({ username: data.username, role: data.user.role});
    
    if (data.user.role === 'Admin') {
      navigateTo('Dashboard');
    } else if (data.user.role === 'Cashier') {
      navigateTo('Sales');
    } else {
      navigateTo('Inventory');
    }

  };

  const showSidebar = !['Login'].includes(currentPage);

  // The "Router" - decides which component to show
  return (
    <main className="flex h-screen overflow-hidden bg-slate-50 w-screen">
        {showSidebar && (
          <SideBar 
            activePage={currentPage} 
            onNavigate={setCurrentPage} 
            user={user} 
          />
        )}
      <div className="flex-1 overflow-y-auto">
        {/* {currentPage === 'Authorize' && (
          <AuthorizeDevice onAuthSuccess={handleAuthCompletion} />
        )} */}

        {currentPage === 'Login' && (
          <LoginScreen onLoginSuccess={handleAuthCompletion} />
        )}

        {currentPage === 'Dashboard' && <Dashboard />}
        {currentPage === 'Inventory' && <Inventory />}
        {/* {currentPage === 'Sales' && <Sales/>} */}
        {currentPage === 'Employees' && <Employees/>}
        {currentPage === 'Settings' && <Settings/>}
        {currentPage === 'Expenses' && <Expenses/>}
      </div>
    </main>
  );
};

export default App;

