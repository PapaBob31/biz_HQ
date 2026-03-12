import { useState, useContext, useEffect } from 'react';
import { AlertTriangle, History, Save, Search, Ban, PackageOpen, X } from 'lucide-react';
import { AxiosHttpRequest, type NonSensitiveUserData } from '../../App';
import type { InventoryLog, Product } from '../../../prisma/generated/client';


function Items({ selectItem } : { selectItem: (item: Product) => void }) {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true);
  const [searchStatus, setSearchStatus] = useState<""|"pending"|"failure"|"success">("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [search, setSearch] = useState('');

  const api = useContext(AxiosHttpRequest)!

  function fetchItems() {
    api.get('/api/inventory/items?search=' + search)
    .then(response => {
      if (search) {
        setSearchResults(response.data.items)
        setSearchStatus("success")
      }else  {
        setItems(response.data.items)
      }
    })
    .catch(error => {
      console.log(error)
    })
    .finally(()=>{
      setLoading(false);
    })
  }

  useEffect(() => {
    if (loading && items.length == 0) {
      fetchItems();
      return;
    }

    if (search.trim()) {
      setSearchStatus("pending");
      const delayDebounceFn = setTimeout(() => {
        fetchItems();
      }, 300); // Debounce search
      return () => clearTimeout(delayDebounceFn);
    }else if (searchStatus) { // all non-whitespace characters have been deleted but search state is still active
      setSearchStatus("")
    }
  }, [search]);

  if (loading) {
    return <div className="w-10 h-10 mx-auto border-gray-600 border-b-gray-300 border-4 rounded-full animate-spin mt-8 "></div>
  }

  return (
    <div>
      <label className="block text-sm font-bold text-slate-500 mb-2 uppercase">Select Product</label>
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
        <input 
          onChange={(event) => {setSearch(event.target.value)}}
          value={search}
          type="text" 
          placeholder="Search by SKU or Name..." 
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      {searchStatus === "pending" && <div className="w-10 h-10 mx-auto border-slate-600 border-b-transparent border-3 rounded-full animate-spin mt-8"></div>}
      {searchStatus === "success" && searchResults.length > 0 && (
        <>
          <p className="font-semibold border-b border-b-gray-200 flex pb-1 justify-between w-full items-center">
            <span>Search Results</span>
            <button className="p-1 cursor-pointer" onClick={()=>{setSearch(""); setSearchStatus("")}}><X size={18}/></button>
          </p>
          <ul className="p-2 rounded-sm mt-2 max-h-150 overflow-y-auto">
            {searchResults.map((item) => (
              <li key={item.id}>
                <button className="block hover:bg-gray-100 border-b border-gray-100 w-full text-left cursor-pointer p-1" onClick={() => selectItem(item)}>
                  <p className="font-semibold mb-1"><span className="text-xs text-slate-500">{item.sku}</span> {item.name}</p>
                  <p><span className="text-blue-400">{item.category}</span><span className="text-gray-700">{item.stockCount} item(s)</span></p>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {searchStatus === "success" && searchResults.length === 0 && (
        <div>
          <p className="font-semibold border-b border-b-gray-200 flex pb-1 pt-2 justify-between w-full items-center">
            <span>Search Results</span>
            <button className="p-1 cursor-pointer" onClick={()=>{setSearch(""); setSearchStatus("")}}><X size={18}/></button>
          </p>
          <div className="flex flex-col items-center py-2 mt-8">
            <Ban size={40} className="text-slate-400" />
            <p className="mt-2 text-blue-600 text-center text-lg">No Products matching '<span className="font-semibold">{search}</span>' was found!</p>
          </div>
        </div>
      )}
      {(searchStatus === "" || search === "") && items.length > 0 && (
        <ul className="p-2 rounded-sm mt-2 max-h-150 h-full overflow-y-auto">
          {items.map((item) => (
            <li key={item.id}>
              <button className="block hover:bg-gray-100 border-b border-gray-100 w-full text-left cursor-pointer px-1 py-2" onClick={() => selectItem(item)}>
                <p className="font-semibold mb-1"><span className="text-xs text-slate-500">{item.sku}</span> {item.name}</p>
                <p><span className="text-blue-400">{item.category}</span> <span className="text-gray-700">{item.stockCount} item(s)</span></p>
              </button>
            </li>
          ))}
        </ul>
      )}
      {(searchStatus === "" || search === "") && items.length === 0 && (
        <div className="flex flex-col items-center">
          <PackageOpen size={25} className="text-slate-400" />
          <p className="mt-2 text-slate-600 text-center text-lg">No Products In Inventory!</p>
        </div>
      )}
    </div>
  )
}


function LogReason({text} : {text: string}) {
  const textTooLong = text.length - 12 >= 4
  function truncateString(str: string){
    if (textTooLong) {
      return str.slice(0, 22) + "...";
    }
    return str;
  }
  return (
    <div className="group cursor-pointer">
      <h3 className="font-medium text-slate-700 text-sm mb-1 mt-2 leading-tight">
        {truncateString(text)}
      </h3>
      {textTooLong && <div className="absolute rounded-sm hidden group-hover:block bg-gray-700/80 text-white p-1 text-base sm:text-sm">{text}</div>}
    </div>
  )
}



export default function InventoryDiscrepancy({ user } : {user: NonSensitiveUserData}) {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [pageLoadStatus, setPageLoadStatus] = useState<"success"|"pending"|"failure">("pending")
  const [logCreationState, setLogCreationState] = useState<""|"success"|"pending"|"failure"|"reason-field-failure">("")

  const api = useContext(AxiosHttpRequest)!

  function fetchLogs() {
    setPageLoadStatus("pending")
    api.get("/api/inventory/audit-logs")
    .then(response => {
      setPageLoadStatus("success");
      setLogs(response.data.logs)
    })
    .catch(error => {console.log(error); setPageLoadStatus("failure")});
  }

  function sendLogCreationReq() {
    const reasonVal = reason.trim()
    if (!reasonVal) {
      setLogCreationState("reason-field-failure");
      return;
    }

    setLogCreationState("pending")
    api.post("/api/inventory/audit-logs", { productId: selectedProduct.id, newQuantity, reason: reasonVal, employeeName: user.username })
    .then((response) => {
      setSelectedProduct(null)
      setLogs([response.data.newLog, ...logs])
    })
    .catch(error => {
      setLogCreationState("failure");
      console.log(error)
    })
    console.log()
  }
  
  useEffect(() => {
    fetchLogs() 
  }, [])

  // Logic to calculate discrepancy in real-time
  const discrepancy = selectedProduct ? (newQuantity || 0) - selectedProduct.stockCount : 0;

  if (pageLoadStatus === "failure") {
    <div className="flex flex-col items-center justify-center h-full text-gray-800 p-8">
      <AlertTriangle size={200} className="text-red-300"/>
      <h1 className="text-4xl text-slate-700 font-bold mt-4">Unexpected Error</h1>
      <p className="font-semibold mt-1 text-lg text-center">Could not get Existing Audits</p>
      <button onClick={() => {fetchLogs()}} 
        className="mt-4 px-5 py-1 text-lg bg-blue-600 text-white rounded-md cursor-pointer">
        Retry
      </button>
    </div>
  }

  if (pageLoadStatus === "pending")
    return <div className="w-30 h-30 mx-auto border-slate-600 border-b-transparent border-6 rounded-full animate-spin mt-40"></div>

  return (
    <div className="flex h-screen bg-slate-50 text-sm">
      {/* LEFT: History Log */}
      <div className="w-2/3 p-8 overflow-y-auto border-r border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <History className="text-slate-400" />
          <h1 className="text-2xl font-black text-slate-800">Discrepancy Log</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2 text-xs font-bold text-slate-500 uppercase">Date</th>
                <th className="px-4 py-2 text-xs font-bold text-slate-500 uppercase">Product</th>
                <th className="px-4 py-2 text-xs font-bold text-slate-500 uppercase text-center">Old Quantity</th>
                <th className="px-4 py-2 text-xs font-bold text-slate-500 uppercase text-center">New Quantity</th>
                <th className="px-4 py-2 text-xs font-bold text-slate-500 uppercase text-center">Quantity Change</th>
                <th className="px-4 py-2 text-xs font-bold text-slate-500 uppercase">Reason</th>
                <th className="px-4 py-2 text-xs font-bold text-slate-500 uppercase">Employee</th>
              </tr>
            </thead>
            {logs.length > 0 && (
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-2 text-sm text-slate-600">{new Date(log.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{log.productName}</td>
                    <td className="px-4 py-2 font-bold text-slate-600">{log.oldQuantity}</td>
                    <td className="px-4 py-2 font-bold text-slate-800">{log.newQuantity}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${log.changeAmount < 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {log.changeAmount > 0 ? `+${log.changeAmount}` : log.changeAmount}
                      </span>
                    </td>
                    <td className="px-4 py-2 relative"><LogReason text={log.reason}/></td>
                    <td className="px-4 py-2 text-sm text-slate-500">{log.employeeName}</td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
          {logs.length === 0 && <p className="w-full text-center text-slate-500 font-smibold py-4">No Logs have been created yet!</p>}
        </div>
      </div>

      {/* RIGHT: Adjustment Form */}
      <div className="w-1/3 py-8 px-4 bg-white border-l border-slate-200 shadow-xl overflow-y-clip overflow-x-show">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Log New Discrepancy</h2>
        
        <div className="space-y-6 relative">
          <Items key={logs.length} selectItem={setSelectedProduct}/>

          {selectedProduct && (
            <div className="z-20 absolute right-[100%] w-80 top-4 bg-white shadow-lg shadow-gray-200 rounded-xl border border-gray-200 px-4 py-6">
              <div className="text-lg font-semibold">{selectedProduct.name}</div>
              <div className="flex justify-between items-center mb-4 border-b-gray-200 border-b-1">
                <span className="text-slate-400 text-sm">System Count</span>
                <span className="text-2xl font-mono">{selectedProduct.stockCount}</span>
              </div>
              <button className="p-1 cursor-pointer absolute top-2 right-2 hover:bg-gray-200 rounded-full" onClick={() => setSelectedProduct(null)}><X size={18}/></button>
              
              <div>
                <label className="block font-semibold text-slate-600 mb-2">New Quantity</label>
                <input 
                  type="number" 
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseInt(e.target.value || '0'))}
                  className="w-full text-center text-xl font-bold border-0 outline-gray-400 rounded-xl py-2 outline-1 focus:outline-blue-600"
                />
              </div>

              <div className="mt-2 mb-4 flex items-center justify-between p-2 rounded-lg border-slate-400 border-px bg-slate-300">
                <span className="text-sm font-medium text-slate-800">Discrepancy:</span>
                <div className={`flex items-center gap-2 font-bold text-xl ${discrepancy < 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                  {discrepancy === 0 ? 'No Change' : `${discrepancy > 0 ? '+' : ''}${discrepancy}`}
                  {discrepancy !== 0 && <AlertTriangle size={18} />}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2 mt-4 uppercase">Adjustment Reason</label>
                <input 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
                {logCreationState === "reason-field-failure" && <span className="mt-1 block text-red-400 text-sm rounded-md">
                  This field is required
                </span>}
              </div>
              {logCreationState === "failure" && <span className=" my-2 p-2 block text-red-400 bg-red-100 text-sm rounded-md">
                Unexpected Error! Please try again or Refresh the products to confirm product hasn't been deleted
              </span>}
              <button 
                onClick={sendLogCreationReq}
                disabled={!selectedProduct || discrepancy === 0 || logCreationState === "pending"}
                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2 mt-2 cursor-pointer font-semibold rounded-xl transition-all"
              >
                {logCreationState === "pending" ?
                  <div className="w-6 h-6 border-white border-b-transparent border-3 rounded-full animate-spin"></div>
                  : 
                  <Save size={20} />
                }
                {logCreationState === "pending" ? <span>Creating Adjustment...</span> : <span>Create Adjustment</span>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};