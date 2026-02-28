import { useState, useEffect, useContext, useRef } from 'react';
import { Trash2, Minus, Plus, User, PackageOpen, AlertCircle, X } from 'lucide-react';
import { AxiosHttpRequest } from "../../App"
import { printReceipt, kickCashDrawer } from "./utils/printer"
import type { Product, Customer } from '../../../prisma/generated/client';
import { useBarcodeScanner } from "./hooks"
import SuccessToast from "./SalesToast"
import { type NonSensitiveUserData }  from "./../../App"
import { GeneralProgramSettings } from "../../App"

// client/utils/printer.ts


function CustomerSelection({selectCustomerMain} : {selectCustomerMain: (customer: Customer|null) => void}) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer|null>(null);
  const [customers, setCustomers] = useState<Customer[]|null>(null)
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const api = useContext(AxiosHttpRequest)!

  async function fetchCustomers() {
    const res = await api.get(`/api/customers?search=${customerSearch}`);
    if (res.status === 200) {
      if (res.data.length > 0) {
        setCustomers(res.data);
      }
    }
  };

  useEffect(() => {
    if (!customers) {
      fetchCustomers();  
    }
    selectCustomerMain(selectedCustomer)
  }, [selectedCustomer])
  return (
    <div className="relative">
      {selectedCustomer ? (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
          <User className="w-5 h-5 text-blue-600" />
          <div className="text-sm">
            <div className="font-medium text-blue-900">{selectedCustomer.firstName} {selectedCustomer.lastName}</div>
            <div className="text-blue-600">{selectedCustomer.loyaltyPoints} points</div>
          </div>
          <button
            onClick={()=>setSelectedCustomer(null)}
            className="ml-2 text-blue-600 hover:text-blue-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowCustomerSearch(!showCustomerSearch)}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <User className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium">Select Customer</span>
        </button>
      )}   
      {/* Customer Search Dropdown */}
      {showCustomerSearch && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-3 border-b border-gray-200">
            <input
              disabled={!customers}
              type="text"
              placeholder={customers ? "Search customer..." : "Nothing to Search"}
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {customers ? customers.map(customer => (
              <button
                key={customer.id}
                onClick={() => {setSelectedCustomer(customer); setShowCustomerSearch(false)}}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
              >
                <div className="font-medium text-gray-900">{customer.firstName} {customer.lastName}</div>
                <div className="text-sm text-gray-600">{customer.loyaltyPoints} points available</div>
              </button>
            )) : <p className="p-4 text-gray-700">No customers have been registered yet</p> }
          </div>
        </div>
      )}
    </div>
  )
}


function InventoryNetworkError() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h3>
      <p className="text-gray-600 text-center max-w-md">
        Unable to load products. Please check your network connection and try again.
      </p>
      <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Retry
      </button>
    </div>
  )
}


function EmptyInventory({searchQuery, setSearchQuery}: {searchQuery: string, setSearchQuery: (newQuery: string)=>void}) {
  return  (<>
    <h1 className="text-2xl font-bold text-slate-900 pt-4 px-4">Products In Inventory</h1>
    <div className="flex flex-col items-center justify-start h-full p-4">
      <input 
        type="text" 
        placeholder="Search products by name..." 
        className="w-full p-4 rounded-xl shadow-sm border-none focus:ring-2 focus:ring-blue-500 bg-white"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <PackageOpen className="w-25 h-25 text-gray-400 mt-[30vh]" />
      <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Products Found</h3>
      {searchQuery && <p className="text-gray-600">Try adjusting your search criteria</p>}
    </div>
  </>)
}


export interface CartItem extends Product {
  quantity: number;
}


async function pollForLatestPaymentOnClover(amount: number, merchantId: string, apiToken: string, timeoutObjRef: {current: number}, paymentCutoffTime: number) {
  if (timeoutObjRef.current === 0) { // request cancelled
    return "Cancelled"
  }

  if (Date.now() > timeoutObjRef.current) {
    return "Request timed out";
  }

  const response = await fetch(`https://api.clover.com/v3/merchants/${merchantId}/orders?orderBy=createdTime DESC&limit=1`, {
    headers: {"Authorization": `Bearer ${apiToken}`}
  })

  if (response.status === 200) {
    const resBody = await response.json()
    if (resBody.elements[0].createdTime >= paymentCutoffTime && (resBody.elements[0].total/100) === amount) {
      return "Payment found"
    }else {
      return await pollForLatestPaymentOnClover(amount, merchantId, apiToken, timeoutObjRef, paymentCutoffTime)
    }
  }else {
    return "Clover Payment Request Failed"
  }
}

function updateInventory(cart: CartItem[], currInventory: Product[]) {
  function getProductInCart(cart: CartItem[], item: Product){
    for (const product of cart) {
      if (product.name === item.name) {
        return product;
      }
    }
    return null;
  }


  const newInventory: Product[] = [] ;
  for (let item of currInventory) {
    item = {...item}
    const cartItem = getProductInCart(cart, item)
    if (cartItem)
      item.stockCount -= cartItem.quantity
    newInventory.push(item);
  }
  return newInventory;
}

const CheckoutScreen = ({ user, goToSettings } : {user: NonSensitiveUserData, goToSettings: ()=>void}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const TAX_RATE = 0.13;
  const api = useContext(AxiosHttpRequest)!
  const [isProcessing, setIsProcessing] = useState<'CLOVER'|'CASH'|''>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastSaleId, setLastSaleId] = useState<number|null>(null)
  const [saleCustomer, setSaleCustomer] = useState<Customer|null>(null)
  const [loyaltyDiscount, setLoyaltyDiscount]  = useState(0)
  const [inventoryReqTracker, setInventoryReqTracker] = useState("loading")
  const paymentPollTimeout = useRef(0)
  const softwareConfig = useContext(GeneralProgramSettings)!;

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax - loyaltyDiscount;

  function updateInventoryUI(cart: CartItem[]) {
    const newInventory = updateInventory(cart, inventory);
    setInventory(newInventory);
  }

  async function saveTransactionToDb(paymentMethod: 'CASH'|'CLOVER') {
    const saleData: any = {
      subTotal: subtotal,
      tax: tax,
      total,
      loyaltyDiscount,
      paymentMethod,
      employeeName: user.username,
      items: cart
    };

    if (saleCustomer) {
      saleData.customerId = saleCustomer.id
    }

    api.post('api/sales', saleData)
    .then(async (response) => {
      setLastSaleId(response.data.saleId);
      // print receipt
      printReceipt(softwareConfig.starPrinterIP, { ...saleData, id: response.data.saleId, createdAt: response.data.createdAt }, softwareConfig.storeName)
      .then(res => {
        if (!res.ok){
          alert(`Unexpected Error ${res.status} while trying to print. Please make sure the printer is connected and properly configured in this software's settings`)
        }
      })
      .catch(err => {
        console.log(err); 
        alert("Unexpected Error while trying to print. Please make sure the printer is connected and properly configured in this software's settings")
      })
      updateInventoryUI(cart)
      setCart([]);
    })
    .catch(error => {
      console.log("B", error)
      const msg = error.response?.data?.error || "Unexpected Error. Please try again.";
      setErrorMessage(msg);
    }).finally(() => setIsProcessing(''))
  }

  async function handleCloverPayment() {
    setIsProcessing('CLOVER');
    setErrorMessage('');
    let lastPaymentTimestamp = 0;

    if (saleCustomer && (loyaltyDiscount > saleCustomer.loyaltyPoints/100)) {
      setErrorMessage(`Discount value can not be greater than $${saleCustomer.loyaltyPoints/100}!`);
      setIsProcessing('');
      return;
    }else if (saleCustomer && (saleCustomer.loyaltyPoints/100 > 100)) {
      setErrorMessage(`Discount value can not be greater than total!`);
      setIsProcessing('');
      return;
    }

    try {
      const response = await fetch(`https://api.clover.com/v3/merchants/${softwareConfig.cloverMerchantId}/orders?orderBy=createdTime DESC&limit=1`, {
        headers: {"Authorization": `Bearer ${softwareConfig.cloverAccessToken}`}
      })
      if (response.status === 200) {
        const resBody = await response.json()
        lastPaymentTimestamp = resBody.elements[0].createdTime;
      }else {
        setErrorMessage("Clover Payment Request Failed")
      }
    }catch(error) {
      console.log(error);
      setErrorMessage("Clover Payment Request Failed")
    }

    paymentPollTimeout.current = Date.now() + 180000 // 3 minutes from the current time
    const response = await pollForLatestPaymentOnClover(total, softwareConfig.cloverMerchantId, softwareConfig.cloverAccessToken, paymentPollTimeout, lastPaymentTimestamp)
    if (response === "Payment found") {
      saveTransactionToDb('CLOVER')
      setIsProcessing('')
    }else if (response !== "Cancelled"){
      setErrorMessage(response)
    }
  };

  async function handleCashPayment() {
    setIsProcessing('CASH');
    setErrorMessage('');

    if (saleCustomer && (loyaltyDiscount > saleCustomer.loyaltyPoints/100)) {
      setErrorMessage(`Discount value can not be greater than $${saleCustomer.loyaltyPoints/100}!`);
      setIsProcessing('');
      return;
    }else if (saleCustomer && (saleCustomer.loyaltyPoints/100 > 100)) {
      setErrorMessage(`Discount value can not be greater than total!`);
      setIsProcessing('');
      return;
    }
    await kickCashDrawer(softwareConfig.starPrinterIP) //(open cash drawer). If possible, check the cash has been saved before saving to the db
    saveTransactionToDb('CASH')
  };

  useEffect(() => {
    if (!saleCustomer){
      setLoyaltyDiscount(0);
    }
  }, [saleCustomer])


  // 1. Load Inventory for the manual selection grid
  useEffect(() => {
    if (inventoryReqTracker === "loading") {
      api.get('/api/inventory')
      .then(response => {
        setInventory(response.data.items);
        setInventoryReqTracker("success")
      })
      .catch(err => {
        console.error(err)
        setInventoryReqTracker("failed")
      })
    }
    
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

  function incrementQuantity(product: Product) {
    setCart(currentCart => {
      return currentCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
    });
  }

  function decrementQuantity(product: Product) {
    const newCart = [];
    for (const item of cart) {
      if (item.id === product.id){
        if (item.quantity === 1){
          continue
        }
        item.quantity -= 1
      }
      newCart.push(item)
    }
    setCart(newCart);
  }

  function removeItemFromCart(itemId: number) {
    setCart(cart.filter(item => item.id !== itemId));
  }

  function updateDiscount(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.value) {
      return;
    }
    const numberValue = parseFloat(e.target.value)
    if (total > 0 && numberValue <= total) {
      setLoyaltyDiscount(numberValue)
    }
  }

  function cancelCloverPayment() {
    paymentPollTimeout.current = 0;
    setErrorMessage('')
    setIsProcessing('')
  }

  // 3. Hardware Hook: Listen for global scans
  useBarcodeScanner(async (barcode) => {
    try {
      const { data: product } = await api.get(`/products/barcode/${barcode}`);
      if (product) addToCart(product);
    } catch (err) {
      console.error("Product not found via scan");
    }
  });


  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (inventoryReqTracker === "loading") {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="border-4 border-gray-900 w-20 h-20 border-b-gray-400 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (inventoryReqTracker === "failed") {
    return <InventoryNetworkError/>
  }

  if (inventoryReqTracker === "success" && filteredInventory.length === 0) {
    return <EmptyInventory searchQuery={searchQuery} setSearchQuery={setSearchQuery}/>
  }

  return (
    <div className="flex h-screen bg-slate-100">
      
      {/* LEFT: INVENTORY BROWSER */}
      <div className="w-2/3 p-6 flex flex-col">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Products In Inventory</h1>
        <div className="mb-6">
          <input 
            type="text" 
            placeholder="Search products by name..." 
            className="w-full p-4 rounded-xl shadow-sm border-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 overflow-y-auto pr-2">
          {filteredInventory.map(product => (
            <button 
              disabled={product.stockCount === 0}
              key={product.id}
              onClick={() => addToCart(product)}
              className="cursor-pointer bg-white p-4 rounded-xl shadow-sm transition text-left flex flex-col justify-between h-32 border-2 border-transparent hover:bg-blue-50/50 hover:border-blue-200"
            >
              <span className="font-bold text-slate-700">{product.name}</span>
              <div className="flex items-center justify-between">
                <span className="text-blue-600 font-bold">${product.price.toFixed(2)}</span>
                <span className="text-gray-600">{product.stockCount} in stock</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: CART & TOTALS */}
      <div className="w-1/3 bg-white shadow-lg border-t-1 border-t-gray-200 flex flex-col">
        <div className="border-b border-gray-300 flex justify-between items-center px-4 py-2">
          <h2 className="text-2xl font-bold text-slate-800">New Sale</h2>
          <CustomerSelection selectCustomerMain={setSaleCustomer}/>
        </div>
        
        <div className="flex-grow overflow-y-auto mb-6 pt-4">
          {cart.map(item => (
            <div key={item.id} className="text-sm text-slate-800 mb-4 p-2 bg-slate-50 rounded-lg mx-4">
              <div className='flex justify-between items-center'>
                <p className="font-bold">{item.name}</p>
                <button className="cursor-pointer hover:bg-red-100 p-2 rounded-full text-red-600" onClick={() => removeItemFromCart(item.id)}>
                  <Trash2 size={20}/>
                </button>
              </div>
              <button onClick={()=>incrementQuantity(item)} className="bg-white border-1 border-slate-200 text-blue-600 font-semibold p-1 rounded-md cursor-pointer">
                <Plus size={18}/>
              </button>
              <button onClick={()=>decrementQuantity(item)} className="bg-white border-1 border-slate-200 text-blue-600 font-semibold p-1 rounded-md cursor-pointer ml-2">
                <Minus size={18} />
              </button>
              <div className="flex justify-between items-centre">
                <p>${item.price.toFixed(2)} x {item.quantity}</p>
                <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-300 pt-6 space-y-2 px-4">
          <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-slate-600"><span>Tax (13%)</span><span>${tax.toFixed(2)}</span></div>
          {saleCustomer && (
            <div className="flex justify-between text-slate-600">
              <span>Loyalty Discount Max(${saleCustomer.loyaltyPoints/100})</span>
              <input type="number" placeholder='$'
                className="w-15 border border-gray-300 rounded-lg px-1" 
                onChange={updateDiscount}
                disabled={saleCustomer.loyaltyPoints/100 === 0} 
                value={loyaltyDiscount}/>
            </div>
          )}
          <div className="flex justify-between text-3xl font-bold text-slate-900 pt-4 px-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
        </div>

        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4 mx-4">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        )}

        <div className="mt-8 mb-4 space-y-4 px-4">
          <button 
            onClick={handleCashPayment}
            disabled={!!isProcessing || cart.length === 0}
            className={`w-full text-white font-black py-5 rounded-2xl shadow-lg transition flex items-center justify-center cursor-pointer disabled:cursor-not-allowed
              ${isProcessing ? 'bg-green-600/60' : 'bg-green-600 hover:bg-green-700 active:scale-95'}`}
          >
            {isProcessing === 'CASH' ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-3 border-t-2 border-white rounded-full" viewBox="0 0 24 24"></svg>
                PROCESSING...
              </>
            ) : 'CASH PAYMENT'}
          </button>
          {isProcessing === 'CLOVER' && (
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col justify-center bg-white px-4 py-6 rounded-xl min-w-100 text-center">
                <img src="./clover-icon.svg" className="block w-6 mx-auto mb-4"/>
                {errorMessage ? <p className="text-red-700">{errorMessage}</p> : 
                  <div className="flex justify-between items-center gap-2 text-green-600">
                    <p>Waiting for the clover device to process payment of ${total}</p>
                    <span className="block border-4 border-green-700 w-6 h-6 border-b-green-400 rounded-full animate-spin"></span>
                  </div>
                }
                <div className="flex justify-center">
                  {errorMessage && <button className="cursor-pointer bg-green-500 text-white py-1 px-4 rounded-lg w-fit mx-auto mt-4" onClick={handleCloverPayment}>Retry</button>}
                  <button className="cursor-pointer bg-red-500 text-white py-1 px-4 rounded-lg w-fit mx-auto mt-4" onClick={cancelCloverPayment}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          <button className={`
            w-full hover:bg-green-50 disabled:bg-gray-100 disabled:cursor-not-allowed bg-white border-2 border-[#280] 
            text-[#280] font-bold py-4 rounded-2xl cursor-pointer flex items-center justify-center gap-2`} 
            onClick={handleCloverPayment} 
            disabled={!!isProcessing || cart.length === 0 || !softwareConfig.cloverAccessToken}>
            <img src="./clover-icon.svg" className="block w-6"/>
            <span>CLOVER FLEX</span>
          </button>
          {!softwareConfig.cloverAccessToken && (
            <p className="text-red-600 ">
              Invalid Clover config. Please <button onClick={goToSettings} className="underline cursor-pointer font-semibold">update settings</button>
            </p>
          )}
        </div>
      </div>
      <SuccessToast saleId={lastSaleId}/>
    </div>
  );
};

export default CheckoutScreen;
