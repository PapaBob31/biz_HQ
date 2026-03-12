import { useState, useEffect, useRef } from 'react';
import { RotateCw, X, Check, Lock, EyeOff, Eye, ArrowLeft, Mail } from 'lucide-react';
import axios from "axios"

type screen = "passwd-reset-request"|"new-password"|"passwd-reset-otp-verification"|"passwd-reset-success"

function PasswordResetOTPReq({changeScreenTo, storeEmail, navigateToLogin}: {changeScreenTo: (screen: screen)=>void, storeEmail: (email: string)=>void, navigateToLogin: ()=>void}) {
  const [error, setError] = useState("")
  const [emailInput, setEmailInput] = useState("")
  const [reqProcessing, setReqProcessing] = useState(false)

  function sendPasswdResetOTPReq() {
    setReqProcessing(true)
    axios.post(`${import.meta.env.VITE_BACKEND_API_BASE_URL}/api/employees/passwd-reset-otp`, {email: emailInput})
    .then(() => {
      storeEmail(emailInput)
      changeScreenTo("passwd-reset-otp-verification")
    }).catch(error => {
      console.log(error)
      if (error.response?.data) {
        setError(error.response.data.message)
        console.log(error.response.data)
      }
    })
    .finally(()=> {
      setReqProcessing(false)
    })
  }

  return (
    <div>
      <button className="cursor-pointer" onClick={()=>navigateToLogin()}><ArrowLeft size={20}/></button>
      <div className="flex justify-center mb-2">
        <div className="p-3 bg-blue-50 rounded-full text-blue-700">
          <Mail size={50} />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2 mt-4 text-center">Input your email address</h1>
      <p className="text-slate-600 mb-2">Please Enter the email address you registered your admin account with. A 6 digit OTP will be sent to it</p>
      <strong>Note</strong>: <em className="text-slate-600">Only admins can reset their passwords here</em>
      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
      <label className="block font-semibold mt-10 mb-2">Email:</label>
      <input 
        type="text"
        className="w-full py-2 px-1 outline-gray-500 outline-1 focus:outline-2 rounded-lg focus:outline-blue-600 mb-4"
        onChange={(e) => setEmailInput(e.target.value)}
        value={emailInput}
      />
      <button className="w-full mb-10 py-2 px-3 rounded-lg bg-blue-600 text-white cursor-pointer font-semibold" onClick={sendPasswdResetOTPReq} disabled={reqProcessing}>
        {reqProcessing ? "Sending OTP..." : "Send OTP"}
      </button>
    </div>
  )
}


function NewPassword({changeScreenTo, passwdResetToken, email }: {changeScreenTo: (screen: screen)=>void, passwdResetToken: string, email: string}) {
  const [creds, setCreds] = useState({ password1: '', password2: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwdOneVisible, setPasswdOneVisible] = useState(false);
  const [passwdTwoVisible, setPasswdTwoVisible] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creds.password1 !== creds.password2){
      setError('Both passwords must match')
      return;
    }
    setIsLoading(true);
    setError('');

    axios.put(`${import.meta.env.VITE_BACKEND_API_BASE_URL}/api/admin-password`, {email, newPassword: creds.password1}, {headers: {"x-password-reset-token": passwdResetToken}})
    .then(() => {
      changeScreenTo("passwd-reset-success")
    }).catch(error => {
      console.log(error.message)
      if (error.response?.data) {
        setError(error.response.data.message)
        console.log(error.response.data)
      }else setError(`Error ${error.response?.status}`)
    })
    .finally(()=> {
      setIsLoading(false)
    })
  };

  return  (
    <>
      
      <h1 className="text-2xl font-bold text-center text-slate-800 mb-2 mt-4">Reset your password</h1>
      <p className="text-gray-600 mb-6">Please input your new password below</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">

      <div>
        <label className="block text-sm font-medium mb-1">Enter your new Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
          <input 
            type={passwdOneVisible ? "text" : "password"} required
            className="w-full pl-10 pr-4 py-2 outline-black outline-1 focus:outline-2 rounded-lg focus:outline-blue-600"
            onChange={(e) => setCreds({...creds, password1: e.target.value})}
          />
          <button
            type="button"
            onClick={() => setPasswdOneVisible(!passwdOneVisible)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
          {passwdOneVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>


      <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type={passwdTwoVisible ? "text" : "password"} required
                className="w-full pl-10 pr-4 py-2 outline-black outline-1 focus:outline-2 rounded-lg focus:outline-blue-600"
                onChange={(e) => setCreds({...creds, password2: e.target.value})}
              />
              <button
                type="button"
                onClick={() => setPasswdTwoVisible(!passwdTwoVisible)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
              {passwdTwoVisible ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
          </div>
      </div>

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition cursor-pointer mb-4"
        >
          {isLoading ? 'Resetting' : 'Reset password'}
        </button>
      </form>
    </>
  )
}


export function PasswordResetSuccess({navigateToLogin} : {navigateToLogin: ()=>void}) {
  return (
    <>
      <div className="bg-green-100 relative w-fit mx-auto rounded-full flex items-center justify-center mb-10 p-2 mt-12">
        <Check className="text-green-500 size-10" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900">Password Update Successful</h2>
      <p className="text-gray-500 mt-2">Your password has been updated. Confirm by logging in.</p>
      <button
        onClick={()=>navigateToLogin()}
        className="block w-full mt-10 mb-12 text-white py-2 rounded-md text-lg hover:bg-blue-700 transition-all bg-blue-600 font-semibold cursor-pointer">
        Go to Log in
      </button>
    </>
  )
}


function PasswdResetOTPVerification({changeScreenTo, email, setAuthToken} : {changeScreenTo: (screen: screen)=>void, email: string, setAuthToken: (param: string)=>void}) {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement|null)[]>([]);
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    axios.post(`${import.meta.env.VITE_BACKEND_API_BASE_URL}/api/employees/verify-passwd-reset-otp`, {email, otp: finalOtp})
    .then(response => {
      console.log(response);
      const token = response.headers["x-password-reset-token"];
      if (token){
        setAuthToken(token)
        changeScreenTo('new-password')
      }else setError("Unexpected Error! Please try again")
    }).catch((error) => {
      setError(error.response.data.message)
    })
    .finally(()=> {
      setIsSubmitting(false)
    })
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-slate-800 mt-10">Verify your password Reset OTP</h2>
      <p className="text-slate-500 mt-2 mb-8">Input the 6-digit code sent to <strong>{email}</strong>.</p>

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
            className="w-12 h-14 border-2 border-gray-400 rounded-lg text-center text-xl font-bold focus:border-blue-500 outline-none transition-all"
          />
        ))}
      </div>

      {error && (
        <p className="mb-6 text-red-400 text-sm font-medium py-1 px-2 flex items-center justify-between bg-red-200 rounded-md">
          <span>{error}</span>
          <button className="rounded-lg cursor-pointer p-1 ml-2 hover:bg-red-300" onClick={()=>setError("")}><X size={20}/></button>
        </p>
      )}
      <button
        disabled={isSubmitting}
        onClick={handleVerify}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all mb-4 cursor-pointer"
      >
        {isSubmitting ? "Verifying..." : "Verify OTP"}
      </button>
      
      <div className="text-sm mb-10">
      {timer > 0 ? (
        <p className="text-slate-400">Resend code in <span className="text-blue-600 font-bold">{timer}s</span></p>
      ) : (
        <button 
          onClick={() => setTimer(60)}
          className="text-blue-600 font-bold flex items-center gap-2 mx-auto hover:underline"
        >
          <RotateCw size={16} /> Resend OTP
        </button>
      )}
    </div>
  </>
  );
};


export default function ForgotPassword({ navigateTo }: {navigateTo: (param: 'Login')=>void}){
  const [passwordResetEmail, setPaswordResetEmail] = useState('')
  const [passwordResetToken, setPasswordResetToken] = useState('')
  const [displayedScreen, setDisplayedScreen] = useState<screen>("passwd-reset-request")


  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-md">
        {displayedScreen === "passwd-reset-request" && <PasswordResetOTPReq navigateToLogin={()=>navigateTo('Login')} changeScreenTo={setDisplayedScreen} storeEmail={setPaswordResetEmail} />}
        {displayedScreen === "passwd-reset-otp-verification" && <PasswdResetOTPVerification changeScreenTo={setDisplayedScreen} email={passwordResetEmail} setAuthToken={setPasswordResetToken}/>}
        {displayedScreen === "new-password" && passwordResetToken && <NewPassword passwdResetToken={passwordResetToken} email={passwordResetEmail} changeScreenTo={setDisplayedScreen}/>}
        {displayedScreen === "passwd-reset-success" && <PasswordResetSuccess navigateToLogin={()=>navigateTo('Login')}/>}
      </div>
    </div>
  );
};