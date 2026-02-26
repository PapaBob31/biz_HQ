import { useState, useEffect, useContext } from "react";
import { DenominationRow, type Denomination } from "./CashIn"
import { AxiosHttpRequest } from '../../App';
import { AlertCircle, BanknoteX, Loader2 } from "lucide-react";

const DENOMINATIONS: Denomination[] = [
  { label: "$100 Bill", value: 100, key: "hundreds", quantity: 0 },
  { label: "$50 Bill", value: 50, key: "fifties", quantity: 0 },
  { label: "$20 Bill", value: 20, key: "twenties", quantity: 0 },
  { label: "$10 Bill", value: 10, key: "tens", quantity: 0 },
  { label: "$2 Coins", value: 5, key: "fives", quantity: 0 },
  { label: "$1 Coins", value: 1, key: "ones", quantity: 0 },
  { label: "Quarter", value: 0.25, key: "quarters", quantity: 0 },
  { label: "Dime", value: 0.10, key: "dimes", quantity: 0 },
  { label: "Nickel", value: 0.05, key: "nickels", quantity: 0 },
];


export default function CashOut() {
  const [denominations, setDenominations] = useState<Denomination[]>(DENOMINATIONS)
  const [initialCashIn, setInitialCashIn] = useState<null|number>(0);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [cashTakenIn, setCashTakenIn] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingLocal, setLoadingLocal] = useState(false);
  const api = useContext(AxiosHttpRequest)!

  function getCashFlowData(local: boolean) {
    if (local)
      setLoadingLocal(true);

    Promise.all([
      api.get('/api/business-analytics/quick-stats'),
      api.get('api/cash-in-today')
    ])
    .then(async ([res1, res2]) => {
      setCashTakenIn(res1.data.todayRevenue)
      if (res2.data.data)
        setInitialCashIn(res2.data.data.cashInTotal);
      else
        setInitialCashIn(null)
    })
    .catch(error => {
      console.log(error.response.data);
      setError("An internal Server Error Occurred. Please try again")
    })
    .finally(() => {
      setLoading(false)
      setLoadingLocal(false)
    })
  }

  useEffect(() => {
    if (!loading)
      return;

    getCashFlowData(false);
  }, [loading])

  function updateDenominationQuantity(label: string, newQuantity: number) {
    const newDenominations = [...denominations]
    const denominationToUpdate = newDenominations.find((denomination)=>denomination.label === label)
    denominationToUpdate!.quantity = newQuantity;
    let currentTotal  = 0;
    for (let d of newDenominations) {
      currentTotal += (d.value * d.quantity) 
    }
    setTotal(currentTotal)
    if (denominationToUpdate) {
      setDenominations(newDenominations);
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500">
      <Loader2 className="animate-spin mb-2" size={32} />
      <p>Syncing stock data...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full text-gray-800 p-8">
      <BanknoteX size={200} className="text-red-300"/>
      <h1 className="text-4xl text-slate-700 font-bold mt-4">Unexpected Error</h1>
      <p className="font-semibold mt-1 text-lg text-center">{error}</p>
      <button onClick={() => { setError(""); setLoading(true) }} 
        className="mt-4 px-5 py-1 text-lg bg-blue-600 text-white rounded-md cursor-pointer">
        Retry
      </button>
    </div>
  );

  
  if (initialCashIn === null) {
    return (
      <div className="bg-white rounded-xl p-10 max-w-sm text-center shadow-lg mx-auto mt-30">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={48} />
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-2">Cash In Required</h3>
        <p className="text-slate-500 mb-8">You haven't recorded the starting cash for today. Please do this to ensure accuracy of sales data.</p>
    </div>
    );
  }

  return (
    <section className="p-8">
      <h1 className="text-4xl font-bold text-slate-800">Cash Out</h1>
      <p className="text-slate-500">Check what's currently in the drawer. Click "Check Acuraccy". If it looks right, close and sign out</p>
      <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg overflow-hidden mt-8">
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {DENOMINATIONS.map((d) => (
            <DenominationRow details={d} updateQuantity={updateDenominationQuantity} />
          ))}
        </div>

        <div className="p-6 bg-slate-100 flex gap-4">
          <button className="flex-1 bg-slate-300 py-4 rounded-xl font-bold cursor-pointer">OPEN DRAWER</button>
          <button onClick={()=>getCashFlowData(true)} className="flex-1 flex justify-center gap-2 bg-emerald-600 text-white py-4 rounded-xl font-bold cursor-pointer">
            {loadingLocal && <span className="block w-6 h-6 rounded-full border-4 border-b-gray-300 border-white animate-spin"></span>}
            CHECK ACCURACY
          </button>
        </div>
      </div>
      <div className="max-w-3xl mx-auto flex items-center justify-between p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors">
        <div className="font-bold text-xl">Counted Cash</div>
        <div className="text-3xl font-mono text-emerald-400">${total.toFixed(2)}</div>
      </div>
      <div className="max-w-3xl mx-auto px-3">
        <div className="flex justify-between">
          <span className="text-lg text-gray-800">Cash-Out Check:</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-lg text-gray-800">Opening Cash</span>
          <span>${initialCashIn.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-lg text-gray-800">Cash Taken in</span>
          <span>${cashTakenIn.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-lg text-gray-800">Expected Cash</span>
          <span>${(cashTakenIn + initialCashIn).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-lg text-gray-800">Counted Cash</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-lg text-gray-800">Over / Short</span>
          <span className={`${(cashTakenIn + initialCashIn) <= total ? "text-green-500" : "text-red-400"}`}>
            {(cashTakenIn + initialCashIn) <= total ?  "OVER" : "UNDER" }
          </span>
        </div>
      </div>
    </section>
  );
};