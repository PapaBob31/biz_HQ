import type { Distributor, Product  } from '../../../prisma/generated/client';
import {  Mail, Phone, Globe, Edit, Trash2, Plus, Package, Truck } from "lucide-react"
import React, { useState, useEffect, useContext } from 'react';
import { AxiosHttpRequest } from '../../App';
import InventoryItemForm from "./InventoryItemForm"


function DistributorProduct({item, showEditForm, deleteProduct} : {item: Product, showEditForm: ()=>void, deleteProduct: (itemId: number)=>void}) {
  const api = useContext(AxiosHttpRequest)!

  function sendDeleteProductReq() {
    api.delete(`/api/inventory/${item.id}`)
    .then(response => {
      const deletedItem = response.data
      deleteProduct(deletedItem.id)
    })
    .catch(err => {
      console.log(err)
      alert("Something went wrong! Distributor's product could not be deleted")
    })

  }
  return (
      <div key={item.id} 
          className={`px-2 py-4 cursor-pointer bg-white border-b border-slate-50 hover:bg-slate-50 transition flex items-center justify-between `}>
          <span className="font-mono text-xs text-slate-400">{item.sku}</span>
          <span className="font-medium text-slate-800">{item.name}</span>
          <span className="text-blue-600 font-semibold">${item.price.toFixed(2)}</span>
          <span className={`rounded text-xs font-bold ${item.stockCount < 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {item.stockCount} in stock
          </span>
          <div className="text-right space-x-2">
              <button className="mr-2 text-slate-400 hover:text-blue-600" onClick={showEditForm}><Edit size={18} /></button>
              <button className="text-slate-400 hover:text-red-600" onClick={sendDeleteProductReq}><Trash2 size={18} /></button>
          </div>
      </div>
    )
}
const DistributorModal = ({ dist, onClose, onSave }: any) => {
  const api = useContext(AxiosHttpRequest)!

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData);
    
    const url = dist ? `/api/distributors/${dist.id}` : '/api/distributors';
    const method = dist ? 'PUT' : 'POST';

    await api.request({
      url,
      method,
      data:payload
    });
    
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-white rounded-2xl w-120 p-6 shadow-2xl">
        <h2 className="text-xl font-bold mb-6">{dist ? 'Edit Distributor' : 'Add Distributor'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold">Company Name</label>
            <input name="name" defaultValue={dist?.name} required className="w-full p-2 border rounded-lg mt-1" placeholder="e.g. Coca-Cola Bottling" />
          </div>
          <div>
            <label className="text-sm font-semibold">Contact Email</label>
            <input name="contactEmail" type="email" defaultValue={dist?.contactEmail} className="w-full p-2 border rounded-lg mt-1" placeholder="orders@distro.com" />
          </div>
          <div>
            <label className="text-sm font-semibold">Phone Number</label>
            <input name="phone" defaultValue={dist?.phone} className="w-full p-2 border rounded-lg mt-1" placeholder="+1 (555) 000-0000" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-slate-100 rounded-lg cursor-pointer">Cancel</button>
            <button type="submit" className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg cursor-pointer">Save Partner</button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default function DistributorScreen({ distributors,  updateDistributorsData} : {distributors: Distributor[], updateDistributorsData: ()=>void}) {
  const [editingDist, setEditingDist] = useState<Distributor|null>(null);
  const [distModalOpen, setDistModalOpen] = useState(false);
  const [selectedDist, setSelectedDist] = useState<Distributor|null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productToUpdate, setProductToUpdate] = useState<Product|null>(null)
  const [loading, setLoading] = useState(false);
  const api = useContext(AxiosHttpRequest)!

  useEffect(() => {
    if (selectedDist) {
      setLoading(true);
      api.get(`/api/distributors/${selectedDist.id}/products`)
      .then(res => {
        setProducts(res.data);
        setLoading(false);
      });
    }
  }, [selectedDist]);

  function removeDistributorProduct(removedProductId: number){
    setProducts(products.filter((product) => product.id !== removedProductId))
  }

  function updateItemDetails(itemId: number, newDetails: Product) {
    const newProducts = [...products]
    const updatedItemIndex = newProducts.findIndex(item => item.id === itemId)
    if (updatedItemIndex !== -1)
      newProducts[updatedItemIndex] = newDetails
    setProducts(newProducts)
  }

  function updateProductsUIWithSavedData(updatedItemId: number|null, savedData: InventoryItem){
    if (updatedItemId !== null){
      updateItemDetails(updatedItemId, savedData)
    }
    setProductToUpdate(null)
  }

  return (
    <section className="animate-in fade-in slide-in-from-bottom-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Supply Partners</h1>
        <button 
          onClick={() => { setEditingDist(null); setDistModalOpen(true); }}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2"
        >
          <Plus size={20} /> Add Distributor
        </button>
      </div>

        <div className="flex h-screen bg-slate-50 overflow-hidden items-start">
            <div className="flex gap-2 flex-wrap grow-1 mr-4">
                {distributors.map(dist => (
                <div key={dist.id} onClick={() => setSelectedDist(dist)} 
                    className={`cursor-pointer p-6 rounded-2xl shadow-sm border hover:shadow-md transition group w-60
                        ${selectedDist?.id === dist.id ? ' bg-blue-50 border border-blue-600' : 'bg-white hover:bg-slate-50  border-slate-200'}`
                    }>
                    <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Globe size={24} />
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => { setEditingDist(dist); setDistModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600">
                            <Edit size={16}/>
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                    </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">{dist.name}</h3>
                    <div className="mt-4 space-y-2 text-sm text-slate-500">
                    <div className="flex items-center gap-2"><Mail size={14}/> {dist.contactEmail || 'No email'}</div>
                    <div className="flex items-center gap-2"><Phone size={14}/> {dist.phone || 'No phone'}</div>
                    </div>
                </div>
                ))}
            </div>

            <div className="flex flex-col h-90 rounded-xl bg-slate-200 w-100">
                {selectedDist ? (
                <>
                    <div className="flex justify-between items-end p-4 bg-white border-b border-slate-200">
                        <div>
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Supplier Profile</span>
                            <h1 className="text-4xl font-bold text-slate-900">{selectedDist.name}</h1>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-400 font-semibold">Items Supplied</p>
                            <p className="text-2xl font-black text-slate-800">{products.length}</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <p>Loading catalog...</p>
                        ) : products.length > 0 ? (
                                products.map(product => <DistributorProduct item={product} showEditForm={()=>setProductToUpdate(product)} deleteProduct={removeDistributorProduct}/>)
                            ) : (
                            <div className="col-span-2 text-center py-20 bg-slate-100/50 rounded-3xl border-2 border-dashed border-slate-200">
                                <Package size={48} className="mx-auto mb-4 text-slate-300"/>
                                <p className="text-slate-500 font-medium">No products linked to this distributor.</p>
                            </div>
                        )}
                    </div>
                    {productToUpdate && ( 
                      <InventoryItemForm hideForm={()=>setProductToUpdate(null)} itemToEdit={productToUpdate} distributors={distributors} onSave={updateProductsUIWithSavedData}/> 
                    )}  
                </>
                ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                    <Truck size={64} className="mb-4 opacity-20" />
                    <p className="font-medium">Select a supplier to view their product catalog</p>
                </div>
                )}
            </div>
        </div>
      {distModalOpen && (
        <DistributorModal 
          dist={editingDist} 
          onClose={() => setDistModalOpen(false)} 
          onSave={updateDistributorsData} 
        />
      )}
    </section>
  )
}


