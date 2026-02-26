import React, { useState, useEffect, useContext } from 'react';
import { 
  Plus, X, DollarSign, Calendar, Tag, AlignLeft, Filter, ArrowUpRight, ArrowDownRight, Trash2, Edit3 
} from 'lucide-react';
import { AxiosHttpRequest } from "../../App";

interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  note: string;
  deleted: boolean;
}


function AddExpenseModal({ isOpen, onClose, onSave, expenseToEdit } : {
  isOpen: boolean, onClose: ()=>void, onSave: ()=>void, expenseToEdit: Expense|null
}) {
  const [loading, setLoading] = useState(false);
  const api = useContext(AxiosHttpRequest)!

  const isEdit = !!expenseToEdit;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    const url = isEdit 
      ? `/api/expenses/${expenseToEdit.id}` 
      : '/api/expenses';
    // Ensure amount is a number
    const payload = {
      ...data,
      amount: parseFloat(data.amount as string),
      date: new Date(data.date as string).toISOString(),
    };
    console.log(payload)

    try {
      const res = await api.post(url, {
        data: payload
      });

      if (res.status === 200) {
        onSave();
        onClose();
      }
    } catch (error) {
      console.error("Failed to save expense", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800">{isEdit ? 'Edit Record' : 'Record Expense'}</h2>
            <p className="text-sm text-slate-500">Add a new outgoing cost to the ledger</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition shadow-sm cursor-pointer">
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Main Title */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <AlignLeft size={16} className="text-blue-500" /> Expense Title *
            </label>
            <input 
              name="title" 
              required 
              placeholder="e.g., Monthly Shop Rent"
              defaultValue={expenseToEdit?.title || ""} 
              className="w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <DollarSign size={16} className="text-emerald-500" /> Amount *
              </label>
              <input 
                name="amount" 
                type="number" 
                step="0.01" 
                required 
                placeholder="0.00" 
                defaultValue={expenseToEdit?.amount || ""} 
                className="w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            {/* Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <Calendar size={16} className="text-purple-500" /> Date *
              </label>
              <input 
                name="date" 
                type="date" 
                defaultValue={expenseToEdit?.date ? new Date(expenseToEdit.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} 
                required 
                className="w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <Tag size={16} className="text-orange-500" /> Category
              </label>
              <input 
                name="category" 
                type="text" 
                defaultValue={expenseToEdit?.category || ""} 
                placeholder="E.g. Utilities." 
                className="w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-md shadow-gray-200 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Saving..." : "Save Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function  ExpensesManager() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState({ sales: 0, expensesTotal: 0 });
  const [filterDate, setFilterDate] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null); // Holds item being edited
  const api = useContext(AxiosHttpRequest)!

  useEffect(() => {
    fetchExpenses()
  }, [filterDate])

  const fetchExpenses = async () => {
    const res = await api.get(`/api/expenses?month=${filterDate.month}&year=${filterDate.year}`);
    const data = await res.data; // transactionCount is available too
    setExpenses(data.expenses);
    setSummary({sales: data.revenue, expensesTotal: data.expensesTotal})
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to remove this expense record?")) {
      await api.delete(`/api/expenses/${id}`);
      fetchExpenses(); // Refresh list
    }
  };

  const openEditModal = (expense: any) => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  // 1. Profit/Loss Logic
  const profit = summary.sales - summary.expensesTotal;
  const isProfitable = profit >= 0;

  return (
    <section className="space-y-6 p-4">
      <h1 className="text-3xl font-bold text-slate-900">Expenses</h1>
      {/* SECTION: Profit/Loss Overview */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Sales</p>
          <div className="flex items-center gap-2 mt-2">
            <h2 className="text-3xl font-black text-slate-900">${summary.sales.toLocaleString()}</h2>
            <ArrowUpRight className="text-emerald-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Expenses</p>
          <div className="flex items-center gap-2 mt-2">
            <h2 className="text-3xl font-black text-slate-900">${summary.expensesTotal.toLocaleString()}</h2>
            <ArrowDownRight className="text-red-500" />
          </div>
        </div>

        <div className={`p-6 rounded-3xl border shadow-sm ${isProfitable ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
          <p className={`text-sm font-medium uppercase tracking-wider ${isProfitable ? 'text-emerald-600' : 'text-red-600'}`}>
            Estimated {isProfitable ? 'Profit' : 'Loss'}
          </p>
          <h2 className={`text-3xl font-black mt-2 ${isProfitable ? 'text-emerald-700' : 'text-red-700'}`}>
            {isProfitable ? '' : '-'}${Math.abs(profit).toLocaleString()}
          </h2>
        </div>
      </div>

      {/* SECTION: Filters & Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select 
              value={filterDate.month}
              onChange={(e) => setFilterDate({...filterDate, month: parseInt(e.target.value)})}
              className="bg-slate-50 border-none rounded-lg font-semibold text-slate-700"
            >
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                <option key={m} value={i+1}>{m}</option>
              ))}
            </select>
            <select 
              value={filterDate.year}
              onChange={(e) => setFilterDate({...filterDate, year: parseInt(e.target.value)})}
              className="bg-slate-50 border-none rounded-lg font-semibold text-slate-700"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        
        <button  onClick={() => setIsModalOpen(true)} 
          className="cursor-pointer bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} /> Add New Expense
        </button>
      </div>

      {/* SECTION: Ledger View */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Title/Reason</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 text-sm font-medium">{new Date(exp.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">{exp.title}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">{exp.category}</span>
                </td>
                <td className="px-6 py-4 text-right font-black text-red-500">-${exp.amount.toFixed(2)}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button className="cursor-pointer p-2 text-slate-400 hover:text-blue-600" onClick={() => openEditModal(exp)}><Edit3 size={16}/></button>
                    <button className="cursor-pointer p-2 text-slate-400 hover:text-red-600" onClick={() => handleDelete(exp.id)}><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddExpenseModal 
        isOpen={isModalOpen} 
        expenseToEdit={selectedExpense} // Pass existing data if editing
        onClose={() => {
          setIsModalOpen(false);
          setSelectedExpense(null);
        }} 
        onSave={fetchExpenses} 
      />
    </section>
  );
};