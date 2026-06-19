import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as authSignOut, getRedirectResult, browserPopupRedirectResolver } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface UserProfile {
  username: string;
  profileImage: string;
  isPublic: boolean;
  isPremium?: boolean;
  createdAt: number;
  updatedAt: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  savedCoinIds: Set<string>;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedCoinIds, setSavedCoinIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    let unsubscribeSavedCoins: (() => void) | undefined;

    // Handle potential redirect results from mobile fallback
    getRedirectResult(auth).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }
      if (unsubscribeSavedCoins) {
        unsubscribeSavedCoins();
        unsubscribeSavedCoins = undefined;
      }

      if (firebaseUser) {
        // Fetch or create profile
        const profileRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeProfile = onSnapshot(profileRef, (snap) => {
          if (snap.exists()) {
            let data = snap.data() as UserProfile;
            if (firebaseUser.email === 'fredwisseh@gmail.com' && !data.isPremium) {
              setDoc(profileRef, { isPremium: true }, { merge: true }).catch(console.error);
              data = { ...data, isPremium: true };
            }
            setProfile(data);
          } else {
            // Document doesn't exist yet, we will create it
            let baseUsername = firebaseUser.displayName || 'User';
            if (baseUsername.length > 64) baseUsername = baseUsername.substring(0, 64);
            const newProfile: any = {
              username: baseUsername,
              profileImage: firebaseUser.photoURL || '',
              isPublic: true,
              isPremium: firebaseUser.email === 'fredwisseh@gmail.com',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            // Create user profile in Firestore
            setDoc(profileRef, newProfile).catch(console.error);
            setProfile(newProfile as UserProfile);
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile snapshot listener error:", error);
          setLoading(false);
        });

        // Listen for user's saved coins
        const savedCoinsRef = collection(db, 'users', firebaseUser.uid, 'savedCoins');
        unsubscribeSavedCoins = onSnapshot(savedCoinsRef, (snap) => {
          const ids = new Set<string>();
          snap.forEach(doc => {
            ids.add(doc.id);
          });
          setSavedCoinIds(ids);
        }, (error) => {
           console.error("Saved coins listener error:", error);
        });
      } else {
        setProfile(null);
        setSavedCoinIds(new Set());
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeSavedCoins) unsubscribeSavedCoins();
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    await signInWithPopup(auth, provider, browserPopupRedirectResolver);
  };

  const signOut = async () => {
    await authSignOut(auth);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const profileRef = doc(db, 'users', user.uid);
    await setDoc(profileRef, { ...data, updatedAt: serverTimestamp() as any }, { merge: true });
  };

  return (
    <AuthContext.Provider value={{ user, profile, savedCoinIds, loading, signInWithGoogle, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
