import  { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, User, Mail, Lock, AlertCircle, X } from 'lucide-react';
import axios from "axios"

interface FormData {
  username: string,
  email: string,
  password: string,
  confirmPassword: string
}
export default function AdminSignup({navigateTo, storeSignupForm}: {navigateTo: (path: string)=>void, storeSignupForm: (form: FormData)=>void}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, watch, formState: { errors }, } = useForm<FormData>({mode: "onChange"});
  const [ serverError, setServerError ] = useState("")

  const password = watch("password");

  function createAdminAccount(data: FormData) {
    setIsSubmitting(true)
    const payload = {
      username: data.username,
      email: data.email,
      password: data.password,
      role: 'ADMIN'
    };

    axios.post(`${import.meta.env.VITE_BACKEND_API_BASE_URL}/api/employees/admin`, payload)
    .then((response) => {
      console.log(response)
      storeSignupForm(data)
      navigateTo('OTP Verification')
    })
    .catch(error => {
      console.log(error.message)
      if (error.response?.data) {
        setServerError(error.response.data.message)
      }
    })
    .finally(() => setIsSubmitting(false))
  };

  const inputStyle = (error: any) => `
    w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors
    ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}
  `;

  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-xl">
        <h2 className="text-2xl font-bold text-gray-800 text-center">Admin Signup</h2>
        <p className="font-semibold mb-6 text-center text-gray-700">No Admin account yet. Create a new Admin Account.</p>
        {serverError && (
          <div className="flex items-center gap-3 p-4 mb-6 bg-red-50 border-l-4 border-red-500 rounded-md animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="text-red-500 shrink-0" size={20} />
            <div className="flex-1">
                <h3 className="text-sm font-bold text-red-800">Registration Failed</h3>
                <p className="text-xs text-red-700">{serverError}</p>
            </div>
            <button onClick={() => setServerError("")} className="text-red-400 hover:text-red-600">
                <X size={16} />
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit(createAdminAccount)} className="space-y-4">
          
          <div className="relative">
            <User className="absolute left-3 top-3 size-5 text-gray-400" />
            <input
              type="text"
              placeholder="Username"
              className={inputStyle(errors.username)}
              {...register("username", { required: "Username is required" })}
            />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-3 size-5 text-gray-400" />
            <input
              type="email"
              placeholder="Email Address"
              className={inputStyle(errors.email)}
              {...register("email", { 
                required: "Email is required",
                pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" }
              })}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 size-5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className={inputStyle(errors.password)}
              {...register("password", { 
                required: "Password is required",
                minLength: { value: 10, message: "Must be at least 10 characters" }
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 size-5 text-gray-400" />
            <input
              type={showPassword2 ? "text" : "password"}
              placeholder="Confirm Password"
              className={inputStyle(errors.confirmPassword)}
              {...register("confirmPassword", { 
                required: "Please confirm your password",
                validate: value => value === password || "Passwords do not match"
              })}/>
            <button
                type="button"
                onClick={() => setShowPassword2(!showPassword2)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword2 ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          
          <div className="pt-4 flex flex-col gap-3">
            <button
              type="submit" disabled={isSubmitting}
              className="w-full cursor-pointer disabled:bg-blue-400 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              {isSubmitting ? "Creating Admin Account..."  : "Create Admin Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};