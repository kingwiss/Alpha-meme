import React, { useState } from 'react';
import { Mail, Check, AlertCircle } from 'lucide-react';

export const ContactFloatingButton: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState<'idle'|'submitting'|'success'|'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    const form = e.currentTarget;
    
    // We send form data to formsubmit.io using AJAX to avoid a full page redirect
    try {
      const formData = new FormData(form);
      const res = await fetch('https://formsubmit.co/ajax/fredwisseh@gmail.com', {
        method: "POST",
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
      });
      if (res.ok) {
        setStatus('success');
        setTimeout(() => {
          setShowModal(false);
          setStatus('idle');
          form.reset();
        }, 3000);
      } else {
        setStatus('error');
      }
    } catch(err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 p-4 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-transform hover:scale-110 active:scale-95"
        title="Contact Us"
      >
        <Mail size={24} />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-sm w-full text-sm text-neutral-300 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white pb-1 w-6 h-6 flex items-center justify-center rounded-full hover:bg-neutral-800">x</button>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Mail size={18} className="text-emerald-400" /> Contact Us</h2>
            
            {status === 'success' ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex flex-col items-center gap-2 animate-in fade-in zoom-in">
                <Check size={32} />
                <p className="font-bold text-center">Message Sent!</p>
                <p className="text-xs text-center opacity-80">We'll get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="_subject" value="New Contact Message from Alpha Pump!" />
                <input type="hidden" name="_template" value="table" />
                
                <div>
                  <label htmlFor="name" className="block text-xs font-mono mb-1 text-neutral-400">Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    id="name" 
                    required 
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-mono mb-1 text-neutral-400">Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    id="email" 
                    required 
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-xs font-mono mb-1 text-neutral-400">Message</label>
                  <textarea 
                    name="message" 
                    id="message" 
                    required 
                    rows={4}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50 resize-none"
                  ></textarea>
                </div>
                
                {status === 'error' && (
                  <div className="text-rose-400 text-xs flex items-center gap-1"><AlertCircle size={12}/> Failed to send. Try again.</div>
                )}
                
                <button 
                  type="submit" 
                  disabled={status === 'submitting'}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold font-mono tracking-wide rounded-lg uppercase transition-colors disabled:opacity-50"
                >
                  {status === 'submitting' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
