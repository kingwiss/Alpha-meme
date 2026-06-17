import React, { useEffect, useRef } from 'react';
import { X, Zap } from 'lucide-react';

interface TerminalModalProps {
  onClose: () => void;
  initialMint?: string;
}

export const TerminalModal: React.FC<TerminalModalProps> = ({ onClose, initialMint }) => {
  const terminalRef = useRef<boolean>(false);

  useEffect(() => {
    // Only init once
    if (terminalRef.current) return;
    
    let timer: any;
    
    const initJupiter = () => {
      if (window.Jupiter) {
        terminalRef.current = true;
        try {
          window.Jupiter.init({
            displayMode: 'integrated',
            integratedTargetId: 'jupiter-integrated-terminal',
            endpoint: 'https://api.mainnet-beta.solana.com', // Public RPC Endpoint
            strictTokenList: false, // Allow any token to be bought
            defaultExplorer: 'Solscan',
            formProps: {
                initialOutputMint: initialMint || 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // Default to BONK or the provided mint
                initialInputMint: 'So11111111111111111111111111111111111111112', // WSOL
            }
          });
        } catch (e) {
          console.error("Jupiter Terminal failed to init:", e);
        }
      } else {
        timer = setTimeout(initJupiter, 500);
      }
    };
    
    const loadScript = () => {
      if (document.getElementById('jupiter-terminal-script')) {
        initJupiter();
        return;
      }
      const script = document.createElement('script');
      script.id = 'jupiter-terminal-script';
      script.src = 'https://terminal.jup.ag/main-v3.js';
      script.crossOrigin = 'anonymous';
      script.onload = initJupiter;
      document.head.appendChild(script);
    };

    loadScript();

    return () => {
      if (timer) clearTimeout(timer);
      if (window.Jupiter && window.Jupiter.close) {
        try {
           // window.Jupiter.close();
        } catch(e) {}
      }
    };
  }, [initialMint]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-sm shadow-2xl auto-fade-in">
      <div className="bg-neutral-900 border border-emerald-500/30 rounded-2xl w-full max-w-md relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.2)] flex flex-col h-[650px] max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-neutral-800 bg-neutral-900 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="text-emerald-500" size={18} />
            <h2 className="text-lg font-bold font-sans text-white">Trade via Jupiter</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-white bg-neutral-800 hover:bg-neutral-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="flex-1 w-full relative bg-neutral-900 overflow-hidden rounded-b-2xl" id="jupiter-integrated-terminal">
          {!window.Jupiter && (
            <div className="flex items-center justify-center h-full text-neutral-500 font-mono text-sm">
              Loading swap interface...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
