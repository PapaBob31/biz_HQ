import React, { useState } from 'react';
import AuthorizeDevice from './renderer/components/AuthorizeDevice';
import LoginScreen from './renderer/components/LoginScreen';
import type { UserRole, CloverAuthResponse, UserSession } from './types';

// Define the possible screens in your app
type Page = 'Authorize' | 'Login' | 'Dashboard' | 'Inventory' | 'Sales' | 'Settings';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('Authorize');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [user, setUser] = useState<UserSession | null>(null);

  // This replaces the "navigateTo" placeholder
  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  // Logic for the Authorization Screen
  const handleAuthCompletion = (data: CloverAuthResponse) => {
    setIsAuthorized(true);
    
    if (data.role === 'Admin') {
      setUser({ username: data.username, role: 'Admin', isAuthenticated: true });
      navigateTo('Dashboard');
    } else {
      navigateTo('Login');
    }
  };

  // Logic for the Staff Login Screen
  const handleLoginCompletion = (userData: UserSession) => {
    setUser(userData);
    
    // Role-based landing pages as per your requirements
    if (userData.role === 'Manager') {
      navigateTo('Inventory');
    } else if (userData.role === 'Cashier') {
      navigateTo('Sales');
    } else {
      navigateTo('Inventory');
    }
  };

  // The "Router" - decides which component to show
  return (
    <main className="app-container">
      {currentPage === 'Authorize' && (
        <AuthorizeDevice onAuthSuccess={handleAuthCompletion} />
      )}

      {currentPage === 'Login' && (
        <LoginScreen onLoginSuccess={handleLoginCompletion} />
      )}

      {/* Placeholders for the screens we haven't built yet */}
      {currentPage === 'Dashboard' && (
        <div className="p-10">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p>Welcome, {user?.username}. Success! You bypassed the login.</p>
          <button onClick={() => navigateTo('Authorize')} className="text-blue-500 underline">Logout</button>
        </div>
      )}

      {currentPage === 'Inventory' && (
        <div className="p-10">
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p>Role: {user?.role}</p>
        </div>
      )}

      {currentPage === 'Sales' && (
        <div className="p-10">
          <h1 className="text-3xl font-bold">Sales Terminal</h1>
          <p>Ready to scan with Socket Mobile...</p>
        </div>
      )}
    </main>
  );
};

export default App;