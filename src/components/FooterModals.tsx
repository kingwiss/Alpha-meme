import React from 'react';

type FooterModalsProps = {
  showAbout: boolean;
  setShowAbout: (b: boolean) => void;
  showPrivacy: boolean;
  setShowPrivacy: (b: boolean) => void;
  showTerms: boolean;
  setShowTerms: (b: boolean) => void;
};

export const FooterModals: React.FC<FooterModalsProps> = ({
  showAbout, setShowAbout,
  showPrivacy, setShowPrivacy,
  showTerms, setShowTerms
}) => {
  return (
    <>
      {showAbout && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-lg w-full text-sm text-neutral-300 relative">
            <button onClick={() => setShowAbout(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">x</button>
            <h2 className="text-xl font-bold text-white mb-4">About Us</h2>
            <div className="space-y-4">
              <p>Welcome to Alpha Pump, the premiere destination for real-time Solana meme coin discovery and analytics.</p>
              <p>Our mission is to provide you with the fastest, safest, and most intelligent heuristic models for navigating breakout tokens. With our advanced terminal, you gain immediate insights, unverified gems, and securely audited trades at lightspeed.</p>
              <p>Built by a team of decentralization enthusiasts, we envision a fully transparent and thriving ecosystem free from rugs and scams.</p>
            </div>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-lg w-full text-sm text-neutral-300 relative max-h-[80vh] overflow-y-auto">
            <button onClick={() => setShowPrivacy(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">x</button>
            <h2 className="text-xl font-bold text-white mb-4">Privacy Policy</h2>
            <div className="space-y-4">
              <p>Effective Date: {new Date().toLocaleDateString()}</p>
              <p>We respect your privacy and are committed to protecting it through our compliance with this policy.</p>
              <h3 className="font-bold text-white mt-4">1. Information We Collect</h3>
              <p>We collect information directly from you when you provide it to us, automatically as you navigate through the site (such as usage details, IP addresses, and cookies), and from third parties (such as our payment processors).</p>
              <h3 className="font-bold text-white mt-4">2. How We Use Your Information</h3>
              <p>We use information to present our Website and its contents to you, to provide you with information, products, or services that you request from us, and to carry out our obligations arising from any contracts entered into between you and us (like billing).</p>
              <h3 className="font-bold text-white mt-4">3. Data Security</h3>
              <p>We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure.</p>
            </div>
          </div>
        </div>
      )}

      {showTerms && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-lg w-full text-sm text-neutral-300 relative max-h-[80vh] overflow-y-auto">
            <button onClick={() => setShowTerms(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">x</button>
            <h2 className="text-xl font-bold text-white mb-4">Terms of Service</h2>
            <div className="space-y-4">
              <p>Effective Date: {new Date().toLocaleDateString()}</p>
              <h3 className="font-bold text-white mt-4">1. Acceptance of Terms</h3>
              <p>By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.</p>
              <h3 className="font-bold text-white mt-4">2. Premium Subscription</h3>
              <p>Premium features are available as a recurring subscription of $4.99 per week. You authorize us to charge this amount to your provided payment method on a weekly basis until cancelled.</p>
              <h3 className="font-bold text-white mt-4">3. Disclaimers</h3>
              <p>The content provided is for informational purposes only. We are not financial advisors, and you should always do your own research before trading or investing in cryptocurrency or meme coins.</p>
              <h3 className="font-bold text-white mt-4">4. Limitation of Liability</h3>
              <p>In no event shall Alpha Pump, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
