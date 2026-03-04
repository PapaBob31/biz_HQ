import React, { useState, createContext, useEffect  } from 'react';
import AuthScreeen from './renderer/components/LoginScreen';
import Dashboard from './renderer/components/Dashboard';
import Inventory from './renderer/components/Inventory';
import SideBar from './renderer/components/SideBar';
import Sales from './renderer/components/Sales';
import Expenses from './renderer/components/Expenses';
import Settings from './renderer/components/Settings';
import Employees from "./renderer/components/Employees"
import Customers from "./renderer/components/Customers"
import AdminSignup from "./renderer/components/AdminSetup"
import LoadingScreen from "./renderer/components/Loader"
import LowStockScreen from "./renderer/components/LowStockAlert"
import NetworkErrorScreen from "./renderer/components/Error"
import OtpVerification from "./renderer/components/OTPVerification"
import CashIn from "./renderer/components/CashIn"
import CashOut from "./renderer/components/Cashout"
import SalesRecapScreen from "./renderer/components/SalesRecap"
import Audit from "./renderer/components/Audit"
import axios, { type AxiosInstance } from 'axios'
import ExpiredSessionInfo from './renderer/components/SessionExpired';

type Page = (
  'Admin setup' | 'Authorize' | 'Login' | 'Dashboard' | 'Inventory' | 'Sales' | 'OTP Verification' | 'Cash In' | 'Cash Out' | 
  'Settings' | 'Employees' | 'Expenses' | 'Customers'| 'Main loading' | 'Network Error' | 'Low Stock Alerts' | 'Audit' | 'Sales Recap'
)

export interface NonSensitiveUserData {
  id: number;
  username: string;
  email: string;
  role:  "ADMIN" | "CASHIER" | "MANAGER"
}


interface SoftwareConfig {
  storeName: string;
  taxRate: number;
  lowStockValue: number;
  cloverAppId: string;
  cloverMerchantId: string;
  starPrinterIP: string;
  cloverAccessToken: string;
  cloverRefreshToken: string;
}


export const AxiosHttpRequest = createContext<AxiosInstance | null>(null)
export const GeneralProgramSettings = createContext<SoftwareConfig | null>(null)

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('Main loading');
  const [user, setUser] = useState<NonSensitiveUserData | null>(null);
  const [accessToken, setAccessToken] = useState("")
  const [signupForm, setSignupForm] = useState<any>({username: "", email: "", password: "", confirmPassword: ""})
  const [softwareConfig, setSoftwareConfig] =  useState<SoftwareConfig | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  const api = axios.create(
    { baseURL: import.meta.env.VITE_BACKEND_API_BASE_URL, 
      headers: {'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json'} 
    }
  );


  api.interceptors.response.use((response) => {
    // Tokens have an auto-refresh feature. i.e. A new token will be sent if it remains an hour or less for the token used to authenticate the last request to expire.
    const newToken = response.headers['x-new-access-token']; 
    if (newToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    }
    return response;
  }, (error) => {
    if (error.response?.status === 401) {
      setSessionExpired(true);
    }
    return Promise.reject(error);
  });

  useEffect(() => {
    if (currentPage === 'Main loading') {
      setSessionExpired(false);
      api.get("/api/employees/confirm-admin-exist")
      .then(response => {
        if (response.data.message) { // boolean value
          setCurrentPage('Login')
        }else {
          setCurrentPage('Admin setup')
        }
      })
      .catch((error)=> {
        console.log(error)
        setCurrentPage('Network Error')
      })
    }
  }, [currentPage])

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  function refreshSoftwareConfig() {
    api.get("/api/business-details")
    .then(response => {
      setSoftwareConfig(response.data)
    })
  }

  function handleAuthCompletion(data: {token: string; businessDetails: any}) {
    setAccessToken(data.token)
    const userData = JSON.parse(atob(data.token.split('.')[1]))
    setUser(userData);
    setSoftwareConfig(data.businessDetails)
    
    if (userData.role === 'ADMIN') {
      navigateTo('Dashboard');
    } else if (userData.role === 'CASHIER') {
      navigateTo('Sales');
    } else {
      navigateTo('Inventory');
    }
  };

  const showSidebar = !['Login', 'Admin setup', 'Main loading', 'Network Error', 'OTP Verification'].includes(currentPage);

  return (

    <main className="flex h-screen overflow-hidden bg-slate-50 w-screen">
      {sessionExpired && <ExpiredSessionInfo goToLogin={()=>setCurrentPage('Main loading')}/>}
      <GeneralProgramSettings value={softwareConfig}>
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
              <AuthScreeen onAuthSuccess={handleAuthCompletion} />
            )}
            {currentPage === 'Main loading' && <LoadingScreen/>}
            {currentPage === 'Admin setup' && <AdminSignup navigateTo={setCurrentPage as any} storeSignupForm={setSignupForm}/>}
            {currentPage === 'Network Error' && <NetworkErrorScreen onRetry={()=>setCurrentPage('Main loading')}/>}
            {currentPage === 'Dashboard' && <Dashboard />}
            {currentPage === 'Inventory' && <Inventory />}
            {currentPage === 'Sales' && <Sales user={user!} goToSettings={()=>setCurrentPage('Settings')}/>}
            {currentPage === 'Employees' && <Employees/>}
            {currentPage === 'Settings' && <Settings refreshSettings={refreshSoftwareConfig}/>}
            {currentPage === 'Expenses' && <Expenses/>}
            {currentPage === 'Customers' && <Customers/>}
            {currentPage === 'Cash Out' && <CashOut/>}
            {currentPage === 'Cash In' && <CashIn employee={user!}/>}
            {currentPage === 'Low Stock Alerts' && <LowStockScreen/>}
            {currentPage === 'Sales Recap' && <SalesRecapScreen/>}
            {currentPage === 'Audit' && <Audit user={user!}/>}
            {currentPage === 'OTP Verification' && signupForm.email && <OtpVerification navigateTo={setCurrentPage as any} email={signupForm.email}/>}
          </div>
        </AxiosHttpRequest.Provider>
      </GeneralProgramSettings>
    </main>
  );
};

export default App;

