import { useState, useEffect, useContext } from 'react';
// import { Search, ShoppingCart, Trash2, CreditCard, Banknote, User, Scan } from 'lucide-react';
import { AxiosHttpRequest } from "../../App"
import { printReceipt, kickCashDrawer } from "./utils/printer"
import type { Product } from '../../../prisma/generated/client';
import { useBarcodeScanner } from "./hooks"
// client/utils/printer.ts



/**
 * Global listener for high-speed "Keyboard Emulation" scanners.
 */




const CheckoutScreen = () => {
  const [cart, setCart] = useState([]);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const TAX_RATE = 0.075;
  const api = useContext(AxiosHttpRequest)!
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);


      // CheckoutScreen.tsx
  const handleCloverPayment = async () => {
    setIsProcessing(true);
    
    // amount in cents: $54.20 -> 5420
    const result = await window.electron.invoke('trigger-clover-payment', {
      amount: Math.round(totalAfterTax * 100),
      orderId: `pos-${Date.now()}`
    });

    if (result.success) {
      alert("Payment Captured!");
      // clear cart, print receipt, etc.
    } else {
      alert(`Error: ${result.error}`);
    }
    setIsProcessing(false);
  };


  async function handleCashPayment() {
    setIsProcessing(true);
    setErrorMessage(null);

    const saleData = {
      total: subtotal,
      tax: tax,
      totalAfterTax: totalAfterTax,
      method: 'CASH',
      employeeName: 'Admin', // In production, get this from your Auth context
      items: cart
    };

    try {
      // 1. Send Sale to Backend
      const res = await api.post('api/sales', saleData);
      
      // 2. If backend succeeds, trigger hardware
      const printerIp = localStorage.getItem('printer_ip');
      if (printerIp) {
        // We pass the full sale data to the printer utility
        await printReceipt(printerIp, { ...saleData, id: res.data.id, createdAt: res.data.createdAt });
        await kickCashDrawer(printerIp);
      }

      // 3. Success UI
      setCart([]);
      alert("Sale Successful!");
    } catch (err) {
      // 4. Handle Axios or Hardware errors
      const msg = err.response?.data?.error || "Connection to server failed. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // 1. Load Inventory for the manual selection grid
  useEffect(() => {
    const fetchInventory = async () => {
      const { data } = await api.get('/api/inventory');
      setInventory(data.items);
    };
    fetchInventory();
  }, []);

  // 2. Helper to add item to cart (Shared by scanner and grid)
  const addToCart = (product: Product) => {
    setCart(currentCart => {
      const existing = currentCart.find(item => item.id === product.id);
      if (existing) {
        return currentCart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  // 3. Hardware Hook: Listen for global scans
  useBarcodeScanner(async (barcode) => {
    try {
      const { data: product } = await api.get(`/products/barcode/${barcode}`);
      if (product) addToCart(product);
    } catch (err) {
      console.error("Product not found via scan");
    }
  });

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const totalAfterTax = subtotal + tax;

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      
      {/* LEFT: INVENTORY BROWSER */}
      <div className="w-2/3 p-6 flex flex-col">
        <div className="mb-6">
          <input 
            type="text" 
            placeholder="Search products by name..." 
            className="w-full p-4 rounded-xl shadow-sm border-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 overflow-y-auto">
          {filteredInventory.map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition text-left flex flex-col justify-between h-32 border-b-4 border-transparent hover:border-blue-500"
            >
              <span className="font-bold text-slate-700">{product.name}</span>
              <span className="text-blue-600 font-bold">${product.price.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: CART & TOTALS */}
      <div className="w-1/3 bg-white shadow-2xl p-6 flex flex-col">
        <h2 className="text-2xl font-black mb-6 text-slate-800">New Sale</h2>
        
        <div className="flex-grow overflow-y-auto mb-6">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center mb-4 p-2 bg-slate-50 rounded-lg">
              <div>
                <p className="font-bold">{item.name}</p>
                <p className="text-sm text-slate-500">${item.price.toFixed(2)} x {item.quantity}</p>
              </div>
              <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div className="border-t pt-6 space-y-2">
          <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-slate-600"><span>Tax (7.5%)</span><span>${tax.toFixed(2)}</span></div>
          <div className="flex justify-between text-3xl font-black text-slate-900 pt-4"><span>Total</span><span>${totalAfterTax.toFixed(2)}</span></div>
        </div>

        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <button 
            onClick={handleCashPayment}
            disabled={isProcessing || cart.length === 0}
            className={`w-full text-white font-black py-5 rounded-2xl shadow-lg transition flex items-center justify-center
              ${isProcessing ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700 active:scale-95'}`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-3 border-t-2 border-white rounded-full" viewBox="0 0 24 24"></svg>
                PROCESSING...
              </>
            ) : 'CASH PAYMENT'}
          </button>
          <button className="w-full bg-slate-200 text-slate-400 font-bold py-4 rounded-2xl cursor-not-allowed">
            CLOVER FLEX
          </button>
        </div>
      </div>

    </div>
  );
};

export default CheckoutScreen;