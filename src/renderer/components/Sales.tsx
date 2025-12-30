import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Trash2, CreditCard, Banknote, User, Scan } from 'lucide-react';

const SalesScreen = () => {
  const [cart, setCart] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const cartEndRef = useRef<null | HTMLDivElement>(null);

  const checkPaymentStatus = (orderId: string) => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/clover/status/${orderId}`);
      const status = await res.json();
  
      if (status.paid) {
        clearInterval(interval);
        setWaitingForClover(false);
        completeSale(); // Finalize inventory and print receipt
      }
    }, 2000);
  };

  // 1. GLOBAL BARCODE LISTENER (Socket S700 Integration)
  useEffect(() => {
    let buffer = "";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (buffer) handleBarcodeScan(buffer);
        buffer = "";
      } else {
        if (e.key !== 'Shift') buffer += e.key;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  const handleBarcodeScan = (sku: string) => {
    const product = products.find(p => p.sku === sku);
    if (product) addToCart(product);
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleCloverPayment = async () => {
    setIsProcessing(true);
    try {
      // 1. First, create a "Pending Order" in our local DB
      const localOrder = await createLocalOrder(); 

      // 2. Send request to Clover Flex 3
      const response = await fetch('/api/clover/pay', {
        method: 'POST',
        body: JSON.stringify({ amount: total, orderId: localOrder.id })
      });

      if (response.ok) {
        // 3. Show a "Waiting for Customer" modal
        setWaitingForClover(true);
        
        // Start polling for payment success
        checkPaymentStatus(localOrder.id);
      }
    } catch (err) {
      alert("Could not reach Clover terminal.");
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.075; // 7.5% Tax
  const total = subtotal + tax;

  return (
    <div className="flex h-full gap-6 bg-slate-100 p-4">
      {/* LEFT: Product Discovery */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-4 text-slate-400" />
          <input 
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-none shadow-sm text-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Search by name, category or scan barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2">
          {products.map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition text-left border border-transparent hover:border-blue-300 group"
            >
              <div className="h-24 bg-slate-50 rounded-xl mb-3 flex items-center justify-center text-slate-300">
                <Scan size={32} />
              </div>
              <p className="font-bold text-slate-800 truncate">{product.name}</p>
              <p className="text-sm text-slate-500 mb-2">{product.category}</p>
              <div className="flex justify-between items-center">
                <span className="text-blue-600 font-bold">${product.price.toFixed(2)}</span>
                <span className="text-xs px-2 py-1 bg-slate-100 rounded-md">Stock: {product.stockCount}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Checkout Cart */}
      <div className="w-[400px] bg-white rounded-3xl shadow-xl flex flex-col overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="text-blue-600" /> Current Order
          </h2>
          <button onClick={() => setCart([])} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
            <Trash2 size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
              <div className="flex-1">
                <p className="font-bold text-sm truncate">{item.name}</p>
                <p className="text-xs text-slate-400">Unit: ${item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center font-bold">-</button>
                <span className="w-6 text-center font-bold">{item.quantity}</span>
                <button className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center font-bold">+</button>
              </div>
              <p className="font-bold w-16 text-right">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
          <div ref={cartEndRef} />
        </div>

        {/* Totals & Checkout */}
        <div className="p-6 bg-slate-50 border-t space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-slate-500"><span>Tax (7.5%)</span><span>${tax.toFixed(2)}</span></div>
            <div className="flex justify-between text-xl font-black text-slate-900 pt-2 border-t">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center justify-center gap-2 py-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-blue-500 transition">
              <Banknote className="text-emerald-600" />
              <span className="font-bold text-sm">Cash</span>
            </button>
            <button onClick={handleCloverPayment}
              className="flex flex-col items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition">
              <CreditCard />
              <span className="font-bold text-sm">Clover Pay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};