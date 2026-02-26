import { useContext, useState } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import type { Distributor, Product  } from '../../../prisma/generated/client';
import { AxiosHttpRequest } from '../../App';


interface InventoryItemFormProps {
    hideForm: ()=>void;
    onSave: (id: number|null, update: Product)=>void;
    distributors: Distributor[];
    itemToEdit: Product | null;
}

function highlightIfFieldHasError(field: string, errors: {affectedField: string; content: string}[]) {
    for (const errorObj of errors) {
        if (errorObj.affectedField === field)
            return "border-red-600"
    }
    return ""
}

export default function InventoryItemForm( {hideForm, itemToEdit, onSave, distributors } : InventoryItemFormProps ) {
    const api = useContext(AxiosHttpRequest)!
    const [errors, setErrors] = useState<{affectedField: string; content: string}[]>([])

    async function handleSave(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const payload = Object.fromEntries(formData);
    
        if (payload.distributorId) {
          payload.distributorId = parseInt(payload.distributorId as string)
        }
        
        const url = itemToEdit ? `/api/inventory/${itemToEdit.id}` : '/api/inventory';
        const method = itemToEdit ? 'PUT' : 'POST';
    
        api.request({
          url,
          method,
          data: { ...payload, costPrice: parseFloat(payload.costPrice as string), price: parseFloat(payload.price as string), stockCount: parseInt(payload.stockCount as string) }
        })
        .then(resBody => {
            onSave(itemToEdit ? itemToEdit.id : null, resBody.data)
        })
        .catch(err => {
          console.log(err)
          if (err.response.status === 400) {
            setErrors(err.response.data)
          }else {
            setErrors([{affectedField: "", content: "Something went wrong while modifying Inventory"}])
          }
        })
    
      };
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            {errors.length > 0 && <ul className="absolute top-5 h-20 w-200">
                {errors.map(error => (
                    <li className="flex border-1 border-red-600 bg-red-200 text-red-600 p-2 rounded-lg items-center w-full">
                        <span className="block mr-4">{error.content}</span>
                        <AlertCircle size={18}/>
                    </li>
                ))}
            </ul>}
            <div className="bg-white rounded-2xl w-[500px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-bold text-slate-800">{itemToEdit ? 'Edit Product' : 'New Inventory Item'}</h2>
            <button onClick={hideForm} className="p-2 hover:bg-slate-200 rounded-full cursor-pointer"><X/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4" onFocus={()=>setErrors([])}>
                <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="text-sm font-semibold text-slate-600">Product Name</label>
                    <input name="name" defaultValue={itemToEdit?.name} required className={`${highlightIfFieldHasError("name", errors)} w-full p-2 border rounded-lg mt-1`} />
                </div>
                <div className="col-span-2">
                    <label className="text-sm font-semibold text-slate-600">Category</label>
                    <input name="category" defaultValue={itemToEdit?.category || ""} className={`${highlightIfFieldHasError("category", errors)} w-full p-2 border rounded-lg mt-1`} />
                </div>
                <div>
                    <label className="text-sm font-semibold text-slate-600">Unit Price ($)</label>
                    <input name="price" type="number" step="0.01" defaultValue={itemToEdit?.price} required className={`${highlightIfFieldHasError("price", errors)} w-full p-2 border rounded-lg mt-1`} />
                </div>
                <div>
                    <label className="text-sm font-semibold text-slate-600">Cost Price ($)</label>
                    <input name="costPrice" type="number" step="0.01" defaultValue={itemToEdit?.costPrice} required className={`${highlightIfFieldHasError("costPrice", errors)} w-full p-2 border rounded-lg mt-1`} />
                </div>
                <div className="col-span-1">
                    <label className="text-sm font-semibold text-slate-600">Sku</label>
                    <input name="sku" defaultValue={itemToEdit?.sku} className={`${highlightIfFieldHasError("sku", errors)} w-full p-2 border rounded-lg mt-1`} />
                </div>
                <div>
                    <label className="text-sm font-semibold text-slate-600">Stock Count</label>
                    <input name="stockCount" type="number" defaultValue={itemToEdit?.stockCount} required className={`${highlightIfFieldHasError("price", errors)} w-full p-2 border rounded-lg mt-1`} />
                </div>
                </div>
                <div>
                <label className="text-sm font-semibold text-slate-600">Distributor (Optional)</label>
                <select 
                    name="distributorId"
                    defaultValue={itemToEdit?.distributorId || ""} 
                    className="w-full p-2 border rounded-lg mt-1 bg-white"
                >
                    <option value="">Select a distributor</option>
                    {distributors.map(dist => (
                    <option key={dist.id} value={dist.id}>
                        {dist.name}
                    </option>
                    ))}
                </select>
                </div>
                <div className="pt-4 flex gap-3">
                <button type="button" onClick={hideForm} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl text-slate-600 cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 font-bold rounded-xl text-white flex items-center justify-center gap-2 shadow-md shadow-gray-200 cursor-pointer">
                    <Save size={18}/> {itemToEdit ? 'Update Item' : 'Create Item'}
                </button>
                </div>
            </form>
            </div>
        </div>
    )
}