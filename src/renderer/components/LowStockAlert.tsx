import type { Product as InventoryItem } from '../../../prisma/generated/client';
import { ChevronLeft, ChevronRight, Search, PackageOpen, X, RefreshCw, Loader2 } from "lucide-react";
import {useState, useContext, useEffect} from "react"
import { AxiosHttpRequest, GeneralProgramSettings } from '../../App';

function PaginationInterface({page, totalPages, setPage} : {page: number, totalPages: number, setPage: (num: number)=>void}) {
  return (
    <div className="p-4 bg-slate-50 bg-slate-100 rounded-b-2xl flex items-center justify-between">
      <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <button 
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="p-2 border rounded bg-white disabled:opacity-50 hover:bg-slate-50"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="p-2 border rounded bg-white disabled:opacity-50 hover:bg-slate-50"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}

export default function LowStockScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1);
  const [error, setError] = useState("")
  const api = useContext(AxiosHttpRequest)!
  const [search, setSearch] = useState("");
  const config = useContext(GeneralProgramSettings)!
  const [itemToEdit, setItemToEdit] = useState<{id: number|null, value: number}>({id: null, value: -1})
  const [loading, setLoading] = useState(true)

  async function updateItemStockCount() {
    if (itemToEdit.id === null)
      return;
    const url = itemToEdit ? `/api/inventory/${itemToEdit.id}` : '/api/inventory';
    const method = itemToEdit ? 'PUT' : 'POST';

    api.request({
      url,
      method,
      data: {stockCount: itemToEdit.value }
    })
    .then(resBody => {
      if (resBody.data.stockCount > 10) {
        setItems(items.filter(item => item.id !== resBody.data.id))
      }else {
        const newItems = [...items]
        const updatedItemIndex = newItems.findIndex(item => item.id === resBody.data.id)
        if (updatedItemIndex !== -1)
          newItems[updatedItemIndex] = resBody.data
        setItems(newItems)
      }
    })
    .catch(err => {
      console.log(err)
      setError("Something went wrong while modifying Inventory")
    })
    .finally(()=>setItemToEdit({id: null, value: -1}))
  };

	function getLowStockItems() {
		const url = search ? 
		`/api/inventory/lowstock?search=${search}&lowstocknum=${config.lowStockValue}` : 
		`/api/inventory/lowstock?page=${page}&limit=10&lowstocknum=${config.lowStockValue}`;
		api.get(url)
		.then(response => {
			console.log(response.data)
			setItems(response.data.items)
			if (!search) {
				setTotalPages(response.data.totalPages)
				setLowStockCount(response.data.count)
			}
		})
		.catch(error => {
			console.log(error.response)
			setError("Unexpected Error! Please try again");
		})
    .finally(() => setLoading(false))
	}

  function handleReload() {
    setLoading(true)
    getLowStockItems()
  }

	useEffect(() => {
		if (search) {
			const delayDebounceFn = setTimeout(() => {getLowStockItems();}, 300); // Debounce search
			return () => clearTimeout(delayDebounceFn);
		}else {
			getLowStockItems();
		}
	}, [search])

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-gray-800 p-8">
				<img src="/connection-lost.svg" className="w-120 "/>
				<p className="font-semibold flex items-center mt-20 gap-2"><span>{error}</span></p>
				<button onClick={() => { setError(""); getLowStockItems()}} className="mt-4 px-5 py-1 text-lg bg-blue-600 text-white rounded-md cursor-pointer">Retry</button>
			</div>
		);
	}

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500">
      <Loader2 className="animate-spin mb-2" size={32} />
      <p>Retrieving Low Stock items...</p>
    </div>
  );

  return (
		<section className="p-8">
			<h1 className="text-3xl font-bold text-slate-900">Low Stock Items</h1>
			<div className="flex justify-between">
        <span className="text-red-400 font-semibold text-lg my-2">{lowStockCount} items</span>
        <button 
          onClick={handleReload}
          disabled={loading}
          className="cursor-pointer flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-semibold hover:bg-slate-200 transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={18} className={`${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Syncing...' : 'Reload'}
        </button>
      </div>
			<div className="relative my-6">
				<Search className="absolute left-3 top-3 text-slate-400" size={20} />
				<input 
					type="text"
					placeholder="Search by name, category, or distributor..."
					className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
					value={search}
					onChange={(e) => { setSearch(e.target.value); setPage(1); }}
				/>
			</div>
			{items.length !== 0 ? (
				<table className="text-left rounded-t-2xl border border-slate-200 w-full overflow-hidden">
					<thead className="bg-slate-200 border-b border-slate-200">
						<tr>
							<th className="px-6 py-4 font-semibold text-slate-800">SKU</th>
							<th className="px-6 py-4 font-semibold text-slate-800">Product</th>
							<th className="px-6 py-4 font-semibold text-slate-800">Category</th>
							<th className="px-6 py-4 font-semibold text-slate-800">Price</th>
							<th className="px-6 py-4 font-semibold text-slate-800">Cost Price</th>
							<th className="px-6 py-4 font-semibold text-slate-800">Stock Count</th>
						</tr>
					</thead>
					<tbody className="bg-white">
						{items.map((item) => (
							<tr key={item.id} className={`border-b border-slate-50 transition`}>
								<td className="px-6 py-4 font-mono text-xs text-slate-400">{item.sku}</td>
								<td className="px-6 py-4 font-medium text-slate-800">{item.name}</td>
								<td className="px-6 py-4 text-slate-500">{item.category || 'Uncategorized'}</td>
								<td className="px-6 py-4 text-blue-600 font-semibold">${item.price.toFixed(2)}</td>
								<td className="px-6 py-4 text-blue-600 font-semibold">${item.costPrice.toFixed(2)}</td>
								<td className="px-6 py-4">
									{item.id === itemToEdit.id  ?
										<div className="w-fit flex items-center border-gray-300 overflow-hidden px-1">
											<input type="number" className=" rounded-lg w-20 outline-1 outline-gray-300 focus:outline-blue-400 px-1" 
											value={itemToEdit.value} onChange={(event) => setItemToEdit({id: itemToEdit.id, value: parseInt(event.target.value)})}/>
											<button className="bg-blue-600 text-white rounded-sm px-2 cursor-pointer ml-2" onClick={updateItemStockCount}>Restock</button>
											<button className="cursor-pointer p-1 hover:text-red-600" onClick={() => setItemToEdit({id: null, value:-1})}><X size={18}/></button>
										</div>
									:
										<button className={`px-2 py-1 rounded text-xs font-bold text-red-600 hover:bg-red-300 cursor-pointer`} onClick={() => setItemToEdit({id: item.id, value: item.stockCount})}>
											{item.stockCount}
										</button>
									}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			) : 
        <div className="w-full">
          <PackageOpen size={200} className="text-slate-400 block mx-auto mt-20 w-full"/>
          <p className="font-semibold mt-20 gap-2 text-slate-600 text-lg text-center w-full">
            {search ? "Inventory item couldn't be found. Check your search term and try again" : "You have zero low stock inventory item"}
          </p>
				</div>
			}
			
			{!search && items.length > 0 && (
				<PaginationInterface page={page} totalPages={totalPages} setPage={setPage}/>
			)}
		</section>
	)
}