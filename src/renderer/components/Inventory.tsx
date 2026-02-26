import { useState, useEffect, useContext, useRef } from 'react';
import { 
  Search, Plus, Edit, Trash2, Package, AlertTriangle, 
  DollarSign, PackageX, ChevronLeft, ChevronRight, 
  Loader2, FileUp, PackageOpen, RefreshCw,Truck
} from 'lucide-react';
import type { Product as InventoryItem, Distributor } from '../../../prisma/generated/client';
import DistributorScreen  from './Distributors';
import { AxiosHttpRequest } from '../../App';
import InventoryItemForm from "./InventoryItemForm"
import ExcelImportSection from "./ExcelImport"


function Tabs({activeTab, setActiveTab} : {activeTab: "products"|"distributors", setActiveTab: (tabName: "products"|"distributors")=>void}) {
  return  (
    <div className="flex gap-1 bg-slate-200 p-1 rounded-xl w-fit mb-8">
      <button 
        onClick={() => setActiveTab('products')}
        className={`cursor-pointer flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition ${activeTab === 'products' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
      >
        <Package size={18} /> Products
      </button>
      <button 
        onClick={() => setActiveTab('distributors')}
        className={`cursor-pointer flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition ${activeTab === 'distributors' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
      >
        <Truck size={18} /> Distributors
      </button>
    </div>
  )
}


export default function InventoryModule() {
  const [activeTab, setActiveTab] = useState<'products' | 'distributors'>('products');
  const [distributors, setDistributors] = useState<any[]>([]);
  const api = useContext(AxiosHttpRequest)!

  function fetchDistributors() {
    api.get('/api/distributors') // fetch distributors data ahhead of time
    .then(res => setDistributors(res.data))
  }

  useEffect(() => {
    fetchDistributors()
  }, []);
  
  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Inventory</h1>
        <p className="text-slate-500 mt-2 mb-4">Manage products, pricing, and distributors</p>
      </div>
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab}/>
      {activeTab === 'products' ? (
        <InventoryScreen distributors={distributors} />
      ) : <DistributorScreen distributors={distributors} updateDistributorsData={fetchDistributors}/>}
    </div>
  );
};


interface InventoryScreenData {
  items: InventoryItem[],
  totalPages: number,
  kpis: {
    totalValue: number,
    distinctProducts: number,
    lowStock: number,
    outOfStockCount: number
  }
}


function InventoryScreen({ distributors}: {distributors: Distributor[]}) {
  const [data, setData] = useState<InventoryScreenData>(
    { items: [], kpis: {totalValue: 0, distinctProducts: 0, lowStock: 0, outOfStockCount: 0}, totalPages: 1 }
  );
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem|null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [bulkImportUIvisible, setBulkImportUIVisible] = useState(false)
  const api = useContext(AxiosHttpRequest)!

  function showEditFormPopup(item: InventoryItem) {
    setModalOpen(true);
    setEditingItem(item)
  }

  function closeEditFormPopup() {
    setModalOpen(false);
    setEditingItem(null)
  }

  const fetchInventory = async (showLoading: boolean) => {
    if (showLoading)
      setLoading(true);
    try {
      // If searching, we don't send page/limit so the backend returns all matches
      const url = search 
        ? `/api/inventory?search=${search}`
        : `/api/inventory?page=${page}&limit=10`;
      
      const res = await api.get(url);
      setData(res.data);      
    } catch (err) {
      setError("Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  function handleReload() {
    setLoading(true)
    fetchInventory(true);
  }

  function updateItemDetails(itemId: number, newDetails: InventoryItem) {
    const newItems = [...data.items]
    const updatedItemIndex = newItems.findIndex(item => item.id === itemId)
    if (updatedItemIndex !== -1)
      newItems[updatedItemIndex] = newDetails
    setData({...data, items: newItems})
  }

  useEffect(() => {
    if (search) {
      const delayDebounceFn = setTimeout(() => {
        fetchInventory(false);
      }, 300); // Debounce search
      return () => clearTimeout(delayDebounceFn);
    }else {
      fetchInventory(true);
    }
    
  }, [page, search]);

  function updateInventoryUIWithSavedData(updatedItemId: number|null, savedData: InventoryItem){
    if (updatedItemId !== null){
      updateItemDetails(updatedItemId, savedData)
    }else {
      fetchInventory(false)
    }
    setModalOpen(false);
    setEditingItem(null)
  }

  function onSuccessfulBulkImport() {
    fetchInventory(false)
    setBulkImportUIVisible(false);
  }

  function removeItemFromDisplay(itemId: number) {
    setData({...data, items: data.items.filter((item) => item.id !== itemId)})
    fetchInventory(false);
  }
  

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500">
      <Loader2 className="animate-spin mb-2" size={32} />
      <p>Syncing stock data...</p>
    </div>
  );

  // UI STATE: ERROR
  if (error) return (
    <div className="flex flex-col items-center justify-center h-full text-gray-800 p-8">
      <img src="/connection-lost.svg" className="w-120 "/>
      <p className="font-semibold flex items-center mt-20 gap-2"><span>{error}</span></p>
      <button onClick={() => { setError(null); fetchInventory(true)}} className="mt-4 px-5 py-1 text-lg bg-blue-600 text-white rounded-md cursor-pointer">Retry</button>
    </div>
  );


  return (
    <section className="pb-4 pt-0">
      {/* KPI SECTION */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <KPICard title="Total Value" value={`$${data.kpis?.totalValue?.toLocaleString()}`} icon={<DollarSign className="text-emerald-600"/>} color="bg-emerald-50" />
        <KPICard title="Low Stock" value={data.kpis?.lowStock} icon={<AlertTriangle className="text-amber-600"/>} color="bg-amber-50" />
        <KPICard title="Total Products" value={data.kpis?.distinctProducts} icon={<Package className="text-blue-600"/>} color="bg-blue-50" />
        <KPICard title="Out Of Stock" value={data.kpis?.outOfStockCount} icon={<PackageX className="text-red-600"/>} color="bg-red-50" />
      </div>

      <div className="flex justify-end items-end mb-8">
        
        <div className="flex gap-3">
          <button className="cursor-pointer flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700" 
            onClick={()=>setBulkImportUIVisible(true)}>
            <FileUp size={20} /> Bulk Import
          </button>
          <button className="cursor-pointer flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" onClick={()=>setModalOpen(true)}>
            <Plus size={20} /> Add Product
          </button>
          <button 
            onClick={handleReload}
            disabled={loading}
            className="cursor-pointer flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-semibold hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={18} className={`${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Syncing...' : 'Reload'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Search by name, category, or distributor..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
         {!loading && data.items.length === 0 ? (
            <div className="bg-white rounded-2xl p-20 border border-dashed text-center flex flex-col items-center">
              <PackageOpen size={64} className="text-slate-300 mb-4" />
              <p className="text-xl font-medium text-slate-600">No products found</p>
              <p className="text-slate-400">Try adjusting your search or add a new item.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <InventoryTable items={data.items} delItemInDisplay={removeItemFromDisplay} displayInventoryErr={setError} displayEditInterface={showEditFormPopup}/>
              {/* Pagination (Hidden during search) */}
              {!search && (
                <PaginationInterface page={page} totalPages={data.totalPages} setPage={setPage}/>
              )}
            </div>
          )}
      </div>

      {modalOpen && ( <InventoryItemForm hideForm={closeEditFormPopup} itemToEdit={editingItem} distributors={distributors} onSave={updateInventoryUIWithSavedData}/>)}
      {bulkImportUIvisible && <ExcelImportSection hideSection={()=>setBulkImportUIVisible(false)} updateUI={onSuccessfulBulkImport}/>}
    </section>
  );
};

// Reusable KPI Component
const KPICard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`p-4 rounded-xl ${color}`}>{icon}</div>
    <div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

function InventoryTable(
  {items, delItemInDisplay, displayInventoryErr, displayEditInterface} : 
  {items: InventoryItem[], delItemInDisplay: (id: number)=>void, displayInventoryErr: (str: string)=>void, displayEditInterface: (product: InventoryItem)=>void}) {

  const [itemsBeingDeleted, setItemsBeingDeleted] = useState<number[]>([])
  const api = useContext(AxiosHttpRequest)!

  
  function deleteInventoryItem(itemId: number) {
    api.delete(`/api/inventory/${itemId}`)
    .then(response => {
      const deletedItem = response.data
      delItemInDisplay(deletedItem.id)
    })
    .catch(err => {
      console.log(err)
      displayInventoryErr("Something went wrong while modifying Inventory")
    })

  }

  function formatProductName(name: string) {
    return name.trim().split(/\s+/).map((str) => str[0].toUpperCase() + str.slice(1)).join(' ')
  }

  return (
    <table className="w-full text-left">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          <th className="px-6 py-4 font-semibold text-slate-600">SKU</th>
          <th className="px-6 py-4 font-semibold text-slate-600">Product</th>
          <th className="px-6 py-4 font-semibold text-slate-600">Category</th>
          <th className="px-6 py-4 font-semibold text-slate-600">Price</th>
          <th className="px-6 py-4 font-semibold text-slate-600">Cost Price</th>
          <th className="px-6 py-4 font-semibold text-slate-600">Stock</th>
          <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className={`border-b border-slate-50 hover:bg-slate-50 transition ${itemsBeingDeleted.includes(item.id) ? "opacity-50" : ""}`}>
            <td className="px-6 py-4 font-mono text-xs text-slate-400">{item.sku}</td>
            <td className="px-6 py-4 font-medium text-slate-800">{formatProductName(item.name)}</td>
            <td className="px-6 py-4 text-slate-500">{item.category?.toUpperCase() || 'Uncategorized'}</td>
            <td className="px-6 py-4 text-blue-600 font-semibold">${item.price.toFixed(2)}</td>
            <td className="px-6 py-4 text-blue-600 font-semibold">${item.costPrice.toFixed(2)}</td>
            <td className="px-6 py-4 min-w-10">
              <span className={`px-2 py-1 rounded text-xs font-bold ${item.stockCount < 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {item.stockCount} in stock
              </span>
            </td>
            <td className="px-6 py-4 text-right space-x-2 min-w-10">
              <button className="p-2 text-slate-400 hover:text-blue-600" onClick={() => displayEditInterface(item)}><Edit size={18} /></button>
              <button className="p-2 text-slate-400 hover:text-red-600" onClick={() => deleteInventoryItem(item.id)}><Trash2 size={18} /></button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function PaginationInterface({page, totalPages, setPage} : {page: number, totalPages: number, setPage: (num: number)=>void}) {
  return (
    <div className="p-4 bg-slate-50 border-slate-200 border-t flex items-center justify-between">
      <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <button 
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="p-2 border rounded bg-white disabled:opacity-50 hover:bg-slate-50 cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="p-2 border rounded bg-white disabled:opacity-50 hover:bg-slate-50 cursor-pointer"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>

  )
}