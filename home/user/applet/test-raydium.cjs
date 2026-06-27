const https = require('https');
https.get("https://api-v3.raydium.io/compute/swap-base-in?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000&slippageBps=50&txVersion=V0", (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log("API V3 response:", data.substring(0, 1000)));
});

https.get("https://transaction-v1.raydium.io/compute/swap-base-in?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000&slippageBps=50&txVersion=V0", (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log("Transaction V1 response:", data.substring(0, 1000)));
});
