import { useState, useContext } from 'react';
import { Store, Printer, CreditCard, Save, ScanBarcode, LockOpen, ReceiptText,  Settings,  AlertCircle } from 'lucide-react';
import { useBarcodeScanner } from './hooks';
import { checkPrinterStatus, kickCashDrawer, printReceipt } from './utils/printer';
import { GeneralProgramSettings, AxiosHttpRequest } from "../../App"
import CloverAuthScreen from "./CloverAuth";


function ProcessingOverlay(){
  return (
    <div className="absolute inset-0 bg-white/70 flex justify-center items-center">
      <div className="w-10 h-10 animate-spin rounded-full border-2 border-b-transparent"/>
    </div>
  )
}

// set low stock here too
export default function SettingsScreen({ refreshSettings } : {refreshSettings: ()=>void}) {
  const [activeTab, setActiveTab] = useState('business');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("")
  const softwareConfig = useContext(GeneralProgramSettings)!

  const tabs = [
    { id: 'business', label: 'Business Details', icon: <Store size={18} /> },
    { id: 'hardware', label: 'Hardware & Print', icon: <Printer size={18} /> },
    { id: 'payments', label: 'Clover Integration', icon: <CreditCard size={18} /> },
  ];

  if (loading) {
    return (
      <section className="flex min-h-screen flex flex-col justify-center w-full items-center">
        <Settings size={100} className="text-gray-500 animate-spin"/>
        <p className="text-lg text-gray-500 mt-2">Loading..</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="flex min-h-screen flex flex-col justify-center w-full items-center">
        <AlertCircle size={100} className="text-red-500"/>
        <p className="text-lg text-red-500 mt-2">{error}</p>
        <button className="py-2 rounded-md bg-blue-600 mt-4 px-4 text-white cursor-pointer" onClick={()=>{setLoading(true); setError("")}}>Retry</button>
      </section>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white shadow-sm border border-slate-200 overflow-hidden">
      {/* Top Horizontal Tab Navigation */}
      <div className="flex items-center px-6 bg-slate-50 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`cursor-pointer flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${
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
          {activeTab === 'business' && 
            <BusinessSettings storeName={softwareConfig!.storeName} lowStockVal={softwareConfig!.lowStockValue} taxRate={softwareConfig!.taxRate} refreshSettings={refreshSettings}/>
          }
          {activeTab === 'hardware' && <HardwareSettings refreshSettings={refreshSettings} printerIp={softwareConfig.starPrinterIP} businessName={softwareConfig!.storeName} />}
          {activeTab === 'payments' && <CloverAuthScreen refreshSettings={refreshSettings}/>}
        </div>
      </div>
    </div>
  );
};

interface BusinessConfig {
  storeName: string;
  taxRate: number;
  lowStockValue: number;
}


// Sub-component for Business Settings
function BusinessSettings({storeName, lowStockVal, taxRate, refreshSettings} : {storeName: string, lowStockVal: number, taxRate: number, refreshSettings: ()=>void}) {
  const [config, setConfig] = useState<BusinessConfig>({storeName, taxRate, lowStockValue: lowStockVal})
  const [configEdited, setConfigEdited] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('')

  const api = useContext(AxiosHttpRequest)!

  function updateConfig() {
    setUpdating(true)
    api.put('/api/business-details', config)
    .then(() => {
      refreshSettings();
    })
    .catch(error => {
      setError("Unexpected Error! Please check your internet connection and try again")
      console.log(error)
    })
    .finally(() => {
      setConfigEdited(false)
      setUpdating(false)
    })
  }

  return (
    <div className="relative max-w-2xl animate-in fade-in duration-300 overflow-y-hidden">
      {updating && <ProcessingOverlay/>}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800">Business Profile</h2>
        <p className="text-slate-500 text-sm">General information about your Business. Some of this information appears on customer receipts.</p>
        {error && <p className="text-red-500 text-center p-2 rounded-lg bg-red-200 mt-2">{error}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="col-span-2">
          <label className="text-sm font-semibold">Store Name</label>
          <input className="w-full p-2 border rounded-lg mt-1" 
            defaultValue={storeName}
            onChange={(e)=>{setConfig({...config, storeName: e.target.value}); setConfigEdited(true)}} />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-semibold">Tax Rate (%)</label>
          <input type="number" className="w-full p-2 border rounded-lg mt-1"
           defaultValue={taxRate} 
           onChange={(e)=>{setConfig({...config, taxRate: e.target.value ? parseInt(e.target.value) : config.taxRate}); setConfigEdited(true)} }
          />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Other Settings</h2>
        <div className="col-span-2">
          <label className="text-sm font-semibold">Low Stock Value</label>
          <input type="number" className="w-full p-2 border rounded-lg mt-1"
           defaultValue={lowStockVal}
           onChange={(e)=>{setConfig({...config, lowStockValue: e.target.value ? parseInt(e.target.value) : config.lowStockValue}); setConfigEdited(true)}} />
        </div>
      </div>
      <button disabled={!configEdited}
        className="cursor-pointer disabled:bg-blue-300 flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold"
        onClick={updateConfig}
      >
        <Save size={18}/> Save Changes
      </button>
    </div>
  )
};


function HardwareSettings({printerIp, refreshSettings, businessName} : {printerIp: string, refreshSettings: ()=>void, businessName: string}) {
  const [starPrinterIp, setStarPrinterIp] = useState(printerIp);
  const [printerStatus, setPrinterStatus] = useState({ online: false, message: '' });
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [ipEdited, setIpEdited] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('')
  const api = useContext(AxiosHttpRequest)!
  // Accordion State
  const [openSection, setOpenSection] = useState<'printer' | 'barcode' | null>('printer');

  function updateConfig() {
    setUpdating(true)
    api.put('/api/business-details', {starPrinterIP: starPrinterIp })
    .then(() => {
      refreshSettings();
    })
    .catch(error => {
      setError("Unexpected Error! Please check your internet connection and try again")
      console.log(error)
    })
    .finally(() => {
      setIpEdited(false)
      setUpdating(false)
    })
  }

  // Scanner Hook
  useBarcodeScanner((code) => {
    setLastScannedCode(code);
    // If a scan happens, we might want to automatically show the barcode section
    setOpenSection('barcode');
  });

  const handleRefreshPrinter = async () => {
    setPrinterStatus({online: false, message: 'Loading'})
    const res = await checkPrinterStatus(starPrinterIp);
    setPrinterStatus(res);
  };

  return (
    <div className="relative min-h-screen font-sans">
      {updating && <ProcessingOverlay/>}
      <h1 className="text-xl font-bold text-slate-800">Supported Hardware</h1>
      <p className="text-slate-500 text-sm mb-6">View Supported Hardware Status. Manage connected hardware. Printer, Cashdrawer and Barcode Scanner</p>
      {error && <p className="text-red-500 text-center p-2 rounded-lg bg-red-200 mt-2">{error}</p>}
      <div className="max-w-3xl space-y-4">
        
        {/* --- PRINTER & CASH DRAWER SECTION --- */}
        <div className="bg-white rounded-2xl border-1 border-gray-400 overflow-hidden">
          <button 
            onClick={() => setOpenSection(openSection === 'printer' ? null : 'printer')}
            className="block cursor-pointer w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
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
                  {!printerStatus.online && printerStatus.message !== 'Loading' && <p className="text-red-400">{printerStatus.message}</p>}
                  <input 
                    type="text" 
                    value={starPrinterIp}
                    disabled={updating}
                    onChange={(e) => {
                      setStarPrinterIp(e.target.value);
                      setPrinterStatus({ online: false, message: '' })
                      setIpEdited(true);
                    }}
                    placeholder="192.168.1.XX"
                    className="w-full p-3 bg-gray-100 rounded-lg border-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button 
                  onClick={handleRefreshPrinter}
                  className="flex justify-center gap-2 self-end bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 cursor-pointer"
                >
                  {printerStatus.message === 'Loading' && <div className="w-6 h-6 animate-spin rounded-full border-4 border-b-transparent"/>}
                  Verify
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => kickCashDrawer(starPrinterIp)}
                  className="cursor-pointer flex flex-col items-center justify-center p-4 border-2 border-gray-100 rounded-xl hover:border-blue-500 transition"
                >
                  <LockOpen size={20}/>
                  <span className="text-sm font-bold">Open Drawer</span>
                </button>
                <button 
                  onClick={() => printReceipt(starPrinterIp, { id: 'TEST', items: [], total: 0, tax: 0, subTotal: 0 }, businessName )}
                  className="cursor-pointer flex flex-col items-center justify-center p-4 border-2 border-gray-100 rounded-xl hover:border-blue-500 transition"
                >
                  <ReceiptText size={20}/>
                  <span className="text-sm font-bold">Test Receipt</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* --- BARCODE SCANNER SECTION --- */}
        <div className="bg-white rounded-2xl border-1 border-gray-400 overflow-hidden">
          <button 
            onClick={() => setOpenSection(openSection === 'barcode' ? null : 'barcode')}
            className="block cursor-pointer w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
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
        <button disabled={!ipEdited}
          className="cursor-pointer flex disabled:bg-blue-300 items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold" 
          onClick={()=>updateConfig()}>
          <Save size={18}/> Save Changes
        </button>
      </div>
    </div>
  );
};