import { WifiOff, RotateCcw, AlertTriangle } from 'lucide-react';

interface ErrorScreenProps {
  message?: string;
  onRetry: () => void;
}

export default function NetworkErrorScreen( {message = "Check your Internet connection and try again.", onRetry } : ErrorScreenProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="bg-red-50 p-6 rounded-full">
              <WifiOff className="size-16 text-red-500" strokeWidth={1.5} />
            </div>
            <AlertTriangle className="absolute -top-2 -right-2 size-8 text-yellow-500 fill-white" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Network Error</h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-4">
          <button
            onClick={onRetry}
            className="cursor-pointer flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-gray-200"
          >
            <RotateCcw size={20} />
            Retry Connection
          </button>
        </div>
      </div>
    </div>
  );
};
