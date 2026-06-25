import './polyfills';

import React, { StrictMode, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { AuthProvider } from './contexts/AuthContext';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import ErrorBoundary from './ErrorBoundary';

const WrappedApp = () => {
  const endpoint = import.meta.env.VITE_RPC_URL || "https://solana-mainnet.rpc.extnode.com";

  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

  return (
    <ErrorBoundary>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <AuthProvider>
            <App />
          </AuthProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ErrorBoundary>
  );
};

const rootElement = document.getElementById('root')!;

try {
  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <WrappedApp />
      </ErrorBoundary>
    </StrictMode>
  );
} catch (error: any) {
  console.error("Top level render error:", error);
  rootElement.innerHTML = `
    <div style="padding: 25px; background: #ffe6e6; border: 2px solid #cc0000; color: #990000; font-family: monospace;">
      <h2>🚨 Application Failed to Mount</h2>
      <p>The screen is prevented from being blank. Here is the exact crash log:</p>
      <pre style="background: #fff; padding: 12px; border: 1px solid #cc0000; overflow-x: auto;">${error.message || error}</pre>
      <pre style="font-size: 11px;">${error.stack || ''}</pre>
    </div>
  `;
}

