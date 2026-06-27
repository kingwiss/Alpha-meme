const { PumpFunSDK } = require('pumpdotfun-sdk');
const { Connection, Keypair } = require('@solana/web3.js');
const { AnchorProvider, Wallet } = require('@project-serum/anchor');

async function main() {
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const wallet = new Wallet(Keypair.generate());
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const sdk = new PumpFunSDK(provider);
  const PublicKey = require('@solana/web3.js').PublicKey;
  const res = await fetch('https://frontend-api.pump.fun/coins/latest');
  const coin = await res.json();
  const mint = new PublicKey(coin.mint);
  const result = await sdk.getBuyInstructionsBySolAmount(wallet.publicKey, mint, 10000n);
  console.log(result.keys ? result.keys.length : 'TransactionInstruction expected');
}

main();
