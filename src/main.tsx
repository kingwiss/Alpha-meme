import {StrictMode, useMemo} from 'react';
import { Buffer } from 'buffer';
if (typeof window !== 'undefined') {
  (window as any).Buffer = (window as any).Buffer || Buffer;
  (window as any).process = (window as any).process || { env: {} };
}
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { ConnectionProvider } from '@solana/wallet-adapter-react';
import { getToken } from 'firebase/messaging';
import { messaging } from './firebase';
import ErrorBoundary from './ErrorBoundary';

const WrappedApp = () => {
  const endpoint = import.meta.env.VITE_HELIUS_API_KEY 
    ? `https://mainnet.helius-rpc.com/?api-key=${import.meta.env.VITE_HELIUS_API_KEY}`
    : "https://mainnet.helius-rpc.com/?api-key=3d18e988-fdce-4070-86a3-f5c2dd98c15c";

  return (
    <ErrorBoundary>
      <ConnectionProvider endpoint={endpoint}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ConnectionProvider>
    </ErrorBoundary>
  );
};

if ('serviceWorker' in navigator && 'PushManager' in window) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js').then((registration) => {
      console.log('Firebase SW registration successful with scope: ', registration.scope);
      // Auto-request permission and get FCM token on load for meme coin alerts
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
             messaging().then(m => {
               if(m) {
                 // In production, we'd need a VAPID key here from Firebase console
                 // getToken(m, { vapidKey: 'YOUR_VAPID_KEY', serviceWorkerRegistration: registration })
                 // For now, it will attempt auto configuration based on firebase-config
                 getToken(m, { serviceWorkerRegistration: registration }).then((currentToken) => {
                   if (currentToken) {
                     console.log('FCM Token retrieved. Ready to receive background messages.');
                   }
                 }).catch(console.error);
               }
             });
          }
        });
      } else if (Notification.permission === 'granted') {
         messaging().then(m => {
           if(m) {
             getToken(m, { serviceWorkerRegistration: registration }).then((currentToken) => {
               if (currentToken) {
                 console.log('FCM Token retrieved. Ready to receive background messages.');
               }
             }).catch(console.error);
           }
         });
      }
    }, (err) => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WrappedApp />
  </StrictMode>,
);

