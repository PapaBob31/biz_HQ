import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, RotateCcw, X, Check, AlertCircle } from 'lucide-react';
import axios from "axios"

export default function OtpVerification({navigateTo, email}: {navigateTo: (path: string) => void,email: string}) {
    const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
    const [timer, setTimer] = useState(60);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [error, setError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [otpVerified, setOtpVerified] = useState(false)

    // Countdown Logic
    useEffect(() => {
      if (timer > 0) {
        const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        return () => clearInterval(interval);
      }
    }, [timer]);

    const handleChange = (element: HTMLInputElement, index: number) => {
      if (isNaN(Number(element.value))) return;
      const newOtp = [...otp];
      newOtp[index] = element.value;
      setOtp(newOtp);

      // Focus next input
      if (element.value !== "" && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handleVerify = () => {
      setIsSubmitting(true);

      const finalOtp = otp.join("");
      axios.post(`${import.meta.env.VITE_BACKEND_API_BASE_URL}/api/employees/verify-otp`, {email, otp: finalOtp})
      .then(response => {
        if (response.data.success) {
          setOtpVerified(true)
        }
      }).catch((error) => {
        setError(error.response.data.message)
      })
    };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full text-center">
        {!otpVerified && <>
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="text-blue-600 size-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Verify your Email</h2>
          <p className="text-slate-500 mt-2 mb-8">Input the 6-digit code sent to your email address.</p>

          <div className="flex justify-between gap-2 mb-8">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                ref={(el) => (inputRefs.current[index] = el)}
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => e.key === 'Backspace' && !otp[index] && inputRefs.current[index-1]?.focus()}
                className="w-12 h-14 border-2 border-gray-400 rounded-lg text-center text-xl font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            ))}
          </div>

          <button
            disabled={isSubmitting}
            onClick={handleVerify}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg mb-4 cursor-pointer"
          >
            {isSubmitting ? "Verifying..." : "Verify OTP "}
          </button>
          {error && (
            <p className="mb-6 text-red-400 text-sm font-medium py-1 px-2 flex items-center justify-between bg-red-200 rounded-md">
              <span>{error}</span>
              <button className="rounded-lg cursor-pointer p-1 ml-2 hover:bg-red-300" onClick={()=>setError("")}><X size={20}/></button>
            </p>
          )}
          <div className="text-sm">
            {timer > 0 ? (
              <p className="text-slate-400">Resend code in <span className="text-blue-600 font-bold">{timer}s</span></p>
            ) : (
              <button 
                onClick={() => setTimer(60)}
                className="text-blue-600 font-bold flex items-center gap-2 mx-auto hover:underline"
              >
                <RotateCcw size={16} /> Resend OTP
              </button>
            )}
          </div>
        </>}
        {otpVerified && (
          <>
            <div className="bg-green-100 relative w-fit mx-auto rounded-full flex items-center justify-center mb-10 p-2">
              <Check className="text-green-500 size-10" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Verification Successful</h2>
            <p className="text-gray-500 mt-4">First Admin account has been created. Login to get started managing your business</p>
            <div className="flex items-start p-2 bg-blue-100 rounded-lg mt-6 ">
              <AlertCircle className="text-blue-600 shrink-0" size={20} />
              <div className="text-blue-600 grow-1 text-start ml-2 text-sm">
                Do note that no other admin can be created through this interface as long as at least one admin account exists. 
                Subsequent accounts (admin or not) must be created inside the employees section of the software through an existing admin account.
              </div>
            </div> 
            <button
              onClick={()=>navigateTo('Login')}
              className="block w-full mt-10 text-white py-2 rounded-md text-lg hover:bg-blue-700 transition-all bg-blue-600 font-semibold cursor-pointer">
              Go to Log in
            </button>
          </>
        )}
      </div>
    </div>
  );
};

