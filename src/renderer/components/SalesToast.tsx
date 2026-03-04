import { useState, useEffect } from 'react';

interface Popup {
  id: number;
  message: string;
}

function usePopup() {
  const [popups, setPopups] = useState<Popup[]>([]);

  const addPopup = (message: string) => {
    const id = Date.now();
    setPopups(prev => [...prev, { id, message }]);

    setTimeout(() => {
      setPopups(prev => prev.filter(p => p.id !== id));
    }, 2000);
  };

  return [popups, addPopup]

}

export default function SuccessToast({saleId} : {saleId: number|null}) {
    const [popups , addPopup] = usePopup() as [Popup[], (message: string) => void]
    useEffect(() => {
      if (saleId)
        addPopup(`#${saleId.toString().padStart(4, "0")} Sale successful!`)
    }, [saleId])

    if (popups.length  == 0 ){
        return null;
    }
    return (
      <>
        <div className="z-50 fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
          {popups.map(popup => (
            <div key={popup.id} className="flex items-center gap-3 bg-green-200 border-2 border-green-300 text-green-500 rounded-lg shadow-lg px-4 py-3 animate-fade-in">
              <span className="font-medium text-gray-900">{popup.message}</span>
            </div>
          ))}
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
