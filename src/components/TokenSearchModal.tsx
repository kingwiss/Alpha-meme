import React, { useState, useEffect } from 'react';
import { Search, X, TrendingUp, AlertCircle } from 'lucide-react';

export interface SearchResult {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceUsd: string;
  fdv: number;
}

export interface TokenSearchModalProps {
  onClose: () => void;
  onSelectToken: (token: SearchResult) => void;
}

export const TokenSearchModal: React.FC<TokenSearchModalProps> = ({ onClose, onSelectToken }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setTimeout(() => setResults([]), 0);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        // If it looks like a Solana address or strict string
        const searchTerm = query.trim();
        const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        
        if (data && data.pairs) {
          // Filter for Solana ecosystem and deduplicate by baseToken address
          const solanaPairs = data.pairs.filter((p: any) => p.chainId === 'solana');
          
          const uniqueTokens = new Map<string, SearchResult>();
          for (const pair of solanaPairs) {
            if (!uniqueTokens.has(pair.baseToken.address)) {
              // Only pick pairs that have a valid fdv or some volume to weed out complete garbage if possible
              uniqueTokens.set(pair.baseToken.address, pair);
            }
          }
          
          setResults(Array.from(uniqueTokens.values()).slice(0, 15));
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("DexScreener search failed", err);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="fixed inset-0 z-[110] flex pt-20 justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm shadow-2xl">
      <div className="bg-neutral-900 border border-emerald-500/30 rounded-2xl w-full max-w-2xl relative overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.15)] flex flex-col h-[500px] max-h-[80vh] auto-fade-in shadow-2xl">
        <div className="flex items-center p-4 border-b border-neutral-800 gap-3">
          <Search className="text-emerald-500" size={20} />
          <input 
            type="text" 
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search coin name, symbol, or paste contract address..."
            className="flex-1 bg-transparent border-none text-white text-lg focus:outline-none placeholder-neutral-500"
          />
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-white bg-neutral-800 hover:bg-neutral-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="text-center text-neutral-500 pt-10">Searching the Solana blockchain...</div>
          ) : results.length > 0 ? (
            <div className="flex flex-col gap-1">
              {results.map((r, idx) => (
                <button
                  key={`${r.baseToken.address}-${idx}`}
                  onClick={() => {
                    onSelectToken(r);
                    onClose();
                  }}
                  className="flex items-center justify-between p-4 hover:bg-neutral-800 rounded-xl transition-colors text-left"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-lg">{r.baseToken.name}</span>
                      <span className="text-sky-400 font-mono text-sm bg-sky-400/10 px-2 py-0.5 rounded">${r.baseToken.symbol}</span>
                    </div>
                    <span className="text-neutral-500 font-mono text-xs mt-1 truncate max-w-[200px] sm:max-w-[300px]">
                      {r.baseToken.address}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-white text-sm">
                      ${r.priceUsd ? parseFloat(r.priceUsd).toFixed(6) : '0.00'}
                    </span>
                    <span className="text-neutral-400 text-xs">
                      FDV ${(r.fdv / 1000).toFixed(1)}k
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length > 2 ? (
            <div className="text-center text-neutral-500 pt-10 flex flex-col items-center">
              <AlertCircle size={32} className="text-neutral-600 mb-3" />
              <p>No coins found matching "{query}"</p>
              <p className="text-sm mt-1">Try pasting an exact Solana contract address, or token link.</p>
            </div>
          ) : (
            <div className="text-center text-neutral-600 pt-10 flex flex-col items-center">
              <TrendingUp size={32} className="mb-3 opacity-20" />
              <p>Type to search the global Solana token index</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
