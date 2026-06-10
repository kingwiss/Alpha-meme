import { doc, getDoc, setDoc, deleteDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { MemeCoin } from '../types';

export const saveCoin = async (userId: string, coin: MemeCoin) => {
  const docRef = doc(db, 'users', userId, 'savedCoins', coin.id);
  await setDoc(docRef, {
    coinId: coin.id,
    symbol: coin.symbol,
    address: coin.address,
    coinData: coin,
    actionAt: serverTimestamp()
  });
};

export const unsaveCoin = async (userId: string, coinId: string) => {
  const docRef = doc(db, 'users', userId, 'savedCoins', coinId);
  await deleteDoc(docRef);
};

export const viewCoin = async (userId: string, coin: MemeCoin) => {
  const docRef = doc(db, 'users', userId, 'viewedCoins', coin.id);
  await setDoc(docRef, {
    coinId: coin.id,
    symbol: coin.symbol,
    address: coin.address,
    coinData: coin,
    actionAt: serverTimestamp()
  });
};
