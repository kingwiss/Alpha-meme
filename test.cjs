const https = require('https');

const fetchBase = () => {
  return new Promise((resolve) => {
    const url = "https://transaction-v1.raydium.io/compute/swap-base-in?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000&slippageBps=50&txVersion=V0";
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
  });
};

const buildTx = (swapResponse) => {
  return new Promise((resolve) => {
    const req = https.request('https://transaction-v1.raydium.io/transaction/swap-base-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    
    req.write(JSON.stringify({
      computeUnitPriceMicroLamports: "1000",
      swapResponse: swapResponse,
      txVersion: 'V0',
      wallet: 'G6tTz17rWcXYbU788gq4wLh9eHq2N6i8h18L2zD8gG9B',
      wrapSol: true,
      unwrapSol: true,
    }));
    req.end();
  });
};

fetchBase().then(async res => {
  console.log("quote:", !!res.data);
  const txRes = await buildTx(res);
  console.log("txRes:", txRes);
});

