import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Save, History, Eye, X, Settings2, Shield, User, Link as LinkIcon } from 'lucide-react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { MemeCoin } from '../types';

interface ProfileDashboardProps {
  onClose: () => void;
  onSelectCoin?: (coinId: string, coinData?: MemeCoin) => void;
}

export const ProfileDashboard: React.FC<ProfileDashboardProps> = ({ onClose, onSelectCoin }) => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'saved' | 'history' | 'settings'>('saved');
  const [savedCoins, setSavedCoins] = useState<any[]>([]);
  const [viewedCoins, setViewedCoins] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(profile?.username || '');

  useEffect(() => {
    if (user && profile) {
      setEditUsername(profile.username);
    }
  }, [user, profile]);

  useEffect(() => {
    const fetchCoinData = async () => {
      if (!user) return;
      try {
        const savedQ = query(collection(db, 'users', user.uid, 'savedCoins'), orderBy('actionAt', 'desc'), limit(50));
        const savedSnap = await getDocs(savedQ);
        setSavedCoins(savedSnap.docs.map(d => d.data()));

        const viewedQ = query(collection(db, 'users', user.uid, 'viewedCoins'), orderBy('actionAt', 'desc'), limit(50));
        const viewedSnap = await getDocs(viewedQ);
        setViewedCoins(viewedSnap.docs.map(d => d.data()));
      } catch (err) {
        console.error("Failed to load user coins", err);
      }
    };
    fetchCoinData();
  }, [user, activeTab]);

  const handleUpdateProfile = async () => {
    await updateProfile({
      username: editUsername,
    });
    setIsEditing(false);
  };

  const handleTogglePrivacy = async () => {
    if (profile) {
      await updateProfile({ isPublic: !profile.isPublic });
    }
  };

  if (!user || !profile) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm sm:items-stretch sm:p-10">
      <div className="glass-panel w-full max-w-4xl rounded-xl overflow-hidden relative flex flex-col max-h-full">
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold text-lg">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                profile.username.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-sans text-white">{profile.username}</h2>
                {profile.isPublic ? (
                  <span className="text-[9px] uppercase tracking-wider font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-500/30">Public</span>
                ) : (
                  <span className="text-[9px] uppercase tracking-wider font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-500/30">Private</span>
                )}
              </div>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-2">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col sm:flex-row">
          {/* Sidebar */}
          <div className="w-full sm:w-64 border-b sm:border-b-0 sm:border-r border-neutral-800 bg-neutral-900/30 p-4 flex flex-row sm:flex-col gap-2 overflow-x-auto sm:overflow-visible shrink-0">
            <button 
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-mono transition-colors ${activeTab === 'saved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}
            >
              <Save size={16} /> <span className="hidden sm:inline">Saved Coins</span>
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-mono transition-colors ${activeTab === 'history' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}
            >
              <History size={16} /> <span className="hidden sm:inline">View History</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-mono transition-colors ${activeTab === 'settings' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}
            >
              <Settings2 size={16} /> <span className="hidden sm:inline">Settings</span>
            </button>
            
            <div className="mt-auto pt-4 border-t border-neutral-800">
              <button 
                onClick={() => { signOut(); onClose(); }} 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-mono text-rose-400 hover:bg-rose-500/10 w-full transition-colors justify-center sm:justify-start"
              >
                <LogOut size={16} /> <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto bg-neutral-950/50">
            {activeTab === 'settings' && (
              <div className="max-w-md flex flex-col gap-6">
                <div className="glass-panel p-5 rounded-xl border border-neutral-800">
                  <h3 className="text-sm font-bold font-mono text-emerald-400 mb-4 flex items-center gap-2"><User size={16}/> Profile Details</h3>
                  <div className="flex flex-col gap-3">
                    <label className="text-xs text-neutral-400 font-mono">Username</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={editUsername}
                        onChange={e => setEditUsername(e.target.value)}
                        disabled={!isEditing}
                        className="flex-1 bg-neutral-900 border border-neutral-700 disabled:border-transparent rounded px-3 py-1.5 text-sm font-mono text-white outline-none"
                      />
                      {isEditing ? (
                        <button onClick={handleUpdateProfile} className="bg-emerald-500 text-neutral-950 px-3 py-1.5 rounded font-bold text-xs uppercase">Save</button>
                      ) : (
                        <button onClick={() => setIsEditing(true)} className="bg-neutral-800 text-neutral-300 px-3 py-1.5 rounded font-bold text-xs uppercase">Edit</button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-xl border border-neutral-800">
                  <h3 className="text-sm font-bold font-mono text-emerald-400 mb-4 flex items-center gap-2"><Shield size={16}/> Privacy Settings</h3>
                  <div className="flex items-center justify-between p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-800 transition-colors" onClick={handleTogglePrivacy}>
                    <div>
                      <h4 className="text-white text-sm font-sans font-semibold">Public Profile</h4>
                      <p className="text-xs text-neutral-500 font-mono">Allow others to see your profile & history</p>
                    </div>
                    <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${profile.isPublic ? 'bg-emerald-500' : 'bg-neutral-700'}`}>
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${profile.isPublic ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'saved' && (
              <div>
                <h3 className="text-sm font-bold font-mono text-emerald-400 mb-4 flex items-center gap-2"><Save size={16}/> Bookmarked Alpha</h3>
                {savedCoins.length === 0 ? (
                  <div className="text-neutral-500 text-sm font-mono">No saved coins yet. Start saving coins from the screener!</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {savedCoins.map(coin => (
                      <div 
                        key={coin.coinId} 
                        className="flex justify-between items-center p-3 glass-panel border border-neutral-800 rounded-lg cursor-pointer hover:border-emerald-500/50 hover:bg-neutral-900 transition-colors"
                        onClick={() => onSelectCoin?.(coin.coinId, coin.coinData)}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-white tracking-wider">${coin.symbol}</span>
                          <span className="text-[10px] text-neutral-500 font-mono break-all font-mono max-w-[200px] sm:max-w-xs overflow-hidden text-ellipsis">{coin.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-neutral-500 font-mono">Saved {coin.actionAt?.seconds ? new Date(coin.actionAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h3 className="text-sm font-bold font-mono text-emerald-400 mb-4 flex items-center gap-2"><History size={16}/> Surveillance Log</h3>
                {viewedCoins.length === 0 ? (
                  <div className="text-neutral-500 text-sm font-mono">You haven't inspected any coins yet.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {viewedCoins.map(coin => (
                      <div 
                        key={coin.coinId} 
                        className="flex justify-between items-center p-3 glass-panel border border-neutral-800 rounded-lg cursor-pointer hover:border-emerald-500/50 hover:bg-neutral-900 transition-colors"
                        onClick={() => onSelectCoin?.(coin.coinId, coin.coinData)}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-white tracking-wider">${coin.symbol}</span>
                          <span className="text-[10px] text-neutral-500 font-mono break-all max-w-[200px] sm:max-w-xs overflow-hidden text-ellipsis">{coin.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-neutral-500 font-mono">Viewed {coin.actionAt?.seconds ? new Date(coin.actionAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
