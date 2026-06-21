import React from 'react';
import { ArrowLeft } from 'lucide-react';

export const TermsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-300 p-6 md:p-12 font-mono flex flex-col items-center">
      <div className="w-full max-w-4xl max-h-screen">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        
        <h1 className="text-3xl md:text-5xl font-black text-white font-sans mb-8">Terms of Service</h1>
        
        <div className="space-y-8 text-neutral-400 leading-relaxed max-w-3xl">
          <p>Effective Date: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white font-sans">1. Acceptance of Terms</h2>
            <p>By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.</p>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white font-sans">2. Premium Subscription</h2>
            <p>Premium features are available as a recurring subscription of $4.99 per week. You authorize us to charge this amount to your provided payment method on a weekly basis until cancelled.</p>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white font-sans">3. Disclaimers</h2>
            <p>The content provided is for informational purposes only. We are not financial advisors, and you should always do your own research before trading or investing in cryptocurrency or meme coins.</p>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white font-sans">4. Limitation of Liability</h2>
            <p>In no event shall Alpha Pump, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
