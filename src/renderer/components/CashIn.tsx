import { useState, useContext, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { AxiosHttpRequest } from "../../App";
import { type NonSensitiveUserData }  from "./../../App"
import { BanknoteX } from "lucide-react";

export function CashInReminder({ isOpen, goToCashIn, close } : {isOpen: boolean, goToCashIn: ()=>void, close: ()=>void}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-10 max-w-sm text-center shadow-2xl">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={48} />
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-2">Cash In Required</h3>
        <p className="text-slate-500 mb-8">You haven't recorded the starting cash for today. Please do this to ensure acuraccy of sales data.</p>
      </div>
    </div>
  );
};


function CashInSuccessToast({ closeSelf } : {closeSelf : ()=>void}) {

  setTimeout(() => {
    closeSelf()
  }, 1500)

  return (
      <>
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
          <div className="flex items-center gap-3 bg-blue-200 border-2 border-blue-300 text-blue-500 rounded-lg shadow-lg px-4 py-3 animate-fade-in">
            <span className="font-medium text-blue-900">Cash in Details Updated succesfully</span>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
              animation: fadeIn 0.3s ease-out;
          }
        `}</style>
      </>
  )
}


export interface Denomination {
  label: string,
  value: number,
  key: string,
  quantity: number
}

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

export function DenominationRow({ details, updateQuantity }: {details: Denomination,  updateQuantity: (label: string, newQuantity: number) => void}) {
  return(
    <div className="flex items-center justify-between p-3 border-b border-slate-100 transition-colors">
      <div>
        <span className="font-semibold text-lg">{details.label}</span>
        <div className="text-gray-600">${details.value} each</div>
      </div>
      <input
          type="number"
          min="0"
          className="w-1/4 p-2 outline-gray-300 rounded-md text-center outline-2 focus:outline-blue-500"
          value={details.quantity}
          onChange={(e) => updateQuantity(details.label, Number(e.target.value ? e.target.value : '0'))}
          placeholder="0"
      />
      <span className="w-1/3 text-right font-mono font-bold text-slate-900">
        ${(details.quantity * details.value).toFixed(2)}
      </span>
    </div>
  )
};

function formartTimestamp(date: Date){
  const options = {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  } as const;

  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  } as const;

  const datePart = date.toLocaleDateString('en-US', options);
  const timePart = date.toLocaleTimeString('en-US', timeOptions);

  return `${datePart}, ${timePart}`;
};



export default function CashIn({employee} : {employee: NonSensitiveUserData}) {
  const [denominations, setDenominations] = useState<Denomination[]>(DENOMINATIONS)
  const [processingSave, setProcessingSave] = useState(false)
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState({lastUpdated: "", employee: ""})
  const [toastVisible, setToastVisible] = useState(false)
  const [error, setError] = useState("");
  const api = useContext(AxiosHttpRequest)!
  console.log(meta)


  function getAndDisplayExistingCashInDetails() {
    api.get('/api/cash-in-today')
    .then(response => {
      if (response.data.data) {
        const {cashInTotal, createdAt, employeeName, denominations} = response.data.data
        setDenominations(denominations);
        setMeta({lastUpdated: createdAt, employee: employeeName})
        setTotal(cashInTotal)
      }
    })
    .catch(error => {
      console.log(error.response);
      setError("An internal Server Error Occurred. Please try again")
    })
  }

  useEffect(() => {
    getAndDisplayExistingCashInDetails();
  }, [])


  const handleSave = async () => {
    setToastVisible(true);
    setProcessingSave(true)
    api.post('/api/cash-in-today', {employeeName: employee.username, cashInTotal: total, denominations})
    .then(() => {
      setToastVisible(true)
    })
    .finally(() => {
      setProcessingSave(false)
    })
  };

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

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full text-gray-800 p-8">
      <BanknoteX size={200} className="text-red-300"/>
      <h1 className="text-4xl text-slate-700 font-bold mt-4">Unexpected Error</h1>
      <p className="font-semibold mt-1 text-lg text-center">{error}</p>
      <button onClick={() => { setError(""); getAndDisplayExistingCashInDetails()}} 
        className="mt-4 px-5 py-1 text-lg bg-blue-600 text-white rounded-md cursor-pointer">
        Retry
      </button>
    </div>
  );

  return (
    <section className="p-8">
      <h1 className="text-4xl font-bold text-slate-800">Cash In</h1>
      <p className="text-slate-500">input Starting Cash Balance for today</p>
      {meta.lastUpdated && (
        <p className="mt-2">Last updated at <span className="text-blue-600">
        {formartTimestamp(new Date(meta.lastUpdated))}</span> by <span className="font-semibold">{meta.employee}</span>
      </p>)}
      <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg overflow-hidden mt-4">
        <div className="p-4 max-h-[65vh] overflow-y-auto">
          {denominations.map((d) => (
            <DenominationRow details={d} updateQuantity={updateDenominationQuantity}
            />
          ))}
        </div>
      </div>
      <div className="max-w-3xl mx-auto flex items-center justify-between p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors">
        <div className="font-bold text-slate-600">GRAND TOTAL</div>
        <div className="text-3xl font-mono text-emerald-400">${total.toFixed(2)}</div>
      </div>
      <div className="max-w-3xl mx-auto mt-4">
        {processingSave ?
          <button disabled className="w-full flex justify-center items-center gap-2 bg-blue-500 text-white py-2 rounded-lg font-bold cursor-pointer">
            <span className="block w-6 h-6 rounded-full border-4 border-b-gray-300 border-white animate-spin"></span>
            <span>SAVE</span>
          </button>
        :
          <button onClick={handleSave} disabled={toastVisible} 
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold cursor-pointer">SAVE</button>
        }
      </div>
      {toastVisible && <CashInSuccessToast closeSelf={() => setToastVisible(false)}/>}
    </section>
  );
};


