import React, { useState } from 'react';
import { X, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { signInWithGoogle } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-xl relative shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-neutral-800">
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 bg-neutral-900/80 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full z-10 transition-colors"
          title="Close Modal"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
        
        <div className="p-6">
          <h2 className="text-xl font-bold font-sans text-white mb-6">
            {isRegistering ? 'Create Account' : 'Sign In'}
          </h2>
          
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono text-neutral-400 uppercase">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg py-2 pl-9 pr-4 text-sm font-mono text-white outline-none transition-colors"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono text-neutral-400 uppercase">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg py-2 pl-9 pr-4 text-sm font-mono text-white outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold font-mono text-xs px-5 py-2.5 rounded-lg transition-colors uppercase tracking-wider"
            >
              {isRegistering ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-800"></div>
            <span className="text-[10px] text-neutral-500 font-mono uppercase">or</span>
            <div className="h-px flex-1 bg-neutral-800"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full bg-neutral-200 hover:bg-white text-neutral-950 font-bold font-sans text-sm px-5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>

          <p className="mt-6 text-center text-xs text-neutral-500 font-mono">
            {isRegistering ? "Already have an account? " : "Don't have an account? "}
            <button 
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-emerald-400 hover:text-emerald-300 underline"
            >
              {isRegistering ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
