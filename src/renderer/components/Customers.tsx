import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Phone, Mail, Award, Edit2, History, X, User, FileText, Save, Trash2 } from 'lucide-react';


const CustomerModal = ({ isOpen, onClose, onSave, customerToEdit }: any) => {
  const [loading, setLoading] = useState(false);
  const isEdit = !!customerToEdit;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData);

    const url = isEdit ? `/api/customers/${customerToEdit.id}` : '/api/customers';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSave();
        onClose();
      }
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800">{isEdit ? 'Edit Profile' : 'New Customer'}</h2>
            <p className="text-sm text-slate-500">Capture details for loyalty tracking</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition shadow-sm">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <User size={16} className="text-blue-500" /> First Name
              </label>
              <input name="firstName" defaultValue={customerToEdit?.firstName} required className="w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block">Last Name</label>
              <input name="lastName" defaultValue={customerToEdit?.lastName} required className="w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <Phone size={16} className="text-emerald-500" /> Phone
              </label>
              <input name="phone" defaultValue={customerToEdit?.phone} placeholder="(555) 000-0000" className="w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <Mail size={16} className="text-purple-500" /> Email
              </label>
              <input name="email" type="email" defaultValue={customerToEdit?.email} placeholder="hello@example.com" className="w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <FileText size={16} className="text-orange-500" /> Internal Notes
            </label>
            <textarea name="notes" defaultValue={customerToEdit?.notes} rows={3} className="w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Preferences, allergies, or special requests..." />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center justify-center gap-2">
              <Save size={18}/> {loading ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export function CustomerScreen() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch Logic
  const fetchCustomers = async () => {
    const res = await fetch(`/api/customers?search=${search}`);
    const data = await res.json();
    setCustomers(data);
  };

    const handleDeleteCustomer = async (id: number) => {
        const confirmed = window.confirm(
            "Are you sure? This will delete the customer profile permanently. Past sales history will remain but will no longer be linked to this person."
        );

        if (confirmed) {
            try {
            const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setSelectedCustomer(null);
                fetchCustomers();
            }
            } catch (err) {
            alert("Error deleting customer");
            }
        }
    };

  useEffect(() => { fetchCustomers(); }, [search]);

  return (
    <div className="flex h-full gap-6 bg-slate-50 p-6">
      {/* Sidebar: Customer List */}
      <div className="w-1/3 flex flex-col gap-4 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black flex items-center gap-2"><Users size={20}/> Directory</h2>
            <button 
              onClick={() => { setSelectedCustomer(null); setIsModalOpen(true); }}
              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              <Plus size={20}/>
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              placeholder="Search by name or phone..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {customers.map((c: any) => (
            <button 
              key={c.id}
              onClick={() => setSelectedCustomer(c)}
              className={`w-full p-4 flex items-center justify-between border-b border-slate-50 transition ${selectedCustomer?.id === c.id ? 'bg-blue-50 border-blue-100' : 'hover:bg-slate-50'}`}
            >
              <div className="text-left">
                <p className="font-bold text-slate-800">{c.firstName} {c.lastName}</p>
                <p className="text-xs text-slate-500">{c.phone || 'No phone'}</p>
              </div>
              <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                <Award size={14}/>
                <span className="text-xs font-bold">{c.loyaltyPoints}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main: Customer Profile Detail */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
        {selectedCustomer ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex justify-between items-start">
              <div className="flex gap-6 items-center">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center text-3xl font-black">
                  {selectedCustomer.firstName[0]}{selectedCustomer.lastName[0]}
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900">{selectedCustomer.firstName} {selectedCustomer.lastName}</h1>
                  <p className="text-slate-500 font-medium">Customer since {new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-3 bg-slate-100 rounded-2xl text-slate-600 hover:bg-slate-200 transition"><Edit2 size={20}/></button>
                <button className="p-3 bg-red-50 rounded-2xl text-red-600 hover:bg-red-100 transition"><Trash2 size={20}/></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <ContactInfo icon={<Phone/>} label="Phone Number" value={selectedCustomer.phone} />
              <ContactInfo icon={<Mail/>} label="Email Address" value={selectedCustomer.email} />
            </div>

            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex items-center justify-between">
              <div>
                <p className="text-orange-800 font-bold flex items-center gap-2 uppercase tracking-wider text-xs">
                  Loyalty Points Balance
                </p>
                <h2 className="text-4xl font-black text-orange-900 mt-1">{selectedCustomer.loyaltyPoints}</h2>
              </div>
              <Award size={48} className="text-orange-200" />
            </div>

            {/* Placeholder for Purchase History */}
            <div className="space-y-4 pt-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><History size={18}/> Recent Transactions</h3>
              <div className="text-center py-12 border-2 border-dashed rounded-3xl text-slate-400">
                Purchase history visualization coming soon...
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Users size={64} className="mb-4 opacity-20" />
            <p className="font-medium">Select a customer to view their details</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ContactInfo = ({ icon, label, value }: any) => (
  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
    <div className="p-2 bg-white rounded-xl shadow-sm text-blue-600">{icon}</div>
    <div>
      <p className="text-xs text-slate-400 font-bold uppercase">{label}</p>
      <p className="font-bold text-slate-800">{value || 'N/A'}</p>
    </div>
  </div>
);