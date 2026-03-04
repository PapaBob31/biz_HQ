import { AlertTriangle } from "lucide-react"


/** Returns JSX display that shows expired token message/notification
 * @param {Object} props - Object containing a single attribute called `goToLogin` for restarting the auth flow
 * @return {JSX}*/
export default function ExpiredSessionInfo({goToLogin} : {goToLogin: ()=>void}) {
    return (
        <div className="z-30 fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className={`py-14 bg-white rounded-2xl w-[30%] max-h-150  shadow-2xl overflow-hidden animate-in 
            zoom-in-95 duration-200 flex flex-col items-center justify-center`}>
                <AlertTriangle size={70} className="text-yellow-500"/>
                <p className="text-lg text-center mt-4 mb-2 font-semibold">Session Expired!</p>
                <button className="text-white font-semibold rounded-lg px-3 py-2 bg-blue-600 cursor-pointer" onClick={goToLogin}>Go to Login</button>
            </div>
        </div>
    )
}
