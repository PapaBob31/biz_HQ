
export default function LoadingScreen () {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="relative flex items-center justify-center h-40 w-40">
        
        {/* Outer Orbit Ring */}
        <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-l-blue-500 rounded-full animate-[spin_2s_linear_infinite]"></div>
        
        {/* Middle Orbit Ring (Reverse Spin) */}
        <div className="absolute inset-4 border-4 border-transparent border-t-cyan-400 border-r-cyan-400 rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
        
      </div>

      {/* Loading Text with Gradient & Spacing */}
      <div className="mt-8 text-center space-y-2">
        <h2 className="text-2xl font-bold text-blue-600 tracking-wider">INITIALIZING APP</h2>
        <div className="flex justify-center items-center gap-1">
          <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-1 h-1 bg-blue-300 rounded-full animate-bounce"></span>
        </div>
      </div>
    </div>
  );
};