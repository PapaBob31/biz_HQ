import { useState } from "react";
import { Mail, X, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import axios from  "axios";

interface FormData {
  username: string,
  email: string,
  password: string,
  confirmPassword: string
}

export default function AdminVerificationPrompt({navigateTo, storeSignupForm} : {navigateTo: (screen: 'Admin Verification OTP'|'Login')=>void, storeSignupForm: (form: FormData)=>void}) {
    const [emailInput, setEmailInput] = useState('')
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("")

    function sendAcctVerificationOTPReq() {
        setIsLoading(true)
        axios.post(`${import.meta.env.VITE_BACKEND_API_BASE_URL}/api/employees/new-otp`, {email: emailInput})
        .then(() => {
            storeSignupForm({username: '', email: emailInput, password: '', confirmPassword: ''});
            navigateTo('Admin Verification OTP')
        })
        .catch(error => {
            console.log(error)
            setError(error.response?.data)
        })
        .finally(() => {
            setIsLoading(false)
        })
    }
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-md">
                <button className="flex items-center gap-2 cursor-pointer" onClick={()=>navigateTo('Login')}>
                    <ArrowLeft size={20}/>
                    <span className="text-md">Login</span>
                </button>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mt-10 mb-6 bg-blue-50 text-blue-600">
                    <Mail size={40} />
                </div>
                <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Verify your admin account</h1>
                <p className="text-slate-500 mb-8 px-4 text-center">
                    Enter your email address below. A 6 digit otp will be sent to it for the verification of your account
                </p>
                {error && (
                    <p className="mb-6 text-red-400 text-sm font-medium py-1 px-2 flex items-center justify-between bg-red-200 rounded-md">
                        <span>{error}</span>
                        <button className="rounded-lg cursor-pointer p-1 ml-2 hover:bg-red-300" onClick={()=>setError("")}><X size={20}/></button>
                    </p>
                )}
                <input 
                    type="email" required
                    className="w-full p-2 outline-black outline-1 focus:outline-2 rounded-lg focus:outline-blue-600"
                    value={emailInput}
                    onChange={(e) => setEmailInput( e.target.value)}
                />
                <button
                    onClick={sendAcctVerificationOTPReq}
                    disabled={isLoading || !emailInput.trim()}
                    className="mt-4 mb-10 w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] bg-blue-600 hover:bg-blue-700"
                >
                    {isLoading ? (
                      <>Sending Code ... <Loader2 className="animate-spin" /></>
                    ) : <>
                            Send Verification Code
                            <ArrowRight size={18} />
                        </>
                    }
                </button>
            </div>
        </div>
    )
}