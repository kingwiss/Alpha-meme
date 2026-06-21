import React from 'react';
import { ArrowLeft } from 'lucide-react';

export const PrivacyPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-300 p-6 md:p-12 font-mono flex flex-col items-center">
      <div className="w-full max-w-4xl max-h-screen">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        
        <h1 className="text-3xl md:text-5xl font-black text-white font-sans mb-8">Privacy Policy</h1>
        
        <div className="space-y-8 text-neutral-400 leading-relaxed max-w-3xl">
          <p>Effective Date: {new Date().toLocaleDateString()}</p>
          <p>We respect your privacy and are committed to protecting it through our compliance with this policy.</p>
          
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white font-sans">1. Information We Collect</h2>
            <p>We collect information directly from you when you provide it to us, automatically as you navigate through the site (such as usage details, IP addresses, and cookies), and from third parties (such as our payment processors).</p>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white font-sans">2. How We Use Your Information</h2>
            <p>We use information to present our Website and its contents to you, to provide you with information, products, or services that you request from us, and to carry out our obligations arising from any contracts entered into between you and us (like billing).</p>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white font-sans">3. Data Security</h2>
            <p>We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
