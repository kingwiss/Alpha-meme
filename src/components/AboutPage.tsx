import React from 'react';
import { ArrowLeft } from 'lucide-react';

export const AboutPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-300 p-6 md:p-12 font-mono flex flex-col items-center">
      <div className="w-full max-w-4xl max-h-screen">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        
        <h1 className="text-3xl md:text-5xl font-black text-white font-sans mb-8">About Us</h1>
        
        <div className="space-y-8 text-neutral-400 leading-relaxed max-w-3xl">
          <p className="text-lg">Welcome to Alpha Pump, the premiere destination for real-time Solana meme coin discovery and analytics.</p>
          
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white font-sans">Our Mission</h2>
            <p>Our mission is to provide you with the fastest, safest, and most intelligent heuristic models for navigating breakout tokens. With our advanced terminal, you gain immediate insights, unverified gems, and securely audited trades at lightspeed.</p>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white font-sans">Our Vision</h2>
            <p>Built by a team of decentralization enthusiasts, we envision a fully transparent and thriving ecosystem free from rugs and scams.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
