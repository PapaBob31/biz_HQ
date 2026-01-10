import { useState, useEffect, useContext } from 'react';
import { Store, Printer, CreditCard, Monitor, Save, ScanBarcode, LockOpen, 
  ReceiptText, ShieldCheck, ShieldAlert, ExternalLink, Building2, Smartphone } from 'lucide-react';
import { useBarcodeScanner } from './hooks';
import { checkPrinterStatus, kickCashDrawer, printReceipt } from './utils/printer';
import { AxiosHttpRequest } from "../../App"

// 1PYMZ31N53XR1

const CloverAuthScreen = () => {
  const [merchantId, setMerchantId] = useState('');
  const [appId] = useState('ABC-123-XYZ'); // Non-editable App ID
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const api = useContext(AxiosHttpRequest)!
  
  // Poll the local bridge server to see if the user finished auth in the browser
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPolling) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('http://localhost:4999/status');
          const data = await res.json();
          if (data.authorized) {
            setIsAuthorized(true);
            setIsPolling(false);
            // Save token to your main backend via your Axios client
            // await api.post('/settings/clover-token', { token: data.token, merchantId: data.merchantId });
          }
        } catch (e) {
          console.error("Bridge server unreachable");
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPolling]);

  const handleAuthorize = () => {
    if (!merchantId) return alert("Please enter a Merchant ID");
    
    // Open the auth server start endpoint in the default browser
    window.open(`http://localhost:4999/auth-start?merchantId=${merchantId}`, '_blank');
    setIsPolling(true);
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-indigo-600 p-8 text-white flex flex-col items-center">
          <Smartphone size={48} className="mb-4" />
          <h1 className="text-2xl font-bold">Clover Integration</h1>
          <p className="text-indigo-100 text-sm">Connect your Flex device</p>
        </div>

        <div className="p-8 space-y-6">
          {/* APP ID SECTION */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-1">Application ID</label>
            <div className="flex items-center bg-slate-100 p-3 rounded-xl border border-slate-200">
              <ShieldCheck size={18} className="text-slate-400 mr-2" />
              <span className="text-slate-500 font-mono text-sm">{appId}</span>
            </div>
          </div>

          {/* MERCHANT ID SECTION */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-1">Merchant ID</label>
            <div className="flex items-center bg-white p-3 rounded-xl border-2 border-slate-200 focus-within:border-indigo-500 transition-colors">
              <Building2 size={18} className="text-slate-400 mr-2" />
              <input 
                type="text" 
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                className="flex-1 outline-none text-slate-700 font-medium"
                placeholder="Enter Clover Merchant ID"
              />
            </div>
          </div>

          {/* STATUS INDICATOR */}
          <div className={`flex items-center justify-center p-4 rounded-2xl border-2 ${isAuthorized ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            {isAuthorized ? (
              <div className="flex items-center text-green-700 font-bold">
                <ShieldCheck size={20} className="mr-2" /> Authorized & Linked
              </div>
            ) : (
              <div className="flex items-center text-amber-700 font-bold text-sm">
                <ShieldAlert size={20} className="mr-2" /> {isPolling ? 'Waiting for Clover...' : 'Action Required: Not Authorized'}
              </div>
            )}
          </div>

          {/* AUTH BUTTON */}
          <button 
            onClick={handleAuthorize}
            disabled={isAuthorized || isPolling}
            className={`w-full py-4 rounded-2xl font-black flex items-center justify-center transition-all shadow-lg
              ${isAuthorized ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'}`}
          >
            {isPolling ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                AUTHORIZE SOFTWARE <ExternalLink size={18} className="ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


// set low stock here too
export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState('business');

  const tabs = [
    { id: 'business', label: 'Business Details', icon: <Store size={18} /> },
    { id: 'hardware', label: 'Hardware & Print', icon: <Printer size={18} /> },
    { id: 'payments', label: 'Clover Integration', icon: <CreditCard size={18} /> },
    { id: 'system', label: 'System Options', icon: <Monitor size={18} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-white shadow-sm border border-slate-200 overflow-hidden">
      {/* Top Horizontal Tab Navigation */}
      <div className="flex items-center px-6 bg-slate-50 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${
              activeTab === tab.id 
                ? 'text-blue-600' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
            {/* Active Underline Indicator */}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-10 overflow-y-auto bg-white">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'business' && <BusinessSettings />}
          {activeTab === 'hardware' && <HardwareSettings />}
          {activeTab === 'payments' && <CloverAuthScreen />}
        </div>
      </div>
    </div>
  );
};

// Sub-component for Business Settings
const BusinessSettings = () => (
  <div className="max-w-2xl space-y-6 animate-in fade-in duration-300">
    <div>
      <h2 className="text-xl font-bold text-slate-800">Store Profile</h2>
      <p className="text-slate-500 text-sm">This information appears on customer receipts.</p>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="text-sm font-semibold">Store Name</label>
        <input className="w-full p-2 border rounded-lg mt-1" defaultValue="X men Retail Hub" />
      </div>
      <div className="col-span-2">
        <label className="text-sm font-semibold">Tax Rate (%)</label>
        <input type="number" className="w-full p-2 border rounded-lg mt-1" defaultValue="13" />
      </div>
      <h2 className="text-xl font-bold text-slate-800">Other Settings</h2>
      <div className="col-span-2">
        <label className="text-sm font-semibold">Low Stock Value</label>
        <input type="number" className="w-full p-2 border rounded-lg mt-1" defaultValue="10" />
      </div>
    </div>
    <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">
      <Save size={18}/> Save Changes
    </button>
  </div>
);


function HardwareSettings() {
  const [printerIp, setPrinterIp] = useState(localStorage.getItem('printer_ip') || '');
  const [printerStatus, setPrinterStatus] = useState({ online: false, message: 'Not Checked' });
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  
  // Accordion State
  const [openSection, setOpenSection] = useState<'printer' | 'barcode' | null>('printer');

  // Scanner Hook
  useBarcodeScanner((code) => {
    setLastScannedCode(code);
    // If a scan happens, we might want to automatically show the barcode section
    setOpenSection('barcode');
  });

  const handleRefreshPrinter = async () => {
    const res = await checkPrinterStatus(printerIp);
    setPrinterStatus(res);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <h1 className="text-3xl font-black mb-8 text-gray-800">System Hardware</h1>

      <div className="max-w-3xl space-y-4">
        
        {/* --- PRINTER & CASH DRAWER SECTION --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <button 
            onClick={() => setOpenSection(openSection === 'printer' ? null : 'printer')}
            className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
          >
            <div className="flex items-center space-x-4">
              <Printer size={20} />
              <div className="text-left">
                <h2 className="text-xl font-bold text-gray-800">Receipt Printer & Drawer</h2>
                <p className="text-sm text-gray-500">Star Micronics WebPRNT</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${printerStatus.online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {printerStatus.online ? 'ONLINE' : 'OFFLINE'}
              </span>
              <span className="text-gray-400">{openSection === 'printer' ? '▲' : '▼'}</span>
            </div>
          </button>

          {openSection === 'printer' && (
            <div className="p-6 border-t border-gray-100 bg-white space-y-6 animate-fadeIn">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-xs font-black text-gray-400 uppercase mb-1">Network IP</label>
                  <input 
                    type="text" 
                    value={printerIp}
                    onChange={(e) => {
                        setPrinterIp(e.target.value);
                        localStorage.setItem('printer_ip', e.target.value);
                    }}
                    placeholder="192.168.1.XX"
                    className="w-full p-3 bg-gray-100 rounded-lg border-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button 
                  onClick={handleRefreshPrinter}
                  className="self-end bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700"
                >
                  Verify
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => kickCashDrawer(printerIp)}
                  className="flex flex-col items-center justify-center p-4 border-2 border-gray-100 rounded-xl hover:border-blue-500 transition"
                >
                  <LockOpen size={20}/>
                  <span className="text-sm font-bold">Open Drawer</span>
                </button>
                <button 
                  onClick={() => printReceipt(printerIp, { id: 'TEST', items: [], total: 0, tax: 0, totalAfterTax: 0 })}
                  className="flex flex-col items-center justify-center p-4 border-2 border-gray-100 rounded-xl hover:border-blue-500 transition"
                >
                  <ReceiptText size={20}/>
                  <span className="text-sm font-bold">Test Receipt</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* --- BARCODE SCANNER SECTION --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <button 
            onClick={() => setOpenSection(openSection === 'barcode' ? null : 'barcode')}
            className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
          >
            <div className="flex items-center space-x-4">
              <ScanBarcode size={20}/>
              <div className="text-left">
                <h2 className="text-xl font-bold text-gray-800">Barcode Scanner</h2>
                <p className="text-sm text-gray-500">Universal HID / Keyboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${lastScannedCode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                {lastScannedCode ? 'READY' : 'WAITING'}
              </span>
              <span className="text-gray-400">{openSection === 'barcode' ? '▲' : '▼'}</span>
            </div>
          </button>

          {openSection === 'barcode' && (
            <div className="p-6 border-t border-gray-100 bg-white animate-fadeIn">
              <div className="bg-gray-50 rounded-2xl p-8 flex flex-col items-center border-2 border-dashed border-gray-200">
                {lastScannedCode ? (
                  <div className="text-center">
                    <p className="text-xs font-black text-blue-500 uppercase mb-2">Last Scan Detected</p>
                    <p className="text-4xl font-black text-gray-800 tracking-tighter">{lastScannedCode}</p>
                    <button 
                      onClick={() => setLastScannedCode(null)}
                      className="mt-4 text-xs font-bold text-gray-400 hover:text-gray-600 underline"
                    >
                      Clear Test
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <span className="text-xl">⚡</span>
                    </div>
                    <p className="text-gray-500 font-medium">Please scan a physical barcode...</p>
                  </div>
                )}
              </div>
              <p className="mt-4 text-xs text-gray-400 italic">Note: Scanner must be in HID mode with "Enter" suffix enabled.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};


/* 
FLEX AUTH
button to authorize on the frontend
  - First let's spin up a webserver on port 4999
  - opens this link: `https://apisandbox.dev.clover.com/oauth/v2/authorize?client_id={APP_ID}&redirect_uri={CLIENT_REDIRECT_URL}` in the
  user's broswer -> which should probably take the client to a login screen
  - Successful logins redirects to our web server with the auth code as a query parameter (&code='secret')
  - This auth code is then used to get the tokens through the '/oauth/v2/token' endpoint. Include `client_id, client_secret, and code` query params
  - Save it and then notify the client through IPC that the token is available
*/