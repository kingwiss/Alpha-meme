const https = require('https');
const url = "https://transaction-v1.raydium.io/compute/swap-base-in?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000&slippageBps=50&txVersion=V0";

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data.substring(0, 2000)));
});
