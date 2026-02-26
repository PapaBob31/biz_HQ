import { useState,  useContext } from 'react';
import {  ShieldCheck, Building2 } from 'lucide-react';
import { AxiosHttpRequest } from "../../App"
import { GeneralProgramSettings } from "../../App"


export default function CloverAuthScreen({refreshSettings} : {refreshSettings: ()=>void})  {
  const softwareConfig = useContext(GeneralProgramSettings)!
  const [merchantId, setMerchantId] = useState(softwareConfig.cloverMerchantId||'');
  const [apiToken, setApiToken] = useState(softwareConfig.cloverAccessToken||'')
  const [detailsValid, setDetailsValid] = useState(Boolean(softwareConfig.cloverMerchantId && softwareConfig.cloverAccessToken));
  const [validating, setDetailsIsValidating] = useState(false);
  const [error, setError] = useState('')
  const api = useContext(AxiosHttpRequest)!

  function validateDetails() {
    setDetailsIsValidating(true);
    fetch(`https://api.clover.com/v3/merchants/${merchantId}`, {
      headers: {"Authorization": `Bearer ${apiToken}`}
    })
    .then(response => {
      if (response.status === 200) {
        api.put('/api/business-details', {cloverAccessToken: apiToken, cloverMerchantId: merchantId })
        .catch(error => {
          setError("Unexpected Error! Please check your internet connection and try again")
          console.log(error)
        })
        .finally(() => {
          setDetailsValid(true)
          refreshSettings();
        })
      }else {alert("Clover credentials could not be validated!")}
    })
    .catch(error => {
      setError("Unexpected Error! Please check your internet connection and try again")
      console.log(error)
    })
    .finally(()=>{
      setDetailsIsValidating(false)
    });
  }


  return (
    <div className="flex justify-center">
      <div className="w-full bg-white overflow-hidden">
        <div className="text-[#280] p-8 text-center flex flex-col items-center">
          <img src="./clover-icon.svg" className="block mb-4 w-15"/>
          <h1 className="text-xl">Add your Clover authentication details</h1>
          {error && <p className="text-red-500 text-center p-2 rounded-lg bg-red-200 mt-2">{error}</p>}
        </div>

        <div className="space-y-6 max-w-2xl mx-auto">
          <div>
            <label className="block text-sm font-bold uppercase mb-1">Api Token</label>
            <div className="flex items-center border-2 border-slate-200 focus-within:border-green-600 px-3 rounded-xl border border-slate-200">
              <ShieldCheck size={18} className="text-slate-400 mr-2" />
              <input 
                className="text-slate-700 font-mono outline-none py-3 w-full" 
                value={apiToken} 
                onChange={(e)=>{setApiToken(e.target.value); setDetailsValid(false); error && setError('')}}
                placeholder="Enter Clover API token"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-1">Merchant ID</label>
            <div className="flex items-center bg-white p-3 rounded-xl border-2 border-slate-200 focus-within:border-green-600 transition-colors">
              <Building2 size={18} className="text-slate-400 mr-2" />
              <input 
                type="text" 
                value={merchantId}
                onChange={(e) => {setMerchantId(e.target.value); setDetailsValid(false); error && setError('')}}
                className="flex-1 outline-none text-slate-700 font-mono"
                placeholder="Enter Clover Merchant ID"
              />
            </div>
          </div>
          <button 
            onClick={validateDetails}
            className={`w-full py-4 rounded-2xl font-black flex items-center justify-center transition-all shadow-lg text-white disabled:opacity-60 bg-[#280]
              ${detailsValid ? 'cursor-not-allowed' : 'active:scale-95 cursor-pointer'}`}
          >
            {validating ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>{detailsValid ? "Details Valid" : "Validate Details" } </>
            )}
          </button>


          {/* 
          STATUS INDICATOR 
          <div className={`flex items-center justify-center p-4 rounded-2xl border-2 ${isAuthorized ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            {isAuthorized ? (
              <div className="flex items-center text-green-700 font-bold">
                <ShieldCheck size={20} className="mr-2" /> Authorized & Linked
              </div>
            ) : (
              <div className="flex items-center text-amber-700 font-bold text-sm">
                <ShieldAlert size={20} className="mr-2" /> {isPolling ? 'Waiting for Clover...' : 'Action Required: Not Authorized'}
              </div>
            )}
          </div>
          
        */}
        </div>
      </div>
    </div>
  );
};
