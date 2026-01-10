import { useEffect, useRef } from "react"


export function useBarcodeScanner(onScan: (code: string) => void, bufferTimeout = 100){
  const buffer = useRef<string>('');
  const lastKeyTime = useRef<number>(Date.now());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore functional keys
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt') return;

      const now = Date.now();
      
      // If the delay between keys is > 100ms, it's likely a human typing, not a scanner.
      // We clear the buffer to prevent mixing human typing with scans.
      if (now - lastKeyTime.current > bufferTimeout) {
        buffer.current = '';
      }

      lastKeyTime.current = now;

      if (e.key === 'Enter') {
        if (buffer.current.length > 0) {
          onScan(buffer.current);
          buffer.current = ''; 
        }
        return;
      }

      // Add character to buffer (e.g., '1', '2', 'a')
      if (e.key.length === 1) {
        buffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan, bufferTimeout]);
};
