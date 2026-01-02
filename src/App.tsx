import React, { useState, createContext  } from 'react';
import LoginScreen from './renderer/components/LoginScreen';
import Dashboard from './renderer/components/Dashboard';
import Inventory from './renderer/components/Inventory';
import SideBar from './renderer/components/SideBar';
// import Sales from './renderer/components/Sales';
import Expenses from './renderer/components/Expenses';
import Settings from './renderer/components/Settings';
import Employees from "./renderer/components/Employees"
import Customers from "./renderer/components/Customers"
import axios, { type AxiosInstance } from 'axios';

type Page = 'Authorize' | 'Login' | 'Dashboard' | 'Inventory' | 'Sales' | 'Settings' | 'Employees' | 'Expenses' | 'Customers';

interface NonSensitiveUserData {
  id: number;
  username: string;
  email: string;
  role:  "ADMIN" | "CASHIER" | "MANAGER" | "OTHER" | ""
}

const API_BASE_URL = "http://localhost:3000";
export const AxiosHttpRequest = createContext<AxiosInstance | null>(null)


const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('Login');
  const [user, setUser] = useState<NonSensitiveUserData | null>(null);
  const [accessToken, setAccessToken] = useState("")

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  function handleAuthCompletion(accessToken: string) {
    setAccessToken(accessToken)
    const userData = JSON.parse(atob(accessToken.split('.')[1]))

    setUser(userData);
    
    if (userData.role === 'ADMIN') {
      navigateTo('Dashboard');
    } else if (userData.role === 'CASHIER') {
      navigateTo('Sales');
    } else {
      navigateTo('Inventory');
    }
  };

  const api = axios.create({ baseURL: API_BASE_URL, headers: {'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json'} });

  api.interceptors.response.use((response) => {
    const newToken = response.headers['x-new-access-token'];
    if (newToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    }
    return response;
  }, (error) => {
    if (error.response?.status === 401) {
    }
    return Promise.reject(error);
  });


  const showSidebar = !['Login'].includes(currentPage);

  return (
    <main className="flex h-screen overflow-hidden bg-slate-50 w-screen">
        {showSidebar && (
          <SideBar 
            activePage={currentPage} 
            onNavigate={setCurrentPage} 
            user={user} 
          />
        )}
      <AxiosHttpRequest.Provider value={api}>
        <div className="flex-1 overflow-y-auto">
          {currentPage === 'Login' && (
            <LoginScreen onLoginSuccess={handleAuthCompletion} />
          )}
          {currentPage === 'Dashboard' && <Dashboard />}
          {currentPage === 'Inventory' && <Inventory />}
          {/* {currentPage === 'Sales' && <Sales/>} */}
          {currentPage === 'Employees' && <Employees/>}
          {currentPage === 'Settings' && <Settings/>}
          {currentPage === 'Expenses' && <Expenses/>}
          {currentPage === 'Customers' && <Customers/>}
        </div>
      </AxiosHttpRequest.Provider>
    </main>
  );
};

export default App;

