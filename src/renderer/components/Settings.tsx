import { useState, useEffect } from 'react';
import { Box, Zap, CheckCircle2, XCircle, Store, Printer, CreditCard, Monitor, Save } from 'lucide-react';
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
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
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
          {activeTab === 'payments' && <PaymentSettings />}
          {activeTab === 'system' && <SystemSettings />}
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
        <input className="w-full p-2 border rounded-lg mt-1" defaultValue="Gemini Retail Hub" />
      </div>
      <div>
        <label className="text-sm font-semibold">Tax Rate (%)</label>
        <input type="number" className="w-full p-2 border rounded-lg mt-1" defaultValue="7.5" />
      </div>
    </div>
    <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">
      <Save size={18}/> Save Changes
    </button>
  </div>
);


const HardwareSettings = () => {
  const [printers, setPrinters] = useState<any[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [testStatus, setTestStatus] = useState({ type: '', success: false, msg: '' });

  // Get list of printers installed on the Windows/Mac OS
  useEffect(() => {
    if (window.ipcRenderer) {
      window.ipcRenderer.invoke('get-printers').then(setPrinters);
    }
  }, []);

  const runTest = async (action: 'print' | 'drawer') => {
    setTestStatus({ type: action, success: false, msg: 'Testing...' });
    const result = await window.ipcRenderer.invoke('test-hardware', { action, printerName: selectedPrinter });
    setTestStatus({ 
      type: action, 
      success: result.success, 
      msg: result.success ? 'Success!' : 'Failed: ' + result.error 
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Hardware Interface</h2>
        <p className="text-slate-500 text-sm">Configure physical peripherals and drivers.</p>
      </div>

      {/* Printer Selection */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <label className="flex items-center gap-2 font-semibold text-slate-700 mb-3">
          <Printer size={18}/> Receipt Printer (mc-Print3)
        </label>
        <div className="flex gap-4">
          <select 
            className="flex-1 p-2.5 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedPrinter}
            onChange={(e) => setSelectedPrinter(e.target.value)}
          >
            <option value="">Select installed driver...</option>
            {printers.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
          <button 
            onClick={() => runTest('print')}
            className="bg-white border border-slate-300 px-4 py-2 rounded-xl hover:bg-slate-100 font-medium"
          >
            Test Print
          </button>
        </div>
      </div>

      {/* Cash Drawer Section */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <label className="flex items-center gap-2 font-semibold text-slate-700 mb-3">
          <Box size={18}/> Cash Drawer (Star CD3)
        </label>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Connected via RJ11 to the mc-Print3 printer.</p>
          <button 
            onClick={() => runTest('drawer')}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Zap size={18}/> Kick Drawer
          </button>
        </div>
      </div>

      {/* Test Feedback Overlay */}
      {testStatus.msg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${testStatus.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {testStatus.success ? <CheckCircle2 size={20}/> : <XCircle size={20}/>}
          <span className="font-medium">{testStatus.msg}</span>
        </div>
      )}
    </div>
  );
};

